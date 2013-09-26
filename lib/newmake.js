'use strict';
var registry = require('./nodesregistry'),
    levelManager = require('./level/level-manager').get(),
    LevelConfig = require('./make-config/levels-config');


function MakefileReader() {
    var _this = this,
        sections = {};

    this.read = function(path) {
        require(path)(this);
    };


    function defineSection(name, handler) {
        _this[name] = function(cb) {
            if (sections[name]) {
                return;
            }
            sections[name] = {
                callback: cb,
                handler: handler,
                run: false
            };
        };
    }

    defineSection('nodes', registry);
    defineSection('levels', new LevelConfig(levelManager));

    this.configure = function(sectionsToRun) {
        if (!sectionsToRun) {
            sectionsToRun = Object.keys(sections);
        }

        sectionsToRun.forEach(function(name) {
            var section = sections[name];
            if (!section.run) {
                section.callback(section.handler);
            }
        });
    };
}


