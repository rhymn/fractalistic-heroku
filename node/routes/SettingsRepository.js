var mongo = require('mongodb');

function SettingsRepository(url){
  this.url = url;
}

SettingsRepository.prototype.persist = function(entity){
  mongo.Db.connect(this.url, function (err, db) {
    db.collection('settings', function(er, collection) {
      collection.update({key:1}, {$set:{'mode': entity.mode, 'date': entity.date}}, {safe: true}, function(er,rs) {
        if (!er) {
          return true;
        }
      });
    });
  });
}

SettingsRepository.prototype.findOne = function(id, callback){
  mongo.Db.connect(this.url, function (err, db) {
    db.collection('settings', function(er, collection) {
      collection.findOne({key:id}, function(er, item) {
        callback(item);
      });
    });
  });

}

module.exports.SettingsRepository = SettingsRepository;
module.exports.SettingsRepository.persist = SettingsRepository.prototype.persist;
module.exports.SettingsRepository.findOne = SettingsRepository.prototype.findOne;
