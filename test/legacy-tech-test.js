var vows = require('vows'),
    assert = require('assert'),
    Tech = require('../lib/legacy-tech.js').Tech,
    PATH = require('../lib/path');

vows.describe('tech').addBatch({

    "new Tech('../lib/legacy-techs/css')": {
        topic: function() {
            return new Tech(require.resolve('../lib/legacy-techs/css'));
        },
        ".getTechName() equals to 'css'": function(tech) {
            assert.equal(tech.getTechName(), 'css');
        },
        ".fileByPrefix('file') equals to 'file.css'": function(tech) {
            assert.equal(tech.fileByPrefix('file'), 'file.css');
        },
        ".matchSuffix('.css') returns true": function(tech) {
            assert.isTrue(tech.matchSuffix('.css'));
        },
        ".getTechRelativePath() resolves to 'bem/lib/legacy-techs/css'": function(tech) {
            assert.equal(tech.getTechRelativePath(), PATH.unixToOs('bem/lib/legacy-techs/css'));
        }
    },

    "new Tech('../lib/legacy-techs/default', 'def')": {
        topic: function() {
            return new Tech(require.resolve('../lib/legacy-techs/default'), 'def');
        },
        ".getTechName() equals to 'def'": function(tech) {
            assert.equal(tech.getTechName(), 'def');
        },
        ".fileByPrefix('file') equals to 'file.def'": function(tech) {
            assert.equal(tech.fileByPrefix('file'), 'file.def');
        },
        ".matchSuffix('.def') returns true": function(tech) {
            assert.isTrue(tech.matchSuffix('.def'));
        },
        ".getTechRelativePath() resolves to 'bem/lib/legacy-techs/default'": function(tech) {
            assert.equal(tech.getTechRelativePath(), PATH.unixToOs('bem/lib/legacy-techs/default'));
        }
    },

    "new Tech('./data/techs/test.js')": {
        topic: function() {
            return new Tech(require.resolve('./data/techs/test.js'));
        },
        ".getTechName() equals to 'test.js'": function(tech) {
            assert.equal(tech.getTechName(), 'test.js');
        },
        ".fileByPrefix('file') equals to 'file.test.js'": function(tech) {
            assert.equal(tech.fileByPrefix('file'), 'file.test.js');
        },
        ".matchSuffix('.test.js') returns true": function(tech) {
            assert.isTrue(tech.matchSuffix('.test.js'));
        },
        ".getTechRelativePath('./') resolves to './data/techs/test.js'": function(tech) {
            assert.equal(tech.getTechRelativePath(__dirname), PATH.unixToOs('./data/techs/test.js'));
        }
    }

}).export(module);
