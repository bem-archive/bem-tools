'use strict';

var assert = require('chai').assert,
    DEPS = require('..').require('./techs/v2/deps.js.js'),
    Deps = DEPS.Deps,
    DepsItem = DEPS.DepsItem;

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

function assertDepsParse(deps, expected) {
    return function () {
        assert.deepEqual(new Deps().parse(deps).serialize(), expected);
    };
}

function assertBuildKey(item, expected) {
    return function () {
        assert.equal(new DepsItem(item).buildKey(), expected);
    };
}

describe('Deps', function() {

    describe('parsing:', function() {

        describe('old format with names', function() {

            it('block', assertDepsParse(
                [ { name: 'b1' } ],
                { '': { '': [ { block: 'b1' } ] } }
            ));

            it('block with elem', assertDepsParse(
                [ { name: 'b1', elems: [ { name: 'e1' } ] } ],
                { '': { '': [ { block: 'b1' }, { block: 'b1', elem: 'e1' } ] } }
            ));

            it('block with elem with mods with vals', assertDepsParse(
                [
                    { name: 'b1', elems: [
                        { name: 'e1', mods: [
                            { name: 'm1', vals: [ 'v1', 'v2' ] } ] } ] }
                ],
                { '': { '': [
                    { block: 'b1' },
                    { block: 'b1', elem: 'e1' },
                    { block: 'b1', elem: 'e1', mod: 'm1' },
                    { block: 'b1', elem: 'e1', mod: 'm1', val: 'v1' },
                    { block: 'b1', elem: 'e1', mod: 'm1', val: 'v2' }
                ] } }
            ));

            it('block with mods with vals and with elems', assertDepsParse(
                [ { name: 'b1',
                    elems: [ 'e1', 'e2' ],
                    mods: [
                        { name: 'm1', val: 'v1' },
                        { name: 'm2', val: 'v2' }
                    ]
                } ],
                { '': { '': [
                    { block: 'b1' },
                    { block: 'b1', elem: 'e1' },
                    { block: 'b1', elem: 'e2' },
                    { block: 'b1', mod: 'm1', val: 'v1' },
                    { block: 'b1', mod: 'm2', val: 'v2' }
                ] } }
            ));

        });

        describe('new format', function() {

            it('block', assertDepsParse(
                [ { block: 'b1' } ],
                { '': { '': [ { block: 'b1' } ] } }
            ));

            it('elem', assertDepsParse(
                [ { block: 'b1', elem: 'e1' } ],
                { '': { '': [ { block: 'b1', elem: 'e1' } ] } }
            ));

            it('block with shouldDeps and mustDeps', assertDepsParse(
                [ { block: 'b1', shouldDeps: [ { block: 'b2', mustDeps: 'b3' }, 'b3' ] } ],
                { '': { '': [ { block: 'b1' }, { block: 'b3' }, { block: 'b2' } ] } }
            ));

            it('simple blocks', assertDepsParse(
                [ 'b1', 'b2' ],
                { '': { '': [ { block: 'b1' }, { block: 'b2' } ] } }
            ));

            it('block with elems', assertDepsParse(
                [ { block: 'b1', elems: [ 'e1', 'e2' ] } ],
                { '': { '': [
                    {block: 'b1'},
                    {block: 'b1', elem: 'e1'},
                    {block: 'b1', elem: 'e2'},
                ] } }
            ));

            it('block with elem array', assertDepsParse(
                [ { block: 'b1', elem: ['e1', 'e2'] } ],
                { '': {'': [
                    {block: 'b1', elem: 'e1'},
                    {block: 'b1', elem: 'e2'}
                ] } }
            ));

        });

        describe('new format with techs', function() {

            it('block', assertDepsParse(
                [ { tech: 't1', block: 'b1' } ],
                { 't1': { 't1': [ { tech: 't1', block: 'b1' } ] } }
            ));

            it('elem', assertDepsParse(
                [ { block: 'b1', elem: 'e1' } ],
                { '': { '': [ { block: 'b1', elem: 'e1' } ] } }
            ));

            it('block with tech', assertDepsParse(
                { block: 'b1', tech: 't1', shouldDeps: [ 'b2', 'b3' ], mustDeps: [ 'b0', 'b4' ] },
                { 't1': { 't1': [
                    { block: 'b0', tech: 't1' },
                    { block: 'b4', tech: 't1' },
                    { block: 'b1', tech: 't1' },
                    { block: 'b2', tech: 't1' },
                    { block: 'b3', tech: 't1' }
                ] } }
            ));

            it('block with techs', assertDepsParse(
                { block: 'b1', tech: 't1', shouldDeps: { block: 'b2', tech: 't2' } },
                { 't1': {
                    't1': [ { block: 'b1', tech: 't1' } ],
                    't2': [ { block: 'b2', tech: 't2' } ]
                } }
            ));

            it('block with tech shortcut', assertDepsParse(
                {block: 'b1', tech: 't1', shouldDeps: {tech: 't2'}},
                { 't1': {
                    't1': [ { block: 'b1', tech: 't1'} ],
                    't2': [ { block: 'b1', tech: 't2'} ]
                  }
                }
            ));

            it('block with and without tech', assertDepsParse(
                { block: 'b1', shouldDeps: { block: 'b2', tech: 't2', shouldDeps: { block: 'b3' } } },
                { '': {
                    '': [ { block: 'b1' } ],
                    't2': [ { block: 'b2', tech: 't2' }, { block: 'b3', tech: 't2' } ]
                } }
            ));

        });

        describe('noDeps', function() {

            it('block', assertDepsParse(
                [
                    { block: 'b1', shouldDeps: [ 'b2', 'b3' ], mustDeps: [ 'b0', 'b4' ] },
                    { block: 'b1', noDeps: ['b2', 'b4'] }
                ],
                { '': { '': [ { block: 'b0' }, { block: 'b1' }, { block: 'b3' } ] } }
            ));

        });

        describe('include: false', function() {

            it('block', assertDepsParse(
                [
                    {
                        block: 'b1',
                        shouldDeps: [
                            { block: 'b2', include: false },
                            { block: 'b3', include: false }
                        ],
                        mustDeps: [
                            { block: 'b4', include: false },
                            { block: 'b5', include: false }
                        ]
                    },
                    { block: 'b3' },
                    { block: 'b4' }
                ],
                { '': { '': [ { block: 'b4' }, { block: 'b1' }, { block: 'b3' } ] } }
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

        var deps1, deps2, deps;

        beforeEach(function(){
            deps1 = new Deps().parse([{ block: 'b1', bla: 1 }, 'b2']);
            deps2 = deps1.clone();
            deps = [deps1, deps2];
        });

        it('.items', function() {
            assert.deepEqual(deps[1].items, deps[0].items);
        });

        it('.itemsByOrder', function() {
            assert.deepEqual(deps[1].itemsByOrder, deps[0].itemsByOrder);
        });

    });

    describe('subtract', function() {

        var deps1, deps2, deps3;

        beforeEach(function() {
            deps1 = new DEPS.Deps().parse([
                { block: 'b1' },
                { block: 'b2' },
                { block: 'b3' },
                { block: 'b5' }
            ]);

            deps2 = new DEPS.Deps().parse([
                { block: 'b1' },
                { block: 'b3' },
                { block: 'b4' }
            ]);

            deps3 = new DEPS.Deps().parse([
                { block: 'b5' }
            ]);

            deps1.subtract(deps2).subtract(deps3);
        });

        it('works correctly', function() {
            assert.deepEqual(deps1.serialize(), {
                '': {
                    '': [ { block: 'b2' } ]
                }
            });
        });

    });

    describe('intersect', function() {

        var deps1, deps2, deps3;

        beforeEach(function() {
            deps1 = new DEPS.Deps().parse([
                { block: 'b1' },
                { block: 'b2' },
                { block: 'b3' },
                { block: 'b5' }
            ]);

            deps2 = new DEPS.Deps().parse([
                { block: 'b3' },
                { block: 'b1' },
                { block: 'b4' }
            ]);

            deps3 = new DEPS.Deps().parse([
                { block: 'b3' },
                { block: 'b6' },
                { block: 'b1' }
            ]);

            deps1.intersect(deps2).intersect(deps3);
        });

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
