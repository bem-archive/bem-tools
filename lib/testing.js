'use strict';
var INHERIT = require('inherit'),
    MOCKS = require('mocks'),
    Q = require('q'),
    MockFs = require('q-io/fs-mock'),
    assert = require('chai').assert;
    

require('chai').use(require('chai-as-promised'));

var TechTest = INHERIT({

    __constructor: function(modulePath) {
        this._modulePath = modulePath;
    },

    /*
     * Setup methods
     */
    withSourceFiles: function(sources) {
        this._sources = sources;
        return this;
    },

    /**
     * Action methods
     */
    create: function(elem) {
        var self = this;
        this.loadTech();

        var level = this.createLevel('/');

        this.enqueue(function () {
            return self._tech.createByDecl(elem, level, {});
        });
        return this;
    },

    build: function(output, decl) {
        throw new Error('not implemented yet');
        /*var self = this;
        this.loadTech();
        output = output || '/';

        var level = this.createLevel('/');
        level.getTechs = function() {
            var result = {};
            result[self._tech.getTechName()] = self._tech.getTechPath();
            return result;
        };

        this.enqueue(function () {
            return self._tech.buildByDecl(Q(decl), [level], output, {});
        });
        return this;*/
    },

    /**
     * @private
     */
    enqueue: function(call) {
        if (!this._promise) {
            this._promise = call();
        } else {
            this._promise = this._promise.then(call);
        }
    },

    /*
     * Assert methods
     */

    producesFile: function(name) {
        var self = this;
        this._lastFileName = name;
        this.enqueue(function() {
            return assert.eventually.isTrue(self._fs.exists(name), 'expected tech to produce file ' + name);
        });
        return this;
    },

    withContent: function(content) {
        var self = this;

        if (arguments.length > 1) {
            content = Array.prototype.join.call(arguments, '\n');
        }
        this.enqueue(function() {
            return assert.eventually.equal(
                self._fs.read(self._lastFileName),
                content,
                'expected file ' + self._lastFileName + ' to have content ' + content);
        });
        return this;
    },

    notify: function(done) {
        this._promise.then(done, done);
    },

    promise: function() {
        return this._promise;
    },

    /**
     * @private
     */
    loadTech: function() {
        if (this._tech) {
            return;
        }

        this._fs = new MockFs(this._sources || {});

        var mocks = {
            'q-io/fs': this._fs
        };

        var MOCKTECH = MOCKS.loadFile(require.resolve('./tech'), mocks, {}, true);

        this.createLevel = MOCKS.loadFile(require.resolve('./level', mocks, {}, true)).exports.createLevel;

        var TechClass = MOCKTECH.getTechClass(this._modulePath);
        this._tech = new TechClass(null, this._modulePath);
        this._tech.setContext({opts:{}});
    },
});


exports.testTech = function(moduleName) {
    return new TechTest(moduleName);
};
