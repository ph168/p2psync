'use strict';

window.p2psync = {

  peers: [],

  start: function(params) {
    var peer = new Peer({host: params.host || 'localhost', port: params.port || 9000});
    var done = null;
    peer.on('open', function() {
      console.log('open');
      superagent.get(params.peerUrl || 'http://localhost:3000/peers').end(function(res) {
        p2psync.peers = Object.keys(res.body);
        if (done != null) {
          done(p2psync);
        }
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
      console.log('syncing with ' + peer);
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