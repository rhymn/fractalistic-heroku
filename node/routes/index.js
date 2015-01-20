try {
  var config = require('../config');
} catch (e) {}

var MeasureRepository = require('./MeasureRepository');
var SettingsRepository = require('./SettingsRepository');
var NotificationRepository = require('./NotificationRepository');

// Grab config constants from environment if we are in production
var url = process.env.MONGOHQ_URL || config.MONGOHQ_URL;
var postmark_api = process.env.POSTMARK_API || config.POSTMARK_API;

// Define some entities
function MeasureEntity(){}
function SettingsEntity(){}

// Define Repositories
var measureRepository = new MeasureRepository.MeasureRepository(url);
var settingsRepository = new SettingsRepository.SettingsRepository(url);
var notificationRepository = new NotificationRepository.NotificationRepository(url, postmark_api);


var notifier = function(measureEntity){

  if(measureEntity.temp > 65)
  {
    return notificationRepository.notify({
        subject:'Fractalistic temperaturvarning', 
        message: "Temperaturen är över 65 grader.\n\nHälsningar,\npannan"
    });
  }
  else if(measureEntity.temp < 50)
  {
    return notificationRepository.notify({
        subject:'Fractalistic temperaturvarning', 
        message: "Temperaturen är under 50 grader.\n\nHälsningar,\npannan"
    });
  }

}


/**
 * temp in C
 * speed in m/s
 */
function windchillSteadmann (temp, speed) {  
  return 1.41 - 1.1620 * speed + 0.9800 * temp + 0.0124 * speed * speed + 0.0185 * speed * temp;
}


exports.index = function(req, res){
  isLocal = false;

  if(req.headers.host.split(':')[0] == 'localhost'){
    isLocal = true;
  }

  res.render('index', { title: 'fractalistic', 'local': isLocal });
};



// API

exports.getweatherdata = function(req, res){
  var request = require('request');

  request({
    'url': 'http://opendata-download-metfcst.smhi.se/api/category/pmp1.5g/version/1/geopoint/lat/57.26/lon/12.41/data.json',
    'json': true

  }, function(error, response, body){

    if (!error && response.statusCode === 200) {

      var date = new Date();

      var length = body.timeseries.length;

      for (var i=1; i<length; i++) {
        var time1 = body.timeseries[i-1]['validTime'];
        var time2 = body.timeseries[i]['validTime'];

        if (Date.parse(time1) < Date.parse(date) && Date.parse(time2) > Date.parse(date)) {
          var weatherdata = body.timeseries[i];
          break;
        }
      }

      weatherdata['relTemp'] = Math.round(windchillSteadmann(weatherdata['t'], weatherdata['ws']));

      res.send(weatherdata);

    }

  });

};



exports.getsettings = function(req, res){
  settingsRepository.findOne(1, function(entity){
    res.json(entity);
  });
}


exports.setsettings = function(req, res){
  var settingsEntity = new SettingsEntity();

  settingsEntity.mode = req.query.mode || null;

  if(settingsEntity.mode != 'home' && settingsEntity.mode != 'away'){
    res.json(422, {'message':'Bad'});
    return;
  }

  settingsEntity.date = new Date();

  settingsRepository.persist(settingsEntity);

  res.json(settingsEntity);
};




exports.getstat = function(req, res){
  measureRepository.findOne(1, function(entity){
    res.json(entity);
  });
}



exports.setstat = function(req, res){
  var measureEntity = new MeasureEntity();

  measureEntity.date = new Date();
  measureEntity.temp = req.params.temp;
  measureEntity.mode = req.params.mode;
  measureEntity.output = req.params.output;
  measureEntity.outputRes = req.params.outputRes;

  notifier(measureEntity);

  measureRepository.persist(measureEntity);

  res.json(measureEntity);
};
