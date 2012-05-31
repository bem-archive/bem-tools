var vows = require('vows'),
    assert = require('assert'),
    PATH = require('../lib/path'),
    bemUtil = require('../lib/util'),
    createLevel = require('../lib/level').createLevel;

vows.describe('level').addBatch({

    "Level('data/level1') /* default simple level */": {
        topic: function() {
            return createLevel(absolute('data/level1'));
        },
        ".getDefaultTechs() returns empty array": function(level) {
            var defs = level.getDefaultTechs();
            assert.isArray(defs);
            assert.isEmpty(defs);
        },

        /*
        TODO: подумать об актуальности этих тестов

        ".resolveTechPath('../../techs/test.js') resolves": function(level) {
            assert.equal(level.resolveTechPath('../../techs/test.js'), absolute('./data/techs/test.js'));
        },
        ".resolveTechPath('/path/to/techs/test.js') resolves": function(level) {
            var path = absolute('./data/techs/test.js');
            assert.equal(level.resolveTechPath(path), path);
        },
        ".resolveTechPath('data/techs/test.js') resolves": function(level) {
            var path = 'data/techs/test.js';
            assert.equal(level.resolveTechPath(absolute(path)), path);
        },
        */

        ".matchAny()": function(level) {
            assert.deepEqual(level.matchAny(PATH.resolve(level.dir, 'block/block.css')), {
                block: 'block',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/block.css'), {
                block: 'block',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/_mod/block_mod.css'), {
                block: 'block',
                mod: 'mod',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/_mod/block_mod_val.css'), {
                block: 'block',
                mod: 'mod',
                val: 'val',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/__elem/block__elem.css'), {
                block: 'block',
                elem: 'elem',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/__elem/_mod/block__elem_mod.css'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/__elem/_mod/block__elem_mod_val.css'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod',
                val: 'val',
                suffix: '.css',
                tech: 'css'
            });
            assert.deepEqual(level.matchAny('block/__elem/_mod/block__elem_mod_val.custom'), {
                block: 'block',
                elem: 'elem',
                mod: 'mod',
                val: 'val',
                suffix: '.custom',
                tech: undefined
            });
        },

        ".getDeclByIntrospection()": function(level) {
            assert.deepEqual(level.getDeclByIntrospection(), [ {
                name: 'first-block',
                elems: [ {
                    name: 'elem1',
                    mods: [ {
                        name: 'mod2',
                        techs: [ { name: 'css' } ],
                        vals: [ {
                            name: '3',
                            techs: [ { name: 'js' } ]
                        } ]
                    } ]
                } ]
            } ]);
        },

        "matchers are compliant to getters": testCompliances()
    }

}).export(module);

function absolute(path) {
    return PATH.absolute(path, __dirname);
}

function testCompliances() {
    var context = {},
        types = [
            'elem-mod-val',
            'elem-mod',
            'block-mod-val',
            'block-mod',
            'elem',
            'block'
        ];
    types.forEach(function(i) {
        context[i] = testCompliance();
    });
    return context;
}

function testCompliance() {
    return {
        topic: function(level) {
            var type = this.context.name,
                args = type.split('-');
            if(args[0] != 'block') args.unshift('block');
            return level.match(type, level.getRel(type, args));
        },
        "matcher should comply to getter": function(match) {
            for(var key in match) {
                assert.isString(match[key]);
                if(key == 'suffix') {
                    assert.isEmpty(match[key]);
                    continue;
                }
                assert.equal(match[key], key);
            }
        }
    };
}
