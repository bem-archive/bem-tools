var vows = require('vows'),
    assert = require('assert'),
    PATH = require('../lib/path');

function absolute(path) {
    return PATH.absolute(path, __dirname);
}

vows.describe('path').addBatch({

    'relative() call with params': {
        topic: function() {
            return PATH.relative;
        },
        "('./', './data/') resolves to 'data/'": function(topic) {
            assert.equal(topic(absolute('./'), absolute('./data/')), PATH.unixToOs('data/'));
        },
        "('./data/', '../lib') resolves to '../lib'": function(topic) {
            assert.equal(topic(absolute('./data/'), absolute('../lib')), PATH.unixToOs('../../lib'));
        },
        "('./file.js', '../lib') resolves to '../lib'": function(topic) {
            assert.equal(topic(absolute('./file.js'), absolute('../lib')), PATH.unixToOs('../lib'));
        }
    }

}).export(module);
