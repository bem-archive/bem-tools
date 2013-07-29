/* jshint quotmark: false */
'use strict';

var Q = require('q'),
    assert = require('chai').assert,
    MOCKS = require('mocks'),
    mockFs = require('q-fs').Mock,
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

            it('should return one value for each suffix', function(done) {
                var result = tech.getCreateResults('/tmp', {});

                assert.isFulfilled(Q.all([
                    assert.eventually.property(result, 'css'),
                    assert.eventually.property(result, 'js'),
                ])).notify(done);
            });

            it('should return result of getCreateResult for each key', function(done) {
                var result= tech.getCreateResults('/tmp', {});
                assert.isFulfilled(Q.all([
                    assert.eventually.propertyVal(result, 'css', 'css content'),
                    assert.eventually.propertyVal(result, 'js', 'js content')
                ])).notify(done);
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

            it('should return chunk for each file', function(done) {
               var result = tech.getBuildResult([
                    {absPath: '/test/1.js'},
                    {absPath: '/test/2.js'}
               ], 'out.js', '/test/result/out.js');


               assert.eventually.deepEqual(result, [
                    'relPath: ../1.js path: /test/1.js suffix: out.js',
                    'relPath: ../2.js path: /test/2.js suffix: out.js'
               ]).notify(done);
            });
        });

        function createMockedTech(fs) {
            var path = (process.env.COVER? '../lib-cov/' : '../lib/') + 'tech/index.js';
           
            var MOCKTECH = MOCKS.loadFile(require.resolve(path), {
                'q-fs': mockFs(fs),
            }, null, true);

            var TechClass = MOCKTECH.getTechClass({API_VER: 2});
            var tech = new TechClass();
            tech.setContext({opts:{}});
            return tech;
        }

        describe('validate()', function() {

            it('should return false when meta file does not exists', function(done) {
                var tech = createMockedTech({
                    'dest': ''
                });

                assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374796800000}
                ], {})).notify(done);
            });

            it('should return false when amount of source files in cache different from current', function(done) {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source1', lastUpdated: 1374796800000},
                                    {absPath: 'source2', lastUpdated: 1374796800000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source1', lastUpdated: 1374796800000}
                ], {})).notify(done);
            });

            it('should return false when source file changed names', function(done) {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'oldSource', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'newSource', lastUpdated: 1374710400000}
                ], {})).notify(done);
            });

            it('should return false when source file has been updated', function(done) {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374796800000}
                ], {})).notify(done);
            });

            it('should return false when destination file does not exists', function(done) {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    }
                });

                assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374710400000}
                ], {})).notify(done);

            });

            it('should return true when all previous conditions met', function(done) {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });

                 
                assert.eventually.isTrue(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374710400000}
                ], {})).notify(done);
            });

            it('should return false when opts.force is set', function(done) {
                var tech = createMockedTech({
                    '.bem': {
                        'cache': {
                            'dest.meta.js': JSON.stringify({
                                buildFiles: [
                                    {absPath: 'source', lastUpdated: 1374710400000}
                                ]
                            })
                        }
                    },
                    'dest': ''
                });
 
                assert.eventually.isFalse(tech.validate('dest', [
                    {absPath: 'source', lastUpdated: 1374710400000}
                ], {force: true})).notify(done);
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
    testBaseTech(lib + 'tech/index', 'def');
    testBaseTech('./data/techs/test.js');

});
