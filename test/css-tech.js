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
'use strict';

var BEMTesting = require('bem-smoke');

describe('css tech', function() {
    var tech;
    beforeEach(function () {
        tech = BEMTesting.testTech(require.resolve('../lib/techs/v2/css.js'));
    });

    describe('creation', function(done) {

        it('creates selector with block name', function(done) {
            tech.create({
                block: 'menu'
            })
            .producesFile('menu/menu.css')
            .withContent('.menu',
                         '{',
                         '}',
                         '')
            .notify(done);
        });

        it('creates selector with block and element name', function(done){
            tech.create({
                block: 'menu',
                elem: 'item'
            })
            .producesFile('menu/__item/menu__item.css')
            .withContent('.menu__item',
                        '{',
                        '}',
                        '')
            .notify(done);
        });

        it('creates selector with block and modifier name/value', function (done) {
            tech.create({
                block: 'menu',
                mod: 'size',
                val: 'large'
            })
            .producesFile('menu/_size/menu_size_large.css')
            .withContent('.menu_size_large',
                         '{',
                         '}',
                         '')
            .notify(done);
        });

        it('creates selector with block, element and modifier name/value', function(done){
            tech.create({
                 block: 'menu',
                 elem: 'item',
                 mod: 'color',
                 val: 'red'
             })
            .producesFile('menu/__item/_color/menu__item_color_red.css')
            .withContent('.menu__item_color_red',
                         '{',
                         '}',
                         '')
            .notify(done);
        });
    });

    describe('building', function() {
        it('produces concatenated css on one level', function(done) {
            tech.withSourceFiles({
                'menu': {
                    'menu.css': '.test1 {}',
                    '__item': {
                        'menu__item.css': '.test2 {}'
                    }
                }
            })
            .build('/name', {
                deps: [
                    {block: 'menu'},
                    {block: 'menu', elem: 'item'}
                ]
            })
            .producesFile('name.css')
            .withContent('@import url(menu/menu.css);',
                         '@import url(menu/__item/menu__item.css);',
                         '')
            .notify(done);
        });

        it('produces concatenated css on multiple levels', function (done) {
            tech.withSourceFiles({
                'world1-1': {
                    'menu': {
                        'menu.css': 'World 1-1'
                    }
                },
                'world1-2': {
                    'menu': {
                        'menu.css': 'World 1-2'
                    }
                }
            })
            .withLevels([
                '/world1-1',
                '/world1-2'
            ])
            .build('/name', {
                deps: [
                    {block: 'menu'}
                ]
            })
            .producesFile('name.css')
            .withContent('@import url(world1-1/menu/menu.css);',
                         '@import url(world1-2/menu/menu.css);',
                         '')
            .notify(done);
        });
    });

});
