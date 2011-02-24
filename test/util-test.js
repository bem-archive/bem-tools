var vows = require('vows'),
    assert = require('assert'),
    bemUtil = require('../lib/util');

vows.describe('util').addBatch({

    'getBemTechPath() call with param': {
        topic: function() {
            return bemUtil.getBemTechPath;
        },
        "'css' resolves to 'bem/lib/techs/css'": function(topic) {
            assert.equal(topic('css'), 'bem/lib/techs/css');
        },
        "'custom' resolves to 'bem/lib/techs/default'": function(topic) {
            assert.equal(topic('custom'), 'bem/lib/techs/default');
        }
    },

    'isRequireable() call with param': {
        topic: function() {
            return bemUtil.isRequireable;
        },
        "'path' returns true": function(topic) {
            assert.isTrue(topic('path'));
        },
        "'unexistent-module' returns false": function(topic) {
            assert.isFalse(topic('unexistent-module'));
        }
    },

    'isPath() call with param': {
        topic: function() {
            return bemUtil.isPath;
        },
        "'/path/to/file' returns true": function(topic) {
            assert.isTrue(topic('/path/to/file'));
        },
        "'./path/to/file' returns true": function(topic) {
            assert.isTrue(topic('./path/to/file'));
        },
        "'path/to/file' returns true": function(topic) {
            assert.isTrue(topic('path/to/file'));
        },
        "'file' returns false": function(topic) {
            assert.isFalse(topic('file'));
        },
        "'file.ext' returns false": function(topic) {
            assert.isFalse(topic('file.ext'));
        }
    }

}).export(module);
