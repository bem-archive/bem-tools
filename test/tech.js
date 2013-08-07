/* jshint quotmark: false */
'use strict';

var Q = require('q'),
    assert = require('chai').assert,
    SINON = require('sinon'),
    BEM = require('..'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    TECH = BEM.require('./tech'),
    Level = BEM.require('./level').Level,
    createTech = TECH.createTech,
    getTechClass = TECH.getTechClass;
// Turn off deprecation warnings
U.deprecate.silence = true;

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
        var testTechV2 = require.resolve(PATH.resolve(__dirname, 'data/techs/test-tech-v2.js'));

        /**
         * Creates level that always resolves to specified path
         */
        function mockLevel(techPath) {
            return {
                resolveTech: function() {
                    return techPath;
                }
            };
        }

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
                // tech class
            var T = getTechClass({
                        baseTechName: 'base',
                        test2: true
                    }, mockLevel(testTech)),

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

        it('throws an error when baseTechName is unresolvable', function() {
            assert.throws(function() {
               var level = new Level('', '');
               getTechClass({
                   baseTechName: 'nonexistent'
               }, level);
            });
        });

        describe('when API_VER is specified', function() {
            describe('without base tech', function() {
                it('loads TechV2 when API_VER=2', function() {
                    var T = getTechClass({
                        API_VER: 2
                    });

                    assert.instanceOf(new T(), TECH.TechV2);
                });

                it('loads TechV1 when API_VER=1', function() {
                    var T = getTechClass({
                        API_VER: 1
                    });

                    assert.instanceOf(new T(), TECH.Tech);
                });

            });

            describe('with base tech', function() {
                it('disallows to inherit V2 tech from V1', function() {
                    assert.throws(function() {
                        getTechClass({
                            baseTechName: 'base',
                            API_VER: 2
                        }, mockLevel(testTech));
                    });
                });

                it('disallows to inherit V1 tech from V2', function() {
                    assert.throws(function() {
                        getTechClass({
                            baseTechName: 'base',
                            API_VER: 1
                        }, mockLevel(testTechV2));
                    });
                });

                it('allows to inherit V1 tech from V1', function() {
                    assert.doesNotThrow(function() {
                        getTechClass({
                            baseTechName: 'base',
                            API_VER: 1
                        }, mockLevel(testTech));
                    });
                });

                it('allows to inherit V2 tech from V2', function() {
                    assert.doesNotThrow(function() {
                        getTechClass({
                            baseTechName: 'base',
                            API_VER: 2
                        }, mockLevel(testTechV2));
                    });
                });
            });
        });

        describe('when API_VER is not specified', function() {
            describe('without base tech', function() {
                it('loads V1 tech', function() {
                    var T = getTechClass({});
                    assert.instanceOf(new T(), TECH.Tech);
                });
            });

            describe('with base tech', function() {
                it('allows to inherit from V1 tech', function() {
                    assert.doesNotThrow(function() {
                        getTechClass({
                            baseTechName: 'base'
                        }, mockLevel(testTech));
                    });
                });


                it('allows to inherit from V2 tech', function() {
                    assert.doesNotThrow(function() {
                        getTechClass({
                            baseTechName: 'base'
                        }, mockLevel(testTechV2));
                    });
                });
            });
        });
    });

    describe('getBuildResult', function() {
        it('calls getBuildResultChunk with source suffix', function() {
            var TechClass = getTechClass({
                API_VER: 2
            });

            var tech = new TechClass();
            tech.getBuildResultChunk = SINON.spy();
            tech.getBuildResult([
                {absPath: '/source.source_suffix', suffix: 'source_suffix'}
            ], 'dest_suffix', '/out', {});

            SINON.assert.calledWith(tech.getBuildResultChunk,
                                        SINON.match.any,
                                        SINON.match.any,
                                        "source_suffix");
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
        if(techName === 'tech') relTechPath = '';
    }

    techAlias = techAlias || techName;

    describe("Tech.createTech('" + techPath + "')", function() {

        var tech = createTech(require.resolve(techPath),
                techAlias === techName ? null : techAlias);

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
                        assert.property(res, suffix);
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
                        assert.property(res, suffix);
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
    testBaseTech(lib + 'tech/index', 'def');
    testBaseTech('./data/techs/test.js');

});
