/* jshint quotmark: false */
'use strict';

var Q = require('q'),
    SINON = require('sinon'),
    requireMocked = require('require-mocked'),
    assert = require('chai').assert,
    mockFs = require('q-io/fs-mock'),
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

        it('for module with function-style code', function() {
            var T = getTechClass(require.resolve('./data/techs/function-tech.js'));
            T = new T('function-tech', 'function-tech');
            assert.equal(T.getBuildResults(), BEM.require.resolve('./techs/js.js'));
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

                it('loads base tech from lib/techs/ by default when API_VER is 1', function() {
                    var level = new Level('', '');
                    var T = getTechClass({
                        baseTechName: 'js',
                        API_VER: 1
                    }, level);
                    assert.instanceOf(new T(), TECH.Tech);
                });

                it('loads base tech from lib/techs/v2 by default when API_VER is 2', function() {
                    var level = new Level('', '');
                    var T = getTechClass({
                        baseTechName: 'js',
                        API_VER: 2
                    }, level);
                    assert.instanceOf(new T(), TECH.TechV2);
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

                it('loads base tech from lib/techs by default', function() {
                    var level = new Level('', '');
                    var T = getTechClass({
                        baseTechName: 'js',
                    }, level);
                    assert.instanceOf(new T(), TECH.Tech);
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

    describe('v2', function() {

        function createTechObj(decl) {
            decl = decl || {};
            decl.API_VER = 2;
            var TechClass = getTechClass(decl);
            return new TechClass();
        }

        describe('getCreateResults()', function() {

            var tech;
            beforeEach(function() {
                tech = createTechObj({
                    API_VER: 2,
                    getCreateSuffixes: function() {
                        return ['js', 'css'];
                    },
                    getCreateResult: function (path, suffix, vars) {
                        return Q.resolve(suffix + ' content');
                    }
                });
            });

            it('should return one value for each suffix', function() {
                var result = tech.getCreateResults('/tmp', {});

                return assert.isFulfilled(Q.all([
                    assert.eventually.property(result, 'css'),
                    assert.eventually.property(result, 'js'),
                ]));
            });

            it('should return result of getCreateResult for each key', function() {
                var result= tech.getCreateResults('/tmp', {});
                return assert.isFulfilled(Q.all([
                    assert.eventually.propertyVal(result, 'css', 'css content'),
                    assert.eventually.propertyVal(result, 'js', 'js content')
                ]));
            });

        });

        describe('getBuildResult()', function () {
            var tech;
            beforeEach(function() {
                tech = createTechObj({
                    API_VER: 2,

                    getBuildResultChunk: function(relPath, path, suffix) {
                        return 'relPath: ' + relPath + ' ' +
                            'path: ' + path + ' ' +
                            'suffix: ' + suffix;
                    }
                });
            });

            it('should return chunk for each file', function() {
               var result = tech.getBuildResult([
                    {absPath: '/test/1.js', suffix: 'js'},
                    {absPath: '/test/2.css', suffix: 'css'}
               ], 'out.js', '/test/result/out.js');


               return assert.eventually.deepEqual(result, [
                    'relPath: ../1.js path: /test/1.js suffix: js',
                    'relPath: ../2.css path: /test/2.css suffix: css'
               ]);
            });
        });

        function createMockedTech(fs) {
            var path = (process.env.COVER? '../lib-cov/' : '../lib/') + 'tech/index.js';
            
            var MOCKTECH = requireMocked(require.resolve(path), {
                mocks: {
                    'q-io/fs': mockFs(fs)
                }
            });


            var TechClass = MOCKTECH.getTechClass({API_VER: 2});
            var tech = new TechClass('techName', '/some/path');
            tech.setContext({opts:{}});
            return tech;
        }

        describe('validate()', function() {

            it('should return false when meta file does not exists', function() {
                var tech = createMockedTech({
                    'dest': ''
                });

                return assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374796800000}
                ], {}));
            });

            it('should return false when amount of source files in cache different from current', function() {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest~techName.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source1', lastUpdated: 1374796800000},
                                    {absPath: 'source2', lastUpdated: 1374796800000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                return assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source1', lastUpdated: 1374796800000}
                ], {}));
            });

            it('should return false when source file changed names', function() {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest~techName.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'oldSource', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                return assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'newSource', lastUpdated: 1374710400000}
                ], {}));
            });

            it('should return false when source file has been updated', function() {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest~techName.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                return assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374796800000}
                ], {}));
            });

            it('should return false when destination file does not exists', function() {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest~techName.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    }
                });

                return assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374710400000}
                ], {}));

            });

            it('should return true when all previous conditions met', function() {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest~techName.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                 
                return assert.eventually.isTrue(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374710400000}
                ], {}));
            });

            it('should return false when opts.force is set', function() {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest~techName.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });
 
                return assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374710400000}
                ], {force: true}));
            });
        });

        

        describe('getSuffixes()', function () {

            it('should return each source suffix from build suffixes map', function () {
                var tech = createTechObj({
                    getBuildSuffixesMap: function () {
                        return {
                            'js': ['js', 'coffee'],
                            'css': ['styl', 'scss']
                        };
                    }
                });

                //TODO: Update chai and repalce with sameMembers
                assert.deepEqual(tech.getSuffixes(), ['js', 'coffee', 'styl', 'scss']);
            });

            it('should have no duplicates', function (){
                var tech = createTechObj({
                    getBuildSuffixesMap: function () {
                        return {
                            'js': ['js', 'css'],
                            'css': ['js', 'css']
                        };
                    }
                });
                assert.deepEqual(tech.getSuffixes(), ['js', 'css']);
            });
        });

        describe.skip('matchSuffix()', function () {
        });

        describe('getPath()', function () {

            it('should return prefix and suffix concatenated', function() {
                var tech = createTechObj({});
                assert.equal(tech.getPath('/test/example', 'js'), '/test/example.js');
            });

            it('should use techName when suffix is not passed', function () {
                var tech = createTechObj({
                    getTechName: function() {
                        return 'test';
                    }
                });

                assert.equal(tech.getPath('/test/example'), '/test/example.test');
            });
        });

        describe('getPaths()', function () {
            it('should return path for single suffix and prefix', function() {
                var tech = createTechObj();
                assert.deepEqual(tech.getPaths('/test/example', 'js'), ['/test/example.js']);
            });

            it('should return all possible pathes for arrays of suffixes and prefixes', function () {
                var paths = createTechObj().getPaths(['/test/example1', '/test/example2'],
                                                     ['js', 'css']);

                //TODO: replace with sameMembers
                assert.include(paths, '/test/example1.js');
                assert.include(paths, '/test/example2.js');
                assert.include(paths, '/test/example1.css');
                assert.include(paths, '/test/example2.css');
                
            });

            it('should use getSuffixes() if suffixes has not been passed', function () {
                var paths = createTechObj({
                        getSuffixes: function () {
                            return ['html', 'less'];
                        }
                    })
                    .getPaths(['/test/example1', '/test/example2']);

                assert.include(paths, '/test/example1.html');
                assert.include(paths, '/test/example2.html');
                assert.include(paths, '/test/example1.less');
                assert.include(paths, '/test/example2.less');
            });
        });

        describe('getTechName()', function () {
            var tech;
            beforeEach(function () {
                tech = createTechObj();
            });

            it('should return techName if its set', function () {
                tech.techName = 'SomeTech';

                assert.equal(tech.getTechName(), 'SomeTech');
            });

            it('should return file name if techName is not set', function () {
                tech.techPath = '/test/someFile.js';

                assert.equal(tech.getTechName(), 'someFile');
            });
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
