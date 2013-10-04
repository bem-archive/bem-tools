'use strict';
var registry = require('./nodesregistry'),
    levelManager = require('./level/level-manager').get(),
    LevelConfig = require('./level/levels-config');


function MakeReader() {
    var make = {},
        sections = {};

    this.read = function(path, sectionsToRun) {
        readSections(path);
        runSections(sectionsToRun);
    };

    function readSections(path) {
        require(path)(make);
    }

    function runSections(sectionsToRun) {
        if (!sectionsToRun) {
            sectionsToRun = Object.keys(sections);
        }

        sectionsToRun.forEach(function(name) {
            var section = sections[name];
            if (!section || section.run) {
                return;
            }

            if (typeof section.config === 'function') {
                section.config = section.config();
            }
            section.callback(section.config);
            section.run = true;
        });
    }

    function defineSection(name, config) {
        make[name] = function(cb) {
            if (sections[name]) {
                return;
            }
            sections[name] = {
                callback: cb,
                config: config,
                run: false
            };
            return make;
        };
    }

    defineSection('levels', new LevelConfig(levelManager));
    defineSection('nodes', function() {
        require('./default-arch');
        return registry;
    });
}

var instance;
MakeReader.get = function() {
    if (!instance) {
        instance = new MakeReader();
    }
    return instance;
};

module.exports = MakeReader;
