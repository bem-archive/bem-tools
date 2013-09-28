'use strict';
var registry = require('./nodesregistry'),
    levelManager = require('./level/level-manager').get(),
    LevelConfig = require('./level/levels-config');


function MakefileReader() {
    var make = {},
        sections = {};

    this.read = function(path, sectionsToRun) {
        readSections(path);
        configure(sectionsToRun);
    };

    function readSections(path) {
        require(path)(make);
    }

    function configure(sectionsToRun) {
        if (!sectionsToRun) {
            sectionsToRun = Object.keys(sections);
        }

        sectionsToRun.forEach(function(name) {
            var section = sections[name];
            if (!section.run) {
                if (typeof section.config === 'function') {
                    section.config = section.config();
                }
                section.callback(section.config);
                section.run = true;
            }
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
MakefileReader.get = function() {
    if (!instance) {
        instance = new MakefileReader();
    }
    return instance;
};

module.exports = MakefileReader;
