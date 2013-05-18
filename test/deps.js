var assert = require('chai').assert,
    DEPS = require('..').require('./techs/deps.js.js'),
    Deps = DEPS.Deps,
    DepsItem = DEPS.DepsItem;

/**
 * Mocha BDD interface.
 */
/** @name describe @function */
/** @name it @function */
/** @name before @function */
/** @name after @function */
/** @name beforeEach @function */
/** @name afterEach @function */

function assertDepsParse(deps, expected) {
    return function () {
        var serialized = new Deps().parse(deps).serialize();
        assert.deepEqual(serialized, expected, JSON.stringify(serialized, null, 2) + '\n\n' + JSON.stringify(expected, null, 2));
    };
}

function assertDepsFull(deps, expected) {
    return function() {
        var serialized = new Deps().parse(deps).serializeFull();
        assert.deepEqual(serialized, expected, JSON.stringify(serialized, null, 4) + '\n\n' + JSON.stringify(expected, null, 4))
    }
}

function assertDepsMap(deps, expected) {
    return function() {
        var serialized = new Deps()
            .parse(deps)
            .map(function(i) {
                return i.item;
            });
        assert.deepEqual(serialized, expected, JSON.stringify(serialized, null, 4) + '\n\n' + JSON.stringify(expected, null, 4))
    }
}

function assertBuildKey(item, expected) {
    return function () {
        assert.equal(new DepsItem(item).buildKey(), expected);
    };
}

describe('Deps', function() {

    describe('parsing:', function() {

        describe('old format with names', function() {

            it('block', assertDepsFull([ { name: 'b1' } ], {
                '': {
                    shouldDeps: ['b1'],
                    mustDeps: [],
                    item: {},
                    key: ''
                },
                'b1': {
                    shouldDeps: [],
                    mustDeps: [],
                    item: { block: 'b1' },
                    key: 'b1'
                }
            }));

            it('block with elem', assertDepsFull(
                [ {
                    name: 'b1',
                    elems: [ { name: 'e1' } ]
                } ],
                {
                    '': {
                        shouldDeps: [ 'b1', 'b1__e1' ],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    },
                    'b1__e1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1', elem: 'e1' },
                        key: 'b1__e1'
                    }
                }
            ));

            it('block with elem with mods with vals', assertDepsFull(
                [
                    { name: 'b1', elems: [
                        { name: 'e1', mods: [
                            { name: 'm1', vals: [ 'v1', 'v2' ] } ] } ] }
                ],
                {
                    '': {
                        shouldDeps: [
                            'b1',
                            'b1__e1',
                            'b1__e1_m1',
                            'b1__e1_m1_v1',
                            'b1__e1_m1_v2'
                        ],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    },
                    'b1__e1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1', elem: 'e1' },
                        key: 'b1__e1'
                    },
                    'b1__e1_m1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: {
                            block: 'b1',
                            elem: 'e1',
                            mod: 'm1'
                        },
                        key: 'b1__e1_m1'
                    },
                    'b1__e1_m1_v1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: {
                            block: 'b1',
                            elem: 'e1',
                            mod: 'm1',
                            val: 'v1'
                        },
                        key: 'b1__e1_m1_v1'
                    },
                    'b1__e1_m1_v2': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: {
                            'block': 'b1',
                            'elem': 'e1',
                            'mod': 'm1',
                            'val': 'v2'
                        },
                        key: 'b1__e1_m1_v2'
                    }
                }
            ));

            it('block with mods with vals and with elems', assertDepsFull(
                [ { name: 'b1',
                    elems: [ 'e1', 'e2' ],
                    mods: [
                        { name: 'm1', val: 'v1' },
                        { name: 'm2', val: 'v2' }
                    ]
                } ],
                {
                    '': {
                        shouldDeps: [
                            'b1',
                            'b1__e1',
                            'b1__e2',
                            'b1_m1_v1',
                            'b1_m2_v2'
                        ],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    },
                    'b1__e1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1', elem: 'e1' },
                        key: 'b1__e1'
                    },
                    'b1__e2': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1', elem: 'e2' },
                        key: 'b1__e2'
                    },
                    'b1_m1_v1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: {
                            block: 'b1',
                            mod: 'm1',
                            val: 'v1'
                        },
                        key: 'b1_m1_v1'
                    },
                    'b1_m2_v2': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: {
                            block: 'b1',
                            mod: 'm2',
                            val: 'v2'
                        },
                        key: 'b1_m2_v2'
                    }
                }
            ));

        });

        describe('new format', function() {

            it('block', assertDepsFull(
                [ { block: 'b1' } ],
                {
                    '': {
                        shouldDeps: ['b1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    }
                }
            ));

            it('elem', assertDepsFull(
                [ { block: 'b1', elem: 'e1' } ],
                {
                    '': {
                        shouldDeps: ['b1__e1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1__e1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: {
                            block: 'b1',
                            elem: 'e1'
                        },
                        key: 'b1__e1'
                    }
                }
            ));

            it('block with shouldDeps and mustDeps', assertDepsFull(
                [ {
                    block: 'b1',
                    shouldDeps: [
                        { block: 'b2', mustDeps: 'b3' },
                        'b3'
                    ]
                } ],
                {
                    '': {
                        shouldDeps: ['b1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: ['b2', 'b3'],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    },
                    'b2': {
                        shouldDeps: [],
                        mustDeps: ['b3'],
                        item: { block: 'b2' },
                        key: 'b2'
                    },
                    'b3': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b3' },
                        key: 'b3'
                    }
                }
            ));

            it('simple blocks', assertDepsFull(
                [ 'b1', 'b2' ],
                {
                    '': {
                        shouldDeps: ['b1', 'b2'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    },
                    'b2': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b2' },
                        key: 'b2'
                    }
                }
            ));

        });

        describe('new format with techs', function() {

            it('block', assertDepsFull(
                [ { tech: 't1', block: 'b1' } ],
                {
                    '': {
                        shouldDeps: ['b1.t1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1.t1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1', tech: 't1' },
                        key: 'b1.t1'
                    }
                }
            ));

            it('elem', assertDepsFull(
                [ { block: 'b1', elem: 'e1' } ],
                {
                    '': {
                        shouldDeps: ['b1__e1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1__e1': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b1', elem: 'e1' },
                        key: 'b1__e1'
                    }
                }
            ));

            it('block with tech', assertDepsFull(
                {
                    block: 'b1',
                    tech: 't1',
                    shouldDeps: ['b2', 'b3'],
                    mustDeps: ['b0', 'b4']
                },
                {
                    '': {
                        shouldDeps: ['b1.t1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1.t1': {
                        shouldDeps: ['b2', 'b3'],
                        mustDeps: ['b0', 'b4'],
                        item: { block: 'b1', tech: 't1' },
                        key: 'b1.t1'
                    },
                    'b0': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b0' },
                        key: 'b0'
                    },
                    'b4': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b4' },
                        key: 'b4'
                    },
                    'b2': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b2' },
                        key: 'b2'
                    },
                    'b3': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b3' },
                        key: 'b3'
                    }
                }
            ));

            it('block with techs', assertDepsFull(
                {
                    block: 'b1',
                    tech: 't1',
                    shouldDeps: { block: 'b2', tech: 't2' }
                },
                {
                    '': {
                        shouldDeps: ['b1.t1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1.t1': {
                        shouldDeps: ['b2.t2'],
                        mustDeps: [],
                        item: { block: 'b1', tech: 't1' },
                        key: 'b1.t1'
                    },
                    'b2.t2': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b2', tech: 't2' },
                        key: 'b2.t2'
                    }
                }
            ));

            it('block with and without tech', assertDepsFull(
                {
                    block: 'b1',
                    shouldDeps: {
                        block: 'b2',
                        tech: 't2',
                        shouldDeps: { block: 'b3' }
                    }
                },
                {
                    '': {
                        shouldDeps: ['b1'],
                        mustDeps: [],
                        item: {},
                        key: ''
                    },
                    'b1': {
                        shouldDeps: ['b2.t2'],
                        mustDeps: [],
                        item: { block: 'b1' },
                        key: 'b1'
                    },
                    'b2.t2': {
                        shouldDeps: ['b3'],
                        mustDeps: [],
                        item: { block: 'b2', tech: 't2' },
                        key: 'b2.t2'
                    },
                    'b3': {
                        shouldDeps: [],
                        mustDeps: [],
                        item: { block: 'b3'},
                        key: 'b3'
                    }
                }
            ));

        });

        describe('noDeps', function() {

            it('block', assertDepsMap(
                [
                    {
                        block: 'b1',
                        shouldDeps: ['b2', 'b3'],
                        mustDeps: ['b0', 'b4']
                    },
                    {
                        block: 'b1',
                        noDeps: ['b2', 'b4']
                    }
                ],
                [
                    { block: 'b0' },
                    { block: 'b1' },
                    { block: 'b3' }
                ]
            ));

        });

    });

    describe('serialize:', function() {

        describe('empty deps serialize to {}', function() {

            var empty = {};

            it('empty deps object: new Deps()', function() {
                assert.deepEqual(new Deps().serialize(), empty);
            });

            it('empty object: {}', assertDepsParse({}, empty));

            it('empty array: []', assertDepsParse([], empty));

            it('undefined', assertDepsParse(undefined, empty));

        });

    });

    describe('clone', function() {

        var deps1 = new Deps().parse([{ block: 'b1', bla: 1 }, 'b2']),
            deps2 = deps1.clone(),
            deps = [deps1, deps2];

        it('.items', function() {
            assert.deepEqual(deps[1].items, deps[0].items)
        });

        it('.itemsByOrder', function() {
            assert.deepEqual(deps[1].itemsByOrder, deps[0].itemsByOrder)
        });

    });

    describe('subtract', function() {

        var deps1 = new DEPS.Deps().parse([
                { block: 'b1' },
                { block: 'b2' },
                { block: 'b3' },
                { block: 'b5' }
            ]),

            deps2 = new DEPS.Deps().parse([
                { block: 'b1' },
                { block: 'b3' },
                { block: 'b4' }
            ]),

            deps3 = new DEPS.Deps().parse([
                { block: 'b5' }
            ]);

        deps1.subtract(deps2).subtract(deps3);

        it('works correctly', function() {
            assert.deepEqual(deps1.serialize(), {
                '': {
                    '': [ { block: 'b2' } ]
                }
            });
        });

    });

    describe('intersect', function() {

        var deps1 = new DEPS.Deps().parse([
                { block: 'b1' },
                { block: 'b2' },
                { block: 'b3' },
                { block: 'b5' }
            ]),

            deps2 = new DEPS.Deps().parse([
                { block: 'b3' },
                { block: 'b1' },
                { block: 'b4' }
            ]),

            deps3 = new DEPS.Deps().parse([
                { block: 'b3' },
                { block: 'b6' },
                { block: 'b1' }
            ]);

        deps1.intersect(deps2).intersect(deps3);

        it('works correctly', function() {
            assert.deepEqual(deps1.serialize(), {
                '': {
                    '': [
                        { block: 'b1' },
                        { block: 'b3' }
                    ]
                }
            });
        });

    });

    describe('DepsItem', function() {

        describe('buildKey', function() {

            it('block without tech', assertBuildKey(
                { block: 'b1' },
                'b1'));

            it('block modifier without tech', assertBuildKey(
                { block: 'b1', mod: 'm1' },
                'b1_m1'));

            it('block modifier value without tech', assertBuildKey(
                { block: 'b1', mod: 'm1', val: 'v1' },
                'b1_m1_v1'));

            it('block element without tech', assertBuildKey(
                { block: 'b1', elem: 'e1' },
                'b1__e1'));

            it('element modifier without tech', assertBuildKey(
                { block: 'b1', elem: 'e1', mod: 'm1' },
                'b1__e1_m1'));

            it('element modifier value without tech', assertBuildKey(
                { block: 'b1', elem: 'e1', mod: 'm1', val: 'v1' },
                'b1__e1_m1_v1'));

            it('block with tech', assertBuildKey(
                { tech: 't1', block: 'b1' },
                'b1.t1'));

            it('block modifier with tech', assertBuildKey(
                { tech: 't1', block: 'b1', mod: 'm1' },
                'b1_m1.t1'));

            it('block modifier value with tech', assertBuildKey(
                { tech: 't1', block: 'b1', mod: 'm1', val: 'v1' },
                'b1_m1_v1.t1'));

            it('block element with tech', assertBuildKey(
                { tech: 't1', block: 'b1', elem: 'e1' },
                'b1__e1.t1'));

            it('element modifier with tech', assertBuildKey(
                { tech: 't1', block: 'b1', elem: 'e1', mod: 'm1' },
                'b1__e1_m1.t1'));

            it('element modifier value with tech', assertBuildKey(
                { tech: 't1', block: 'b1', elem: 'e1', mod: 'm1', val: 'v1' },
                'b1__e1_m1_v1.t1'));

            it('just tech', assertBuildKey(
                { tech: 't1' },
                '.t1'));

            it('empty', assertBuildKey(
                {},
                ''));

        });

    });

});
