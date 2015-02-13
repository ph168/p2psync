// http://stackoverflow.com/a/22281812
var PeerServer = require('peer').PeerServer;
var server = PeerServer({port: 9000, path: '/'});
var peers = {};

server.on('connection', function(id) {
  console.log('connect ' + id);
  peers[id] = 'foo';
  console.log(peers);
});
server.on('disconnect', function(id) {
  console.log('disconnect ' + id);
  delete peers[id];
  console.log(peers);
});

var express = require('express')
var app = express();
app.listen(3000);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.get('/peers', function(req, res) {
  return res.json(peers);
});