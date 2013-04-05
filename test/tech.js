var Q = require('q'),
    assert = require('chai').assert,
    BEM = require('..'),
    PATH = BEM.require('./path'),
    TECH = BEM.require('./tech'),
    createTech = TECH.createTech,
    getTechClass = TECH.getTechClass;

/**
 * Mocha BDD interface.
 *
 * @name describe @function
 * @name it @function
 * @name before @function
 * @name after @function
 * @name beforeEach @function
 * @name afterEach @function
 */

describe('tech', function() {

    describe('getTechClass()', function() {

        var testTech = require.resolve(PATH.resolve(__dirname, 'data/techs/test-tech.js'));

        it('for path', function() {

            // tech class
            var T = getTechClass(testTech),

                // tech object
                o = new T('tech', 'tech');

            assert.isTrue(o.test);

        });

        it('for module object', function() {

            // tech class
            var T = getTechClass({ test: true }),

                // tech object
                o = new T('tech', 'tech');

            assert.isTrue(o.test);

        });

        it('for module with baseTechPath property', function() {

            // tech class
            var T = getTechClass({
                    baseTechPath: testTech,
                    test2: true
                }),

                // tech object
                o = new T('tech', 'tech');

            assert.isTrue(o.test);
            assert.isTrue(o.test2);

        });

        it('for module with baseTechName property', function() {

            // level mock with resolveTech() implementation only
            var level = {
                        resolveTech: function() {
                            return testTech;
                        }
                    },

                // tech class
                T = getTechClass({
                        baseTechName: 'base',
                        test2: true
                    }, level),

                // tech object
                o = new T('tech', 'tech');

            assert.isTrue(o.test);
            assert.isTrue(o.test2);

        });

        it('for module with baseTech property', function() {

            // tech class
            var T = getTechClass({
                        baseTech: getTechClass({ test: true }),
                        test2: true
                    }),

                // tech object
                o = new T('tech', 'tech');

            assert.isTrue(o.test);
            assert.isTrue(o.test2);

        });

        it('for module with techMixin property', function() {

            var T = getTechClass({
                        baseTech: getTechClass({ test: true }),
                        techMixin: {
                            test2: true
                        }
                    }),
                o = new T('tech', 'tech');

            assert.isTrue(o.test);
            assert.isTrue(o.test2);

        });

    });

});

function testBaseTech(techPath, techAlias) {

    var bemLib = process.env.COVER? 'bem/lib-cov/' : 'bem/lib/',
        techName = PATH.basename(techPath),
        absTechPath = require.resolve(PATH.resolve(__dirname, techPath)),
        relTechPath = techPath + '.js',
        re = process.env.COVER? /^\.\.\/lib-cov\// : /^\.\.\/lib\//;

    // NOTE: techPath will be always in unix format
    if(re.test(techPath)) {
        relTechPath = relTechPath.replace(re, bemLib);

        // default tech identified by '' relative path
        if(techName == 'tech') relTechPath = '';
    }

    techAlias = techAlias || techName;

    describe("Tech.createTech('" + techPath + "')", function() {

        var tech = createTech(require.resolve(techPath),
                techAlias == techName ? null : techAlias);

        // meta data
        describe(".getTechName()", function() {

            it("equals to '" + techAlias + "'", function() {
                assert.equal(tech.getTechName(), techAlias);
            });

        });

        describe(".getSuffixes()", function() {

            var suffixes = tech.getSuffixes();

            it("returns array", function() {
                assert.instanceOf(suffixes, Array);
            });

            it("returns all suffixes", function() {
                assert.deepEqual(suffixes, [techAlias]);
            });

        });

        describe(".matchSuffix()", function() {

            tech.getSuffixes().forEach(function(suffix) {
                it("matches '" + suffix + "' and '." + suffix + "'", function() {
                    assert.isTrue(tech.matchSuffix(suffix));
                    assert.isTrue(tech.matchSuffix('.' + suffix));
                });
            });

        });

        describe(".getTechPath()", function() {

            it("equals to " + absTechPath, function() {
                assert.equal(tech.getTechPath(), absTechPath);
            });

        });

        describe(".getTechRelativePath(" + __dirname + ")", function() {

            var p = PATH.unixToOs(relTechPath);
            it("equals to " + p, function() {
                assert.equal(tech.getTechRelativePath(__dirname), p);
            });

        });

        // create
        describe(".create()", function() {});

        describe(".getCreateResult()", function() {});

        describe(".getCreateResults()", function() {

            var res = tech.getCreateResults('test', { BlockName: 'b-test' });

            it("contains results for all suffixes", function(done) {

                Q.done(res, function(res) {
                    tech.getSuffixes().forEach(function(suffix) {
                        assert.include(res, suffix);
                    });
                    done();
                }, done);

            });

        });

        describe(".storeCreateResult()", function() {});

        describe(".storeCreateResults()", function() {});

        describe(".readContent()", function() {});

        describe(".readAllContent()", function() {

            var res = tech.readAllContent('test');

            it("contains results for all suffixes", function(done) {

                Q.done(res, function(res) {
                    tech.getSuffixes().forEach(function(suffix) {
                        assert.include(res, suffix);
                    });
                    done();
                }, done);

            });

        });

        // build
        describe(".build()", function() {});

        describe(".getBuildResult()", function() {});

        describe(".getBuildResults()", function() {});

        describe(".storeBuildResult()", function() {});

        describe(".storeBuildResults()", function() {});

    });

}

describe('tech modules', function() {

    var lib = process.env.COVER? '../lib-cov/' : '../lib/';

    testBaseTech(lib + 'techs/js');
    testBaseTech(lib + 'techs/css');
    testBaseTech(lib + 'tech', 'def');
    testBaseTech('./data/techs/test.js');

});
