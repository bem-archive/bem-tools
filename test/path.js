var vows = require('vows'),
    assert = require('assert'),
    myPath = require('../lib/path');

function absolute(path) {
    return myPath.absolute(path, __dirname);
}

vows.describe('path').addBatch({

    'relative() call with params': {
        topic: function() {
            return myPath.relative;
        },
        "('./', './data/') resolves to 'data/'": function(topic) {
            assert.equal(topic(absolute('./'), absolute('./data/')), 'data/');
        },
        "('./data/', '../lib') resolves to '../lib'": function(topic) {
            assert.equal(topic(absolute('./data/'), absolute('../lib')), '../../lib');
        },
        "('./file.js', '../lib') resolves to '../lib'": function(topic) {
            assert.equal(topic(absolute('./file.js'), absolute('../lib')), '../lib');
        }
    }

}).export(module);
