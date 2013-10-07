'use strict';
var SINON = require('sinon'),
    assert = require('chai').assert,
    requireMocked = require('require-mocked')(__filename),
    BEM = require('..'),
    Level = BEM.Level,
    defineLevel = BEM.defineLevel;

describe('level builder', function() {

    it('should create subclass of Level class', function() {
        assert.instanceOf(defineLevel().createClass().prototype, Level);
    });

    describe('addTechs()', function() {
        it('should accept level map', function() {
            var map = {
                'a': '/some/path',
                'b': '/some/path'
            };

            var Class = defineLevel()
                .addTechs(map)
                .createClass();

            assert.deepEqual(Class.prototype.getTechs(), map);

        });

        describe('should accept tech names', function() {
            it('should resolve path with npm packages paths', function() {
                var defineLevel = requireMocked('..', {
                    mocks: {
                        '../env': {
                            getEnv: SINON.stub().withArgs('root').returns('/root')
                        },
                        '/root/node_modules/mock-techs': {
                            resolveTech: function(tech) {
                                return '/mock/' + tech;
                            }
                        }
                    }
                }).defineLevel;

                var Class = defineLevel()
                    .useNpmModule('mock-techs')
                    .addTechs('css')
                    .createClass();

                assert.deepEqual(Class.prototype.getTechs(), {
                    'css': '/mock/css'
                });
            });

            it('should resolve techs from project root', function() {
                var defineLevel = requireMocked('..', {
                    mocks: {
                        '../env': {
                            getEnv: SINON.stub().withArgs('root').returns('/root')
                        },

                        '/root/.bem/techs/project.js': {
                            techMixin: {}
                        }
                    }
                }).defineLevel;

                var Class = defineLevel()
                    .addTechs('project')
                    .createClass();

                assert.deepEqual(Class.prototype.getTechs(), {
                    'project': '/root/.bem/techs/project.js'
                });
            });

            it('should resolve to bem tools v2 tech', function() {
                var Class = defineLevel()
                    .addTechs('css')
                    .createClass();

                assert.deepEqual(Class.prototype.getTechs(), {
                    'css': BEM.require.resolve('./techs/v2/css')
                });
            });

            it('should accept array', function() {
                var Class = defineLevel()
                    .addTechs(['css', 'js'])
                    .createClass();

                assert.deepEqual(Class.prototype.getTechs(), {
                    'css': BEM.require.resolve('./techs/v2/css'),
                    'js': BEM.require.resolve('./techs/v2/js')
                });
            });
        });

        it('should accept multiple strings and map', function() {
            var Class = defineLevel()
                .addTechs('bemdecl.js', 'css', {
                    'from-map': '/some/path'
                })
                .createClass();

            assert.deepEqual(Class.prototype.getTechs(), {
                'css': BEM.require.resolve('./techs/v2/css'),
                'bemdecl.js': BEM.require.resolve('./techs/v2/bemdecl.js'),
                'from-map': '/some/path'
            });
        });

        it('should merge multiple calls together', function() {
            var Class = defineLevel()
                .addTechs({
                    'first': '/some/path'
                })
                .addTechs('css')
                .createClass();

            assert.deepEqual(Class.prototype.getTechs(), {
                'first': '/some/path',
                'css': BEM.require.resolve('./techs/v2/css')
            });
        });
    });

    describe('setNamingScheme()', function() {
        it('should accept mixin', function() {
            var mixin = {
                'match-block': function testMatchBlock() {
                }
            };

            var Class = defineLevel()
                .setNamingScheme(mixin)
                .createClass();

            assert.deepPropertyVal(Class,
                'prototype.match-block',
                mixin['match-block']);
        });

        it('should accept string name', function() {
            var Class = defineLevel()
                .setNamingScheme('simple')
                .createClass();

            var bemLib = process.env.COVER? '../lib-cov/' : '../lib/';

            assert.deepPropertyVal(Class,
                'prototype.match-block',
                require(bemLib + 'level/naming/simple')['match-block']);
        });
    });

    describe('setDefaultTechs()', function() {
        it('should create getDefaultTechs method', function() {
            var Class = defineLevel()
                    .setDefaultTechs('css', 'js')
                    .createClass();

            assert.deepEqual(Class.prototype.getDefaultTechs(), ['css', 'js']);

        });

        it('should accept an array of tech names', function() {
            var Class = defineLevel()
                    .setDefaultTechs(['css', 'js'])
                    .createClass();

            assert.deepEqual(Class.prototype.getDefaultTechs(), ['css', 'js']);

        });
    });

    describe('setBundleBuildLevels()', function() {
        it('should create entry bundleBuildLevels entry in level config', function() {
            var Class = defineLevel()
                    .setBundleBuildLevels('level1', 'level2')
                    .createClass();

            assert.deepEqual(Class.prototype.getConfig().bundleBuildLevels,
                            ['level1', 'level2']);
        });

        it('should accept array of strings', function() {
            var Class = defineLevel()
                    .setBundleBuildLevels(['level1', 'level2'])
                    .createClass();

            assert.deepEqual(Class.prototype.getConfig().bundleBuildLevels,
                            ['level1', 'level2']);
        });
    });

    describe('addTypes()', function() {
        it('should create class with "level" type by default', function() {
            var Class = defineLevel()
                .createClass();

            assert.deepEqual(Class.prototype.getTypes(), ['level']);
        });

        it('should add types to the list', function() {
            var Class = defineLevel()
                .addTypes('project', 'bundle')
                .createClass();

            assert.deepEqual(Class.prototype.getTypes(), [
                'level',
                'project',
                'bundle'
            ]);
        });

        it('should accept an array of types', function() {
            var Class = defineLevel()
                .addTypes(['project', 'bundle'])
                .createClass();

            assert.deepEqual(Class.prototype.getTypes(), [
                'level',
                'project',
                'bundle'
            ]);

        });
    });


    describe('extending', function() {
        var Parent;
        beforeEach(function() {
            Parent = defineLevel()
                .addTechs({
                    'parent': '/path/to/tech'
                })
                .addTypes('parent')
                .createClass();
        });

        it('should add child techs to parents', function() {
            var Child = Parent.extend()
                .addTechs({
                    'child': '/path/to/child'
                })
                .createClass();

            assert.deepEqual(Child.prototype.getTechs(), {
                'parent': '/path/to/tech',
                'child': '/path/to/child'
            });

        });

        it('should add child types to parents', function() {
            var Child = Parent.extend()
                .addTypes('child')
                .createClass();

            assert.deepEqual(Child.prototype.getTypes(), [
                'level',
                'parent',
                'child'
            ]);
        });

        it('should not change parent\'s properties', function() {
            Parent.extend()
                .addTechs({
                    'child': '/path/to/child'
                })
                .addTypes('child')
                .createClass();

            assert.deepEqual(Parent.prototype.getTechs(), {
                'parent': '/path/to/tech'
            });

            assert.deepEqual(Parent.prototype.getTypes(), [
                'level',
                'parent'
            ]);
        });
    });
});
