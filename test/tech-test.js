var vows = require('vows'),
    assert = require('assert'),
    PATH = require('../lib/path'),
    createTech = require('../lib/tech').createTech;

function testBaseTech(techPath, techAlias) {
    var batch = {},
        techName = PATH.basename(techPath),
        absTechPath = require.resolve(PATH.resolve(__dirname, techPath)),
        relTechPath = techPath;

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
            assert.equal(tech.getTechRelativePath(__dirname), relTechPath);
        },

        // create
        ".create()": {},

        ".getCreateResult()": {},

        ".getCreateResults()": function(tech) {
            var res = tech.getCreateResults('test', { BlockName: 'b-test' });
            tech.getSuffixes().forEach(function(suffix) {
                assert.include(res, suffix);
            });
        },

        ".storeCreateResult()": {},

        ".storeCreateResults()": {},

        ".readContent()": {},

        ".readAllContent()": function(tech) {
            var res = tech.readAllContent('test');
            tech.getSuffixes().forEach(function(suffix) {
                assert.include(res, suffix);
            });
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
