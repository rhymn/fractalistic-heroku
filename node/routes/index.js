try {
  var config = require('../config');
} catch (e) {}

var MeasureRepository = require('./MeasureRepository');
var SettingsRepository = require('./SettingsRepository');

var url = process.env.MONGOHQ_URL || config.MONGOHQ_URL;
var postmark_api = process.env.POSTMARK_API || config.POSTMARK_API;

function MeasureEntity(){}
function SettingsEntity(){}

var measureRepository = new MeasureRepository.MeasureRepository(url);
var settingsRepository = new SettingsRepository.SettingsRepository(url);


var notifier = function(msg){

  if(msg.temp > 55 && msg.temp < 68)
  {
    return;
  }


  var postmark = require('postmark')(postmark_api);

  postmark.send({
    "From":"david@jord.io",
    "To":"david@pnd.se",
    "Subject":"Fractalistic temperaturvarning",
    "TextBody":"Temperaturen är " + msg.temp + " grader.\n\nHälsningar,\npannan"
  }, function(error, success){
    if(error)
    {
      console.error(error.message);
      return;
    }
  });
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

  measureRepository.persist(measureEntity);

  notifier(measureEntity);

  res.json(measureEntity);
};
