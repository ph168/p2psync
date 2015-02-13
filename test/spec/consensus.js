'use strict';

describe('consensus', function() {

    var consensus;

    beforeEach(function() {
        consensus = new window.p2psync.Consensus();
    });

    it('should not be ready at the beginning', function () {
        expect(consensus.ready).toBe(false);
    });

});