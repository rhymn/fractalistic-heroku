var mongo = require('mongodb');

function NotificationRepository(url, postmark_api){
  this.url = url;
  this.postmark_api = postmark_api;
}

NotificationRepository.prototype.notify = function(msg){
  var postmark = require('postmark')(this.postmark_api);  

  postmark.send({
    "From":"david@jord.io",
    "To":"david@pnd.se",
    "Subject": msg.subject,
    "TextBody": msg.message
  }, function(error, success){
    if(error)
    {
      console.error(error.message);
      return;
    }
  });

  this.persist({date:new Date});
}

NotificationRepository.prototype.persist = function(entity){
  mongo.Db.connect(this.url, function (err, db) {
    db.collection('notification', function(er, collection) {
      collection.update({key:1}, {$set:{'date': entity.date}}, {safe: true}, function(er,rs) {
        if (er){
          console.log(er);
        }
        if (!er) {
          return true;
        }
      });
    });
  });  
};

NotificationRepository.prototype.findOne = function(id, callback){
  mongo.Db.connect(this.url, function (err, db) {
    db.collection('notification', function(er, collection) {
      collection.findOne({key:id}, function(er, item) {
        callback(item);
      });
    });
  });
}

module.exports.NotificationRepository = NotificationRepository;
module.exports.NotificationRepository.notify = NotificationRepository.prototype.notify;
module.exports.NotificationRepository.persist = NotificationRepository.prototype.persist;
module.exports.NotificationRepository.findOne = NotificationRepository.prototype.findOne;
