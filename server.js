//
// # ImageApi
//
// An API that takes a search term and returns image info, as well as displays recent searches
//
var http = require("http");
var express = require('express');
var app = express();
var router = express.Router();
var request = require('request');

router.get("/", function(req,res){
  res.sendfile(__dirname+'/client/index.html');
});

router.get("/recent/", function(req, res) {
    
});

router.get("/search/",function(req, res) {
    var params = req.query;
    if(params.image!==null || params.image!==""){
      var term = params.image;
      var pg = isNaN(params.page) ? 1 : (params.page - 1)*10 + 1;
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