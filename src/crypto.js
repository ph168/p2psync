'use strict';

(function(p2psync) {

    var crypto = window.crypto || window.msCrypto;
    var subtle = crypto.subtle;

    // indexedDB store name for known keys in this domain
    var keyName = 'p2psyncKey';

    function generateNewKey(keyStore) {
        console.log('Generating new key');
        return subtle.generateKey(
            {
                name: 'AES-CBC',
                length: 128
            },
            true, // keep extractable for later reuse and transfer to other clients
            ['encrypt', 'decrypt']
        ).
        then(function(key) {
            return keyStore.saveKey(key, keyName);
        }).
        catch(function(err) {
            console.error('Could not create and save new key: ' + err.message);
        });
    }

    function getExistingKey(keyStore) {
        return keyStore.getKey('name', keyName)
            .then(function(storedKey) {
                if (!storedKey) {
                    return null;
                }
                console.log('Found existing key');
                return subtle.importKey(
                    'raw',
                    storedKey.raw,                
                    {name: 'AES-CBC', length: 128}, 
                    true, // extractable
                    ['encrypt', 'decrypt'] // Use for these operations
                ).
                then(function(key) { return key;}).
                catch(function(err) {console.error('Could not import key: ' + err.message);});    
            }).
            catch(function(err) {console.error('Could not access key store: ' + err.message);});
    }

    function ensureKey(keyStore) {
        return getExistingKey(keyStore).then(function(key) {
            if (!key) {
                return generateNewKey(keyStore).then(function(newKey) {
                    return newKey;
                });
            }
            return key;
        })
        .catch(function(err) {
            console.error('Error while looking for existing key: ' + err);
        });
    }

    /**
    * Instantiates a new crypto service with a given key
    */
    p2psync.createCryptoService = function() {

        var keyStore = new p2psync.KeyStore();

        function createService(keyStore) {
            return ensureKey(keyStore)
                .then(function(key) {
                    return new CryptoService(key);
                });
        }
        return keyStore
            .open()
            .then(createService);
    };

    function CryptoService(key) {
        this.key = key;
        this.params = ensureParams();
    }

    function toArrayBuffer(str) {
        var bytes = new Uint8Array(str.length);
        for (var i=0; i<str.length; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes;
    }

    function arrayBufferToString(bytes) {
        var str = '';
        var byteArr =  new Uint8Array(bytes);
        for (var i=0; i < byteArr.length; i++) {
            str += String.fromCharCode(byteArr[i]);
        }
        return str;
    }

    function ensureParams() {
        var lsKey = 'ivParameter';
        if (localStorage[lsKey]) {
            var stored = JSON.parse(localStorage[lsKey]);
            // reconstruct iv array
            var iv = new Uint8Array(16);
            for (var key in stored.iv) {
                iv[parseInt(key)] = stored.iv[key];
            }
            stored.iv = iv;
            return stored;
        }
        var params = newParams();
        localStorage[lsKey] = JSON.stringify(params);
        return params;
    }

    function newParams() {
        var iv = crypto.getRandomValues(new Uint8Array(16));
        return {name: 'AES-CBC', iv: iv};
    }

    CryptoService.prototype.getKeyRaw = function() {
        return subtle.exportKey('raw', this.key);
    };

    CryptoService.prototype.encrypt = function(data) {
        return subtle.encrypt(
            this.params,
            this.key,
            toArrayBuffer(JSON.stringify(data))
        );
    };

    CryptoService.prototype.decrypt = function(data) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var arr = new Uint8Array(data);
            subtle.decrypt(
                self.params,
                self.key,
                arr.buffer
            )
            .then(function(decrypted) {
                resolve(arrayBufferToString(decrypted));
            })
            .catch(function(err) {
                reject(err);
            });
        });
    };

}(p2psync));