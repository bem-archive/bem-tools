var Q = require('q'),
    vows = require('vows'),
    assert = require('assert'),
    PATH = require('../lib/path'),
    createTech = require('../lib/tech').createTech;

function testBaseTech(techPath, techAlias) {
    var batch = {},
        techName = PATH.basename(techPath),
        absTechPath = require.resolve(PATH.resolve(__dirname, techPath)),
        relTechPath = techPath;

    // NOTE: techPath will be always in unix format
    if(/^\.\.\/lib\//.test(techPath)) {
        relTechPath = techPath.replace(/^\.\.\/lib\//, 'bem/lib/');

        // default tech identified by '' relative path
        if(techName == 'tech') relTechPath = '';
    }

    techAlias = techAlias || techName;

    batch["Tech.createTech('" + techPath + "')"] = {

        topic: function() {
            return createTech(require.resolve(techPath),
                techAlias == techName ? null : techAlias);
        },

        // meta data
        ".getTechName()": function(tech) {
            assert.equal(tech.getTechName(), techAlias);
        },

        ".getSuffixes()" : {

            topic: function(tech) {
                return tech.getSuffixes();
            },

            "returns array": function(suffixes) {
                assert.instanceOf(suffixes, Array);
            },

            "returns all suffixes": function(suffixes) {
                assert.deepEqual(suffixes, [techAlias]);
            }

        },

        ".matchSuffix()": function(tech) {
            tech.getSuffixes().forEach(function(suffix) {
                assert.isTrue(tech.matchSuffix(suffix));
                assert.isTrue(tech.matchSuffix('.' + suffix));
            });
        },

        ".getTechPath()": function(tech) {
            assert.equal(tech.getTechPath(), absTechPath);
        },

        ".getTechRelativePath()": function(tech) {
            assert.equal(tech.getTechRelativePath(__dirname), PATH.unixToOs(relTechPath));
        },

        // create
        ".create()": {},

        ".getCreateResult()": {},

        ".getCreateResults()": {
            topic: function(tech) {
                var _this = this;
                Q.when(
                    tech.getCreateResults('test', { BlockName: 'b-test' }),
                    function(res) {
                        _this.callback(null, res, tech.getSuffixes());
                    },
                    function(err) {
                        _this.callback(err);
                    }
                );
            },

            "contains results for all suffixes": function(err, res, suffixes) {
                assert.isNull(err);
                suffixes.forEach(function(suffix) {
                    assert.include(res, suffix);
                });
            }
        },

        ".storeCreateResult()": {},

        ".storeCreateResults()": {},

        ".readContent()": {},

        ".readAllContent()": {
            topic: function(tech) {
                var _this = this;
                Q.when(
                    tech.readAllContent('test'),
                    function(res) {
                        _this.callback(null, res, tech.getSuffixes());
                    },
                    function(err) {
                        _this.callback(err);
                    }
                );
            },

            "contains results for all suffixes": function(err, res, suffixes) {
                assert.isNull(err);
                suffixes.forEach(function(suffix) {
                    assert.include(res, suffix);
                });
            }
        },

        // build
        ".build()": {},

        ".getBuildResult()": {},

        ".getBuildResults()": {},

        ".storeBuildResult()": {},

        ".storeBuildResults()": {}

    };
    return batch;
}

vows.describe('tech')
    .addBatch(testBaseTech('../lib/techs/js'))
    .addBatch(testBaseTech('../lib/techs/css'))
    .addBatch(testBaseTech('../lib/tech', 'def'))
    .addBatch(testBaseTech('./data/techs/test.js'))
    .export(module);
