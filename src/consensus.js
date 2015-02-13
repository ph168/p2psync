'use strict';

window.p2psync = {

  peer: null,
  peers: [],

  start: function(params) {
    p2psync.peer = new Peer({host: params.host || 'localhost', port: params.port || 9000});
    var done = null;
    p2psync.peer.on('open', function() {
      superagent.get(params.peerUrl || 'http://localhost:3000/peers').end(function(res) {
        p2psync.peers = Object.keys(res.body);
        if (done != null) {
          var keyStore = new window.KeyStore();
          var openP = keyStore.open().
            catch(function(err) {
                alert('Could not open key store: ' + err.message);
            });
          p2psync.keyStore = keyStore;
          openP.then(function() {
            done(p2psync);
          });
        }
      });
    });
    p2psync.peer.on('connection', function(conn) {
      console.log('connection from peer opened');
      conn.on('data', function(data) {
        console.log('Received ' + data);
      });
    });
    return {
      done: function(cb) {
        done = cb;
      }
    };
  },

  sync: function(config) {
    p2psync.peers.forEach(function(peer) {
      var conn = p2psync.peer.connect(peer);
      conn.on('open', function() {
        console.log('sending data to peer ' + peer);
        conn.send(config.data);
      });
    });
    // ?
    return {
      done: function() {
        return {
          fail: function() {}
        }
      }
    };
  }
};