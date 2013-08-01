'use strict';
var INHERIT = require('inherit'),
    requireMocked = require('require-mocked'),
    Q = require('q'),
    QFSMock = require('q-io/fs-mock'),
    assert = require('chai').assert,
    FSMock = require('./fs-mock');
    
var TechTest = INHERIT(/** @lends *TechTest.prototype*/{

    /**
     * Creates new instance 
     * @class TechTest class that assists functional testing of the technology modules.
     * @constructs
     * @param {String} modulePath an absolute path to technology module file.
     */
    __constructor: function(modulePath) {
        this._modulePath = modulePath;
    },

    /**
     * Specifies source files to use during the test.
     *
     * @param {Object} sources source files tree to use. Each key represents an FS node name.
     * If the value of a key is an object, then virtual directory of the same name will be created.
     * If value is string or Buffer, file with appropriate content will be created.
     *
     * @returns {TechTest}
     */
    withSourceFiles: function(sources) {
        this._sources = sources;
        //if(!this._sources['.bem']) {
            //this._sources['.bem'] = {};
        //}
        return this;
    },

    /**
     * Specifies single level to use during a test
     *
     * @param {String} level level path.
     * 
     * @returns {TechTest}
     */
    withLevel: function(level) {
        this.withLevels([level]);
        return this;
    },

    /**
     * Specifies multiple levels to use during a test.
     *
     * @param {String[]} levels array of level paths.
     *
     * @returns {TechTest}
     */
    withLevels: function(levels) {
        this._levelPaths = levels;
        return this;
    },

    /**
     * Creates element using then tech.
     *
     * @param {Object} elem element to create.
     * @param {String} elem.block block name.
     * @param {String} elem.elem element name.
     * @param {String} elem.mod modifier name.
     * @param {String} elem.val modifier value.
     *
     * @returns {TechTest}
     */
    create: function(elem) {
        this.load();

        var self = this;

        var level = this._levels[0];

        this.enqueue(function () {
            return self._tech.createByDecl(elem, level, {});
        });
        return this;
    },

    /**
     * Builds a project using tech.
     *
     * @todo Specifiy parameters
     */
    build: function(output, decl) {
        var self = this;
        this.load();

        this.enqueue(function () {
            /*jshint newcap:false*/
            return self._tech.buildByDecl(Q(decl), self._levels, output, {});
        });
        return this;
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

    /**
     * Checks that action results produces file with given name.
     * Checks only existence of the file. Use {@link TechTest#withContent} method
     * to assert on file content.
     *
     * @param {String} path a path to a file to check.
     *
     * @returns {TechTest}
     */

    producesFile: function(path) {
        var self = this;
        this._lastFileName = path;
        this.enqueue(function() {
            return assert.eventually.isTrue(self._fs.exists(path), 'expected tech to produce file ' + path);
        });
        return this;
    },

    /**
     * Used after {@link TechTest#producesFile} to check for actual file contents.
     *
     * @param {...String} content Expected file content. Each argument represents one expected line of
     * a file.
     *
     * @returns {TechTest}
     */
    withContent: function(content) {
        var self = this,
            fileName = this._lastFileName;

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

    /**
     * Notify test framework completion callback after all tests are finished.
     * @param {Function} done completion callback.
     *
     * @returns {TechTest}
     */
    notify: function(done) {
        this._promise.then(done, done);
        return this;
    },

    /**
     * @private
     */
    load: function() {
        if (this._tech) {
            return;
        }

        this._fs = new QFSMock(this._sources || {});

        var opts = {
            mocks: {
                'q-io/fs': this._fs,
                'fs': new FSMock(this._fs)
            },
            ignoreMocks: [
                'winston'
            ]
        };

        this.loadTech(opts);
        this.loadLevels(opts);
    },

    /**
     * @private
     */
    loadTech: function(opts) {
        var MOCKTECH = requireMocked(require.resolve('../tech'), opts);
        var TechClass = MOCKTECH.getTechClass(this._modulePath);
        this._tech = new TechClass(null, this._modulePath);
        this._tech.setContext({opts:{}});
    },

    /**
     * @private
     */
    loadLevels: function(opts) {
        var StubLevel = requireMocked(require.resolve('./stub-level'), opts);

        this._levelPaths = this._levelPaths || ['/'];

        this._levels = this._levelPaths.map(function(path) {
            return new StubLevel(path, this._tech);
        }, this);
    }
});


exports.TechTest = TechTest;

