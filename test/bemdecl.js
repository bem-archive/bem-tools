'use strict';

var assert = require('chai').assert,
    buildBemdeclByBemjson = require('..').require('./techs/v2/bemdecl.js.js').techMixin.buildBemdeclByBemjson;

/**
 * Mocha BDD interface.
 */
/** @name describe @function */
/** @name it @function */
/** @name before @function */
/** @name after @function */
/** @name beforeEach @function */
/** @name afterEach @function */

describe('BEMDECL', function() {
    describe('buildBemdeclByBemjson:', function() {
        it('should properly parse custom content fields', function() {
            assert.deepEqual(
                buildBemdeclByBemjson({
                    block: 'b',
                    bem: { block: 'bla4' },
                    tag: { block: 'bla5' },
                    attrs: { block: 'bla6' },
                    cls: { block: 'bla7' },
                    js: { block: 'bla8' },
                    custom1: { block: 'b1' },
                    custom2: {
                        a1: { block: 'a1' },
                        a2: { block: 'a2' }
                    },
                    mix: [ { block: 'c' } ],
                    content: { block: 'd' }
                }),
                [
                  { name: 'b' },
                  { name: 'b1' },
                  { name: 'a1' },
                  { name: 'a2' },
                  { name: 'c' },
                  { name: 'd' }
                ]
            );
        });
    });
});
