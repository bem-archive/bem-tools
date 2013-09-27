/* jshint quotmark: false */
'use strict';

var Q = require('q'),
    SINON = require('sinon'),
    assert = require('chai').assert,
    BEM = require('..'),
    U = BEM.require('./util'),
    PATH = BEM.require('./path'),
    TECH = BEM.require('./tech'),
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

        it('for module with function-style code', function() {
            var T = getTechClass(require.resolve('./data/techs/function-tech.js'));
            T = new T('function-tech', 'function-tech');
            assert.equal(T.getBuildResults(), BEM.require.resolve('./techs/js.js'));
        });

    });

    describe('v2', function() {
        describe('.getBuildPaths()', function() {
            var tech;
            beforeEach(function() {
                var T = getTechClass({
                    API_VER: 2,

                    getBuildSuffixesMap: function() {
                        return {
                            'out': ['js']
                        };
                    },

                    getWeakBuildSuffixesMap: function() {
                        return {
                            'out': ['js', 'dependency']
                        };
                    }
                });

                tech = new T('out', '');
            });
            
            describe('without tech dependencies', function() {
               it('calls level.getFileByObjIfExists with self', function() {
                   var level = {
                       getFileByObjIfExists: SINON.spy(),
                       scanFiles: SINON.stub().returns(Q.fcall(function() {}))
                   };

                   return tech.getBuildPaths({
                       deps: [
                           {block: 'block'}
                       ]
                   }, [level])
                   .then(function() {
                        SINON.assert.calledWith(level.getFileByObjIfExists,
                                                {block: 'block'},
                                                tech);
                   });



               });

               it('selects only files matching strong suffixes map', function() {
                   var level = {
                       getFileByObjIfExists: SINON.stub().returns([
                           {file: 'test.js', suffix:'js', absPath: '/test.js'},
                           {file: 'test.dependency', suffix: 'dependency', absPath: '/test.dependency'}
                       ]),

                       scanFiles: SINON.stub().returns(Q.fcall(function() {}))
                   };

                   var paths = tech.getBuildPaths({
                       deps: [
                           {block: 'block'}
                       ]
                   }, [level]);

                   return assert.eventually.deepEqual(paths, {
                       out:[
                           {file: 'test.js', suffix:'js', absPath: '/test.js'}
                       ]
                   });
               });
            });

            describe('with tech dependencies', function() {
                var dependencyTech;
                beforeEach(function() {
                    var T = getTechClass({API_VER: 2});
                    dependencyTech = new T('dependency', '');
                    var context = {
                        getTech: SINON.stub().withArgs('dependency').returns(dependencyTech)
                    };

                    tech.setContext(context);
                });

                it('calls level.getFileByObjIfExists with dependent tech', function() {
                    var level = {
                        getFileByObjIfExists: SINON.spy(),
                        scanFiles: SINON.stub().returns(Q.fcall(function() {}))
                    };

                    return tech.getBuildPaths({
                        deps: [
                            {block: 'block', tech: 'dependency'}
                        ]
                    }, [level])
                    .then(function() {
                        SINON.assert.calledWith(level.getFileByObjIfExists,
                                                {block: 'block', tech: 'dependency'},
                                                dependencyTech);
                    });

                });

                it('selects only files matching weak suffixes map', function() {
                    var level = {
                        getFileByObjIfExists: SINON.stub().returns([
                            {file: 'test.dependency', suffix: 'dependency', absPath: '/test.dependency'},
                            {file: 'test.not_dependency', suffix: 'not_dependency', absPath: '/test.not_dependency'}
                        ]),

                        scanFiles: SINON.stub().returns(Q.fcall(function() {}))

                    };

                    var paths = tech.getBuildPaths({
                        deps: [
                            {block: 'block', tech: 'dependency'}
                        ]
                    }, [level]);

                    return assert.eventually.deepEqual(paths, {
                        out: [
                            {file: 'test.dependency', suffix: 'dependency', absPath: '/test.dependency'},
                        ]
                    });
                });
            });
        });
    });

});

function testBaseTech(techPath, techAlias) {

    var bemLib = 'bem/lib/',
        techName = PATH.basename(techPath),
        absTechPath = require.resolve(PATH.resolve(__dirname, techPath)),
        relTechPath = techPath + '.js';

    // NOTE: techPath will be always in unix format
    relTechPath = relTechPath.replace(/^\.\.\/lib\//, bemLib);

    // default tech identified by '' relative path
    if(techName === 'tech') relTechPath = '';

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

    var lib = '../lib/';

    testBaseTech(lib + 'techs/js');
    testBaseTech(lib + 'techs/css');
    testBaseTech(lib + 'tech/index', 'def');
    testBaseTech('./data/techs/test.js');

});
