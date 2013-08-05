'use strict';
var BEMSmoke = require('bem-smoke');

function bemJSON(json) {
    return '(' + JSON.stringify(json) + ');';
}

function bemDecl(json) {
    return 'exports.blocks = ' + JSON.stringify(json, null, 4) + ';\n';
}



describe('bemdecl.js tech', function() {

    function testBemDecl(params) {
        var tech = BEMSmoke.testTech(require.resolve('../lib/techs/v2/bemdecl.js.js'));
        tech.withSourceFiles({
            'block': {
                'block.bemjson.js': bemJSON(params.bemJSON)
            }
        })
        .create({block: 'block'})
        .producesFile('block/block.bemdecl.js')
        .withContent(bemDecl(params.expectedDecl))
        .notify(params.notify);
    }


    it('should transform bemjson with block file to decl', function (done) {

        testBemDecl({
            bemJSON: {
                block: 'b-page'
            },

            expectedDecl: [
                {name: 'b-page'}
            ],

            notify: done
        });

    });


    it('should tansform bemjson with nested blocks to decl', function (done) {

        testBemDecl({
            bemJSON: {
                block: 'b-page',
                content: [
                    {block: 'b-child'}
                ]
            },
            expectedDecl: [
                {name: 'b-page'},
                {name: 'b-child'}
            ],
            notify: done
        });

    });

    it('should transform bemjson with block and mods to decl', function (done) {
        testBemDecl({
            bemJSON: {
                block: 'b-page',
                mods: {
                    color: 'red'
                }
            },

            expectedDecl: [
                {
                    name: 'b-page',
                    mods: [
                        {name: 'color', vals: ['red']}
                    ]
                }
            ],

            notify: done
        });
    });

    it('should transoform bemjson with block and elem to decl', function (done) {
        testBemDecl({
            bemJSON: {
                block: 'menu',
                content: [
                    {block: 'menu', elem: 'item'}
                ]
            },

            expectedDecl: [
                {
                    name: 'menu',
                    elems: [
                        {name: 'item'}
                    ]
                }
            ],

            notify: done
        });
    });

    it('should transform bemjson with block and elem mods to decl', function (done) {
        testBemDecl({
            bemJSON: {
                block: 'menu',
                content: [
                    {
                        block: 'menu',
                        elem: 'item',
                        elemMods: {
                            size: 'large'
                        }
                    }
                ]
            },

            expectedDecl: [
                {
                    name: 'menu',
                    elems: [
                        {
                            name: 'item',
                            mods: [
                                {name: 'size', vals: ['large']}
                            ]
                        }
                    ]
                }
            ],

            notify: done
        });
    });

    it('should transform bemjson with mixins to decl', function (done) {
        testBemDecl({
            bemJSON: {
                block: 'super-menu',
                mix: [
                    {block: 'menu'}
                ]
            },

            expectedDecl: [
                {name: 'super-menu'},
                {name: 'menu'}
            ],

            notify: done
        });
    });

});
