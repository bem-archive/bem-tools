'use strict';
var assert = require('chai').assert,
    LevelsConfig = require((process.env.COVER? '../lib-cov/ ': '../lib/' ) + 'make-config/levels-config'),
    LevelManager = require('..').LevelManager;

describe('levels config', function() {
    var config, manager;

    beforeEach(function() {
        manager = new LevelManager();
        config = new LevelsConfig(manager);
    });

    it('should allow to configure levels tech', function() {
        config.addLevel('test')
              .addTechs({
                  'test': '/path/to/test'
              });

        assert.deepEqual(manager.createLevel('test').getTechs(), {
            'test': '/path/to/test'
        });
    });

    it('should allow to configure level naming scheme', function() {
        var scheme = {'match-block': function() {}};

        config.addLevel('test')
              .setNamingScheme(scheme);
        
        assert.deepEqual(manager.createLevel('test')['match-block'], scheme['match-block']);
    });

    it('should allow to set level config', function() {
        var testConfig  = {key: 'value'};
        config.addLevel('test')
              .setConfig(testConfig);

        assert.deepEqual(manager.createLevel('test').getConfig(), testConfig);
    });

    it('should allow to configure level types', function() {
        config.addLevel('test')
              .addTypes('example');

        assert.deepEqual(manager.createLevel('test').getTypes(), ['level', 'example']);
    });

    it('should allow to set default techs', function() {
        config.addLevel('test')
              .setDefaultTechs(['js', 'css']);
        assert.deepEqual(manager.createLevel('test').getDefaultTechs(), ['js', 'css']);
    });

    it('should allow to extend previous declaration', function() {
        config
            .addLevel('parent')
                .addTechs({'parent': '/path/to/parent'})
            .addLevel('child', {extends: 'parent'})
                .addTechs({'child': '/path/to/child'});

        assert.deepEqual(manager.createLevel('child').getTechs(), {
            'parent': '/path/to/parent',
            'child': '/path/to/child'
        });

    });
});
