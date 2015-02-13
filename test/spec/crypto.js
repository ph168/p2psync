'use strict';

describe('crypto', function() {

    var p2p;

    beforeEach(function () {
        p2p = window.p2psync.start();
        spyOn(window.p2psync.encrypt);
    });

    it('should encrypt data sent on ', function () {
        p2p.sync({ data: 'abc' })
            .then(function(data) {
                expect(window.p2psync.encrypt).toHaveBeenCalled();
                expect(new Uint8Array(data)).toEqual([ 1, 2, 3 ]); // TODO real numbers
            });
    });

});