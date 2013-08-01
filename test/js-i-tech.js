'use strict';
var BEMTesting = require('bem-smoke');

describe('js-i tech', function() {
    var tech;
    beforeEach(function() {
        tech = BEMTesting.testTech(require.resolve('../lib/techs/v2/js-i'));
    });

    describe('building', function() {
        it('produces js file with includes for all sources', function(done) {
            tech.withSourceFiles({
                'menu': {
                    'menu.js': '',
                    '__item': {
                        'menu__item.js': ''
                    }
                },
                'logo': {
                    'logo.js': ''
                }
            })
            .build('/out', {
                deps: [
                    {block: 'menu'},
                    {block: 'menu', elem: 'item'},
                    {block: 'logo'},
                ]
            })
            .producesFile('/out.js')
            .withContent('/*borschik:include:menu/menu.js*/;',
                         '/*borschik:include:menu/__item/menu__item.js*/;',
                         '/*borschik:include:logo/logo.js*/;',
                         '')
            .notify(done);
        });
    });
});
