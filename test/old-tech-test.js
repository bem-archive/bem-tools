var vows = require('vows'),
    assert = require('assert'),
    Tech = require('../lib/tech').Tech;

vows.describe('tech').addBatch({

    "Tech.createTech('../lib/techs/css') /* bem bundled tech */": {
        topic: function() {
            return Tech.createTech(require.resolve('../lib/techs/css'));
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
        ".getTechRelativePath() resolves to 'bem/lib/techs/css'": function(tech) {
            assert.equal(tech.getTechRelativePath(), 'bem/lib/techs/css');
        }
    },

    "Tech.createTech('../lib/techs/default', 'def') /* default tech with custom name */": {
        topic: function() {
            return Tech.createTech(require.resolve('../lib/techs/default'), 'def');
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
        ".getTechRelativePath() resolves to '' (empty string)": function(tech) {
            assert.equal(tech.getTechRelativePath(), '');
        }
    },

    "Tech.createTech('./data/techs/test.js') /* custom tech */": {
        topic: function() {
            return Tech.createTech(require.resolve('./data/techs/test.js'));
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
        ".getTechRelativePath('./') resolves to 'data/techs/test.js'": function(tech) {
            assert.equal(tech.getTechRelativePath(__dirname), 'data/techs/test.js');
        }
    }

}).export(module);
