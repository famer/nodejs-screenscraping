var http = require('http');
var path = require('path');

var express = require('express');

var router = express();
var server = http.createServer(router);


router.get('/', function(req, res) { 
    res.send("Asdf");
    });
    


server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
