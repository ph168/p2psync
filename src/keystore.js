'use strict';

(function() {
    function KeyStore() {
        this.db = null;
        this.dbName = 'KeyStore';
        this.objectStoreName = 'keys';
    }

    /**
    * Opens the key store
    */
    KeyStore.prototype.open = function() {
        var self = this;
        return new Promise(function(fulfill, reject) {
            var req = indexedDB.open(self.dbName, 1);
            req.onerror = function(evt) {
                reject(evt.error);
            };
            req.onblocked = function(evt) {
                reject(new Error('Database already open. ' + evt.error));
            };
            req.onsuccess = function(evt) {
                self.db = evt.target.result;
                fulfill(self);
            };
            req.onupgradeneeded = function(evt) {
                self.db = evt.target.result;
                if (!self.db.objectStoreNames.contains(self.objectStoreName)) {
                    var objectStore = self.db.createObjectStore(
                        self.objectStoreName, {autoIncrement: true});
                    objectStore.createIndex('name', 'name', {unique: false});
                    objectStore.createIndex('raw', 'raw', {unique: false});
                }
            };
        });
    };

    /**
    * finishes up the keystore access
    */
    KeyStore.prototype.close = function() {
        var self = this;
        return new Promise(function(fulfill){
            self.db.close();
            self.db = null;
            fulfill();
        });
    };

    /**
    * Stores a key by name
    */
    KeyStore.prototype.saveKey = function(key, name) {
        var self = this;
        return new Promise(function(fulfill, reject) {
            if (!self.db) {
                reject(new Error('KeyStore is not open.'));
            }

            window.crypto.subtle.exportKey('raw', key).
            then(function(raw) {
                var savedObject = {
                    key:  key,
                    name: name,
                    raw:  raw
                };

                var transaction = self.db.transaction([self.objectStoreName], 'readwrite');
                transaction.onerror = function(evt) {reject(evt.error);};
                transaction.onabort = function(evt) {reject(evt.error);};
                transaction.oncomplete = function() {fulfill(savedObject);}; // evt

                var objectStore = transaction.objectStore(self.objectStoreName);
                objectStore.add(savedObject); // var request = 
            }).
            catch(function(err) {
                reject(err);
            });
        });
    };

    /**
    * Queries for a key by the given index and value at that index
    */
    KeyStore.prototype.getKey = function(propertyName, propertyValue) {
        var self = this;
        return new Promise(function(fulfill, reject) {

            if (!self.db) {
                reject(new Error('KeyStore is not open.'));
            }

            var transaction = self.db.transaction([self.objectStoreName], 'readonly');
            var objectStore = transaction.objectStore(self.objectStoreName);
            var request;
            if (propertyName === 'id') {
                request = objectStore.get(propertyValue);
            } else if (propertyName === 'name') {
                request = objectStore.index('name').get(propertyValue);
            } else if (propertyName === 'raw') {
                request = objectStore.index('raw').get(propertyValue);
            } else {
                reject(new Error('No such property: ' + propertyName));
            }

            request.onsuccess = function(evt) {
                fulfill(evt.target.result);
            };
            request.onerror = function(evt) {
                reject(evt.error);
            };
        });
    };

    /**
    * lists all keys stored for the current domain
    */
    KeyStore.prototype.listKeys = function() {
        var self = this;
        return new Promise(function(fulfill, reject) {
            if (!self.db) {
                reject(new Error('KeyStore is not open.'));
            }

            var list = [];

            var transaction = self.db.transaction([self.objectStoreName], 'readonly');
            transaction.onerror = function(evt) {reject(evt.error);};
            transaction.onabort = function(evt) {reject(evt.error);};

            var objectStore = transaction.objectStore(self.objectStoreName);
            var cursor = objectStore.openCursor();

            cursor.onsuccess = function(evt) {
                if (evt.target.result) {
                    list.push({id: evt.target.result.key, value: evt.target.result.value});
                    evt.target.result.continue();
                } else {
                    fulfill(list);
                }
            };
        });
    };

    p2psync.KeyStore = KeyStore;
}());