//
// # ImageApi
//
// An API that takes a search term and returns image info, as well as displays recent searches
//
var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');

var mongoose = require("mongoose");
var mongouri = process.env.MONGOLAB_URI || "mongodb://"+process.env.IP+":27017/imgapi";
mongoose.connect(mongouri);

var Schema = mongoose.Schema;
var recentSchema = new Schema({
  search: String,
  date: Date
});
var Recent = mongoose.model('recent', recentSchema);
module.exports = Recent;

var MongoClient = require('mongodb');

router.get("/", function(req,res){
  res.sendfile(__dirname+'/client/index.html');
});

router.get("/recent", function(req, res) {
    MongoClient.connect("mongodb://"+process.env.IP+":27017/imgapi",function(err,db){
      if(err) throw err;
      Recent.find({}, function(err,docs){
        if(err) throw err;
        console.log(docs);
      }).sort({"date":-1}).then(function(docs){
        var searches = [];
        for(var i in docs){
          searches.push({"search": docs[i].search, "date": docs[i].date});
        }
        res.send(searches);
      },function(err){
        if(err)throw err;
      });
      // var cursor = db.collection("recent").find().sort({"date":-1});
      // cursor.each(function(err, doc){
      //   if(err) throw err;
      //   searches.push(doc);
      // });
      // res.json({"searches":searches});
    });
});

router.get("/search/",function(req, res) {
    var params = req.query;
    if(params.image!==null || params.image!==""){
      var term = params.image;
      var pg = isNaN(params.offset) ? 1 : (params.offset - 1)*10 + 1;
      var baseUrl = "https://www.googleapis.com/customsearch/v1?num=10";
      baseUrl += "&q="+term;
      baseUrl += "&start="+pg;
      baseUrl += "&cx="+process.env.CX;
      baseUrl += "&key="+process.env.APIKey;
      
      request(baseUrl,{json:true},function(error,response,data){
        if(error===null && response.statusCode===200){
          var results = data.items.map(function(item){
            return {
              image_url: item.pagemap.cse_image[0].src,
              page_url: item.link,
              alt_text: item.title
            };
          });
          
          //log DB entry
          var newRecent = Recent({
            search:term,
            date:Date.now()
          });
          newRecent.save(function(err){
            if(err) throw err;
            console.log("Recent search logged");
          });
          // MongoClient.connect("mongodb://"+process.env.IP+":27017/imgapi",function(err,db){
          //   if(err) throw err;
          //   db.collection("recent").insert({"search":term,"date": Date.now()});
          //   db.close();
          // });
          
          res.json(results);
        }else{
          res.json({error: 'unable to reach api'});
        }
      });
    }else{
      res.json({error: 'incorrect search syntax'});
    }
});

// var home = require('./');
app.use("/",router);

var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var port = server.address().port;
  console.log("Server listening at port " + port);
});