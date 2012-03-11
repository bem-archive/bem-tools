var vows = require('vows'),
    assert = require('assert'),
    DEPS = require('../lib/techs/deps.js'),
    Deps = DEPS.Deps2,
    DepsItem = DEPS.DepsItem2,
    depsVows = vows.describe('Deps');

function assertDepsParse(deps, expected) {
    return function () {
        assert.deepEqual(new Deps().parse(deps).serialize(), expected)
    }
}

depsVows.addBatch({

    'parsing:': {

        'old format with names': {

            'block': assertDepsParse(
                [ { name: 'b1' } ],
                [ { block: 'b1' } ]
            ),

            'block with elem': assertDepsParse(
                [ { name: 'b1', elems: [ { name: 'e1' } ] } ],
                [ { block: 'b1' }, { block: 'b1', elem: 'e1' } ]
            ),

            'block with elem with mods with vals': assertDepsParse(
                [
                    { name: 'b1', elems: [
                        { name: 'e1', mods: [
                            { name: 'm1', vals: [ 'v1', 'v2' ] } ] } ] }
                ],
                [
                    { block: 'b1' },
                    { block: 'b1', elem: 'e1' },
                    { block: 'b1', elem: 'e1', mod: 'm1' },
                    { block: 'b1', elem: 'e1', mod: 'm1', val: 'v1' },
                    { block: 'b1', elem: 'e1', mod: 'm1', val: 'v2' }
                ]
            ),

            'block with mods with vals and with elems': assertDepsParse(
                [ { name: 'b1',
                    elems: [ 'e1', 'e2' ],
                    mods: [
                        { name: 'm1', val: 'v1' },
                        { name: 'm2', val: 'v2' }
                    ]
                } ],
                [
                    { block: 'b1' },
                    { block: 'b1', elem: 'e1' },
                    { block: 'b1', elem: 'e2' },
                    { block: 'b1', mod: 'm1', val: 'v1' },
                    { block: 'b1', mod: 'm2', val: 'v2' }
                ]
            )

        },

        'new format': {
            'block': assertDepsParse(
                [ { block: 'b1' } ],
                [ { block: 'b1' } ]
            ),

            'elem': assertDepsParse(
                [ { block: 'b1', elem: 'e1' } ],
                [ { block: 'b1', elem: 'e1' } ]
            ),

            'block with shouldDeps and mustDeps': assertDepsParse(
                [ { block: 'b1', shouldDeps: [ { block: 'b2', mustDeps: 'b3' }, 'b3' ] } ],
                [ { block: 'b1' }, { block: 'b3' }, { block: 'b2' } ]
            ),

            'simple blocks': assertDepsParse(
                [ 'b1', 'b2' ],
                [ { block: 'b1' }, { block: 'b2' } ]
            )

        },

        'new format with techs': {
            'block': assertDepsParse(
                [ { tech: 't1', block: 'b1' } ],
                [ { tech: 't1', block: 'b1' } ]
            ),

            'elem': assertDepsParse(
                [ { block: 'b1', elem: 'e1' } ],
                [ { block: 'b1', elem: 'e1' } ]
            )
        }

    },

    'clone': {
        topic: function() {
            var deps1 = new Deps().parse([{ block: 'b1', bla: 1 }, 'b2']),
                deps2 = deps1.clone();
            return [deps1, deps2];
        },

        '.items': function(deps) {
            assert.deepEqual(deps[1].items, deps[0].items)
        },

        '.itemsByOrder': function(deps) {
            assert.deepEqual(deps[1].itemsByOrder, deps[0].itemsByOrder)
        }
    }

});


function assertBuildKey(item, expected) {
    return function () {
        assert.equal(new DepsItem(item).buildKey(), expected)
    }
}

depsVows.addBatch({

    'DepsItem': {
        'buildKey': {

            'block without tech': assertBuildKey(
                { block: 'b1' },
                'b1'),

            'block modifier without tech': assertBuildKey(
                { block: 'b1', mod: 'm1' },
                'b1_m1'),

            'block modifier value without tech': assertBuildKey(
                { block: 'b1', mod: 'm1', val: 'v1' },
                'b1_m1_v1'),

            'block element without tech': assertBuildKey(
                { block: 'b1', elem: 'e1' },
                'b1__e1'),

            'element modifier without tech': assertBuildKey(
                { block: 'b1', elem: 'e1', mod: 'm1' },
                'b1__e1_m1'),

            'element modifier value without tech': assertBuildKey(
                { block: 'b1', elem: 'e1', mod: 'm1', val: 'v1' },
                'b1__e1_m1_v1'),

            'block with tech': assertBuildKey(
                { tech: 't1', block: 'b1' },
                'b1.t1'),

            'block modifier with tech': assertBuildKey(
                { tech: 't1', block: 'b1', mod: 'm1' },
                'b1_m1.t1'),

            'block modifier value with tech': assertBuildKey(
                { tech: 't1', block: 'b1', mod: 'm1', val: 'v1' },
                'b1_m1_v1.t1'),

            'block element with tech': assertBuildKey(
                { tech: 't1', block: 'b1', elem: 'e1' },
                'b1__e1.t1'),

            'element modifier with tech': assertBuildKey(
                { tech: 't1', block: 'b1', elem: 'e1', mod: 'm1' },
                'b1__e1_m1.t1'),

            'element modifier value with tech': assertBuildKey(
                { tech: 't1', block: 'b1', elem: 'e1', mod: 'm1', val: 'v1' },
                'b1__e1_m1_v1.t1'),

            'just tech': assertBuildKey(
                { tech: 't1' },
                '.t1'),

            'empty': assertBuildKey(
                {},
                '')

        }
    }

}).export(module);
