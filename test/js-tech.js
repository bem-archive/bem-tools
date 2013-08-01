'use strict';

var BEMTesting = require('../lib/testing');

describe('js tech', function() {
    var tech;
    beforeEach(function() {
        tech = BEMTesting.testTech(require.resolve('../lib/techs/v2/js'));
    });

    describe('build', function() {
        it('produces concatenated js on one level', function(done) {
            tech.withSourceFiles({
                'menu': {
                    'menu.js': 'console.log("menu")',
                    '__item': {
                        'menu__item.js': 'console.log("item")'
                    }
                }
            })
            .build('/out', {
                deps: [
                    {block: 'menu'},
                    {block: 'menu', elem: 'item'}
                ]
            })
            .producesFile('/out.js')
            .withContent('/* menu/menu.js: begin */ /**/',
                         'console.log("menu");',
                         '/* menu/menu.js: end */ /**/',
                         '',
                         '/* menu/__item/menu__item.js: begin */ /**/',
                         'console.log("item");',
                         '/* menu/__item/menu__item.js: end */ /**/',
                         '',
                         ''
                        )
            .notify(done);
        });

        it('produces concatenated js on multiple levels', function(done) {
            tech.withSourceFiles({
                'level1': {
                    'menu': {
                        'menu.js': 'console.log("hello from l1")'
                    }
                },

                'level2': {
                    'menu': {
                        'menu.js': 'console.log("hello from l2")'
                    }
                }
            })
            .withLevels(['/level1', '/level2'])
            .build('/out', {
                deps: [
                    {block: 'menu'}
                ]
            })
            .producesFile('/out.js')
            .withContent('/* level1/menu/menu.js: begin */ /**/',
                         'console.log("hello from l1");',
                         '/* level1/menu/menu.js: end */ /**/',
                         '',
                         '/* level2/menu/menu.js: begin */ /**/',
                         'console.log("hello from l2");',
                         '/* level2/menu/menu.js: end */ /**/',
                         '',
                         ''
                        )
            .notify(done);
        });
    });
});
