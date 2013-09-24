'use strict';
var INHERIT = require('INHERIT'),
    assert = require('chai').assert,
    requireMocked = require('require-mocked')(__filename);

describe('LevelManager', function() {

    describe('when creating level from .bem/level.js', function() {
        var BEM;

        function getTestTechs() {
            return {
                'test': '/path/to/test'
            };
        }
        
        function validateLevel(level) {
            //mocked modules run in separate context, so we
            //can't use non-mocked globally required Level
            //here.
            assert.instanceOf(level, BEM.Level);
            assert.deepEqual(level.getTechs(), getTestTechs());

        }


        function createManager(mockedLevels) {
            BEM = requireMocked('..', {
                mocks: mockedLevels,
                resolves: Object.keys(mockedLevels).reduce(function(resolves, path) {
                    resolves[path] = path;
                    return resolves;
                }, {})
            });
            return new BEM.LevelManager();
        }

        

        it('should load level configured via mixin', function() {
            var manager = createManager({
                '/level/.bem/level.js': {
                    getTechs: getTestTechs
                }
            });

            validateLevel(manager.createLevel('/level'));
        });

        

        it('should load level configured via function', function() {
            var manager = createManager({
                '/level/.bem/level.js': function() {
                    return {
                        getTechs: getTestTechs
                    };
                }
            });

            validateLevel(manager.createLevel('/level'));
        });

        it('should load level configured with explicit Level class in Level property', function() {
            var mockModule = {};
            var manager = createManager({
                '/level/.bem/level.js': mockModule
            });

            mockModule.Level = INHERIT(BEM.Level, {
                getTechs: getTestTechs
            });

            validateLevel(manager.createLevel('/level'));
        });

        it('should load hierarchy', function() {
            var manager = createManager({
                '/child/.bem/level.js': {
                    baseLevelPath: '/parent.js'
                },

                '/parent.js': {
                    getTechs: getTestTechs
                }
            });

            validateLevel(manager.createLevel('/child'));
        });

        it('should load base level by name', function() {
            var manager = createManager({
                '/level/.bem/level.js': {
                    baseLevelName: 'simple',
                    getTechs: getTestTechs
                }
            });

            var level = manager.createLevel('/level');
            assert.instanceOf(level, BEM.require('./levels/simple').Level);
            validateLevel(level);
        });

        it('should throw error when base level not found', function() {
            var manager = createManager({
                '/level/.bem/level.js': {
                    baseLevelPath: '/not/a/path'
                }
            });

            assert.throws(function() {
                manager.createLevel('/level');
            });
        });
    });

    describe('when level creating level from predefined class', function() {
        var BEM = require('..'),
            LevelClass = INHERIT(BEM.Level, {}),
            manager;

        beforeEach(function() {
            manager = new BEM.LevelManager();
        });

        it('should load level if manager has config for path in registry', function() {
            manager.setLevelClass('/some/path', LevelClass);
            assert.instanceOf(manager.createLevel('/some/path'), LevelClass);
        });

        it('should load first path match by a mask', function() {
            manager.setLevelClass('/some/*', LevelClass);
            assert.instanceOf(manager.createLevel('/some/path'), LevelClass);
        });

        it('should load first basename match by a mask', function() {
            manager.setLevelClass('*.bundles', LevelClass);
            assert.instanceOf(manager.createLevel('/some/path/some.bundles'), LevelClass);
        });
    });

    describe('when no .bem/level.js nor matching registry entry found', function() {
        var BEM = require('..');
        it('should return base level', function() {
            var manager = new BEM.LevelManager(),
                level = manager.createLevel('/some/path');

            assert.equal(Object.getPrototypeOf(level), BEM.Level.prototype);
        });
    });

    describe('cache', function() {
        var BEM = require('..'),
            manager,
            firstInstance;

        beforeEach(function() {
            manager = new BEM.LevelManager();
            firstInstance = manager.createLevel('/some/path');
        });

        it('should return same instance for same path second time', function() {
            assert.equal(firstInstance, manager.createLevel('/some/path'));
        });

        it('should return new instance for same path if opts.noCache is true', function() {
            assert.notEqual(firstInstance, manager.createLevel('/some/path', {noCache: true}));
        });

    });
});
