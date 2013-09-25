'use strict';
var assert = require('chai').assert,
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
                        'mock-techs': {
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

            it('should resolve techs from project root');

            it('should resolve to bem tools v2 tech', function() {
                var Class = defineLevel()
                    .addTechs('css')
                    .createClass();

                assert.deepEqual(Class.prototype.getTechs(), {
                    'css': BEM.require.resolve('./techs/v2/css')
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
            var techs = ['css', 'js'],
                Class = defineLevel()
                    .setDefaultTechs(techs)
                    .createClass();

            assert.deepEqual(Class.prototype.getDefaultTechs(), techs);

        });
    });

    describe('setConfig()', function() {
        it('should create getConfigMethod', function() {
            var config = {a:1, b:2},
                Class = defineLevel()
                    .setConfig(config)
                    .createClass();

            assert.deepEqual(Class.prototype.getConfig(), config);
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
