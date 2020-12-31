const fetch = require("node-fetch");

const checkResultFetch = (somLat, somLon, key) => {
  try {
    return fetch(
      `https://api.openweathermap.org/data/2.5/onecall?lat=${somLat}&lon=${somLon}&exclude=hourly&appid=${key}`
    );
  }

  catch {
    return null;
  }
}

const checkToken = (someToken, tokenKey) => {
  try {
    return jwt.verify(someToken, tokenKey);
  }

  catch (err) {
    return null;
  }
}

module.exports = {
  getWeathers: async (req, res) => {
    const apiKey = process.env.WEATHER_API_KEY;
    const lat = req.query.lat || 37.507353;
    const lon = req.query.lon || 127.057288;
    const apiCall = await checkResultFetch(lat, lon, apiKey);

    if (!apiCall) {
      return res.status(503).json({
        message: 'Service Unavailable'
      });
    }

    const jsonData = await apiCall.json();

    let weatherData = [];

    const extractData = (obj) => {
      let data = {};

      if (typeof obj.temp === 'object') {
        obj.temp = obj.temp.day;
      }

      if (typeof obj.feels_like === 'object') {
        obj.feels_like = obj.feels_like.day;
      }

      delete obj.weather[0].id;

      data.dt = obj.dt;
      data.temp = Math.round((obj.temp - 273.15) * 100) / 100;
      data.feels_like = Math.round((obj.feels_like - 273.15) * 100) / 100;
      data.weather = obj.weather;

      weatherData.push(data);
      return;
    }

    extractData(jsonData.current);

    for (let n = 0; n < jsonData.daily.length; n++) {
      extractData(jsonData.daily[n]);
    }

    //-------여기까지 날씨 정보 뽑아내기.

    const authorization = req.headers.authorization;

    if (!authorization) {
      for (let i = 0; i < weatherData.length; i++) {
        delete weatherData[i].feels_like;
      }

      return res.status(203).json({
        data: weatherData
      });
    }

    const accessToken = authorization.split(' ')[1];
    const tokenData = checkToken(accessToken, process.env.ACCESS_SECRET);

    if (!tokenData) {
      return res.status(401).json({
        message: 'expired token'
      });
    }

    const userInfo = await users.findOne({
      where: { id: tokenData.id, name: tokenData.name, email: tokenData.email }
    });

    if (!userInfo) {
      return res.status(400).json({
        message: 'Unauthorized'
      });
    }

    res.status(200).json({
      data: weatherData
    })
  }
}