'use strict';

(function(p2psync) {

    var crypto = window.crypto || window.msCrypto;
    // database key for the keys
    var keyName = 'p2psyncKey';
    // encryption key to use for all operations
    var aesKey;

    var keyStore;

    function generateNewKey() {
        return crypto.subtle.generateKey(
            {
                name: 'AES-CBC',
                length: 128
            },
            true,
            ['encrypt', 'decrypt']
        ).
        then(function(key) {
            return keyStore.saveKey(key, keyName);
        }).
        catch(function(err) {
            console.error('Could not create and save new key: ' + err.message);
        });
    }

    var keyPromise = crypto.subtle.generateKey(
        {name: 'AES-CBC', length: 128}, // Algorithm the key will be used with
        true,                           // Can extract key value to binary string
        ['encrypt', 'decrypt']          // Use for these operations
    );

    keyPromise.then(function(key) {aesKey = key;});
    keyPromise.catch(function(err) {console.error('Key generation failed: ' + err.message);});

    function getExistingKey() {
        return keyStore.getKey('name', keyName)
            .then(function(storedKey) {
                if (!storedKey) {
                    return null;
                }
                return algorithm.importKey(
                    'raw',
                    storedKey.raw,                
                    {name: 'AES-CBC', length: 128}, 
                    true, // extractable
                    ['encrypt', 'decrypt'] // Use for these operations
                ).
                then(function(key) { return key;}).
                catch(function(err) {console.error('Something went wrong: ' + err.message);});    
            }).
            catch(function(err) {console.error('Something went wrong: ' + err.message);});
    }

    var iv = crypto.getRandomValues(new Uint8Array(16));
    var param = {name: 'AES-CBC', iv: iv};

    var algorithm = crypto.subtle;
    function getBytes(str) {
        var bytes = new Uint8Array(str.length);
        for (var i=0; i<str.length; i++) {
            bytes[i] = str.charCodeAt(i);
        }
        return bytes;
    }

    function getString(bytes) {
        var str = '';
        var byteArr =  new Uint8Array(bytes);
        for (var i=0; i < byteArr.length; i++) {
            str += String.fromCharCode(byteArr[i]);
        }
        return str;
    }

    p2psync.getKey = function() {
        keyStore = p2psync.keyStore;
        return getExistingKey()
            .then(function(key) {
                if (!key) {
                    return generateNewKey().then(function(newKey) {
                        return newKey;
                    });
                }
                return key;
            })
            .catch(function(err) {
                console.error('Error while looking for existing key: ' + err);
            });
    };

    p2psync.getKeyRaw = function() {
        return p2psync.getKey().then(function(key) {
            return algorithm.exportKey('raw', key).
                then(function(raw) {
                    return raw;
                });
        });
    };

    p2psync.encrypt = function(data) {

        return algorithm.encrypt(
            param,
            aesKey,
            getBytes(JSON.stringify(data))
        );
    };

    p2psync.decrypt = function(data) {
        return new Promise(function(resolve, reject) {
            var arr = new Uint8Array(data);
            algorithm.decrypt(
                param,
                aesKey,
                arr.buffer
            )
            .then(function(decrypted) {
                resolve(getString(decrypted));
            })
            .catch(function(err) {
                reject(err);
            });
        });
    };

}(p2psync));