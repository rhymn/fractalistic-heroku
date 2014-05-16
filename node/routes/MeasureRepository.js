var mongo = require('mongodb');

function MeasureRepository(){
  this.url = process.env.MONGOHQ_URL || 'mongodb://fractalistic:fractalistic-pwd@troup.mongohq.com:10080/fractalistic';
}

MeasureRepository.prototype.persist = function(entity){
  mongo.Db.connect(this.url, function (err, db) {
    db.collection('stat', function(er, collection) {
      collection.update({key:1}, {$set:{'mode': entity.mode, 'date': entity.date, 'temp': entity.temp, 'output': entity.output, 'outputRes': entity.outputRes}}, {safe: true}, function(er,rs) {
        if (!er) {
          return true;
        }
      });
    });
  });  
};

MeasureRepository.prototype.findOne = function(id, callback){
  mongo.Db.connect(this.url, function (err, db) {
    db.collection('stat', function(er, collection) {
      collection.findOne({key:id}, function(er, item) {
        callback(item);
      });
    });
  });
}

module.exports.MeasureRepository = MeasureRepository;
module.exports.MeasureRepository.persist = MeasureRepository.prototype.persist;
module.exports.MeasureRepository.findOne = MeasureRepository.prototype.findOne;