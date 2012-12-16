/*jslint node:true */
/**
 * Refresh server creates a real-time link between your web browser and your file
 * system.
 *
 * When you save a file, used by the HTML page in your browser, It will make the
 * browser reload depended resources.
 *
 * Inspired by https://github.com/andrewdavey/vogue
 */

(function() {
    "use strict";

    var CHOKIDAR = require('chokidar'),
        FS = require('fs'),
        INHERIT = require('inherit'),
        QS = require('querystring'),
        SOCKETIO = require('socket.io'),
        URL = require('url'),
        _ = require('underscore'),
        LEVEL = require('../level'),
        PATH = require('../path'),
        bemUtil = require('../util');


    /**
     * Watch for filesystem changes.
     */
    var BundleWatcherRegistry = INHERIT({

        __constructor: function(bundleRoot) {
            this.watchers = {};
        },

        watch: function(bundleRoot, onChange) {
            console.log('watch', bundleRoot);
            var watcher = this._getOrCreateWatcher(bundleRoot);
            watcher.on('change', onChange);
        },

        unwatch: function(bundleRoot, onChange) {
            console.log('unwatch', bundleRoot);
            if(!_.has(this.watchers, bundleRoot)) {
                return;
            }
            this.watchers[bundleRoot].removeListener('change', onChange);
            if(this.watchers[bundleRoot].listeners('change').length === 0) {
                // no more watchers, therefore we can to dispose this watcher
                console.log('close watcher ', bundleRoot);
                this.watchers[bundleRoot].close();
                delete this.watchers[bundleRoot];
            }
        },

        _getOrCreateWatcher: function(bundleRoot) {
            if(!_.has(this.watchers, bundleRoot)) {
                this.watchers[bundleRoot] = this._createWatcher(bundleRoot);
            }
            return this.watchers[bundleRoot];
        },

        _createWatcher: function(bundleRoot) {
            var bundle = new Bundle(bundleRoot),
                sourceRoots = bundle.getSourceRoots(),
                watcher = CHOKIDAR.watch(sourceRoots, {
                    persistent: true,
                    ignored: function(filename) {
                        var ignored = true;
                        if(FS.statSync(filename).isDirectory() || bundle.isSource(filename)) {
                            ignored = false;
                        }
                        //console.log(filename, ignored);
                        return ignored;
                    }
                });
            return watcher;
        }

    });


    /**
     * The Bundle.
     */
    var Bundle = exports._Bundle = INHERIT({

        /**
         * Bundle constructor.
         *
         * @param {string}  filename points to the bundle root directory itself or any inside it.
         */
        __constructor: function(filename) {
            var levelRoot = bemUtil.findLevel(filename),
                a = filename,
                t;
            while(!PATH.isRoot(a) && (t = PATH.dirname(a)) !== levelRoot) {
                a = t;
            }
            this.bundleRoot = !PATH.isRoot(a) ? a : filename;
        },

        /**
         * Check filename points to the bundle source.
         *
         * @param  {String}  filename
         * @return {Boolean}          true if filename is source file otherwise false.
         */
        isSource: function(filename) {
            var techs = this._getTechs(),
                techSuffix = this._getTechSuffix(filename);
            return techs.indexOf(techSuffix) !== -1;
        },

        /**
         * Return directories where bundle sources are located.
         * @return {Array} the list of bundle directories.
         */
        getSourceRoots: function() {
            return _.union([this.bundleRoot], this._getBuildLevels());
        },

        /**
         * Return list of the bundle techs.
         *
         * @return {List}
         */
        _getTechs: function() {
            return _.keys(this._getLevel().getTechs());
        },

        /**
         * Return tech suffix for given filename.
         *
         * @param  {String} filename.
         * @return {String}          tech suffix (for ex. 'bemjson.js')
         * @api private
         */
        _getTechSuffix: function(filename) {
            var v = PATH.basename(filename).match(/\.(.*)$/);
            return v ? v[1] : false;
        },

        /**
         * Return the list of bundle build levels.
         *
         * @return {Array} of build level paths.
         * @api private
         */
        _getBuildLevels: function() {
            return this._getLevel().getConfig().bundleBuildLevels || [];
        },

        /**
         * Return the bem Level object that owns the bundle.
         *
         * @return {Level} object.
         * @api private
         */
        _getLevel: function() {
            var levelRoot = bemUtil.findLevel(this.bundleRoot),
                level = LEVEL.createLevel(levelRoot);
            return level;
        }

    });


    var gBundleWatcherRegistry = new BundleWatcherRegistry();


    /**
     * The Server class.
     *
     * @api public
     */
    exports.Server = INHERIT({

        /**
         * Server constructor.
         *
         * @param  {string} root project root directory.
         */
        __constructor: function(root) {
            this.script_name = '/refresh';
            this.projectRoot = root;
            this.bundleWatcherRegistry = gBundleWatcherRegistry;
        },

        /**
         * Add listeners to the http server.
         *
         * @param  {http.Server} httpServer
         */
        listen: function(httpServer) {
            var io = SOCKETIO.listen(httpServer);
            httpServer.on('request', _.bind(this._handleHttpRequest, this));
            io.sockets.on('connection', _.bind(this._onConnection, this));
        },

        /**
         * Handles single page.
         *
         * @param  {Socket} socket.io client web socket.
         */
        _onConnection: function(socket) {
            console.log("Connected!");

            var _this = this,
                bundleResources = [],
                bundleRoot;

            var onChange = function(filename) {
                    // FIXME: filter bundleResources by dependence on changed filename
                    // FIXME: omit duplicate resource updates on update dependend files
                    //        (now we emit 3 sequenced messages on change
                    //        blocks/b-name/b-name.css -> pages/index/index.css -> pages/index/_index.css)
                    var changedResources = bundleResources;
                    var msg = {
                        event: 'change',
                        filename: filename,
                        // what's changed
                        resources: changedResources // what to reload
                    };
                    socket.emit("update", msg);
                    console.log("update:", msg);
                };

            socket.on('watch', function(data) {
                var pathname = URL.parse(data.url).pathname,
                    relFilename = QS.unescape(pathname).replace(/^\/|\/$/g, '');
                bundleRoot = PATH.join(this.projectRoot, relFilename);
                bundleResources = _.union(bundleResources, data.resources);
                this.bundleWatcherRegistry.watch(bundleRoot, onChange);
            });

            socket.on('disconnect', function() {
                this.bundleWatcherRegistry.unwatch(bundleRoot, onChange);
            });

            socket.emit('connected', {
                accept: true
            });

        },

        /**
         * Handles http request to send client script.
         *
         * @param  {http.ServerRequest}  request
         * @param  {http.ServerResponse} response
         * @api private
         */
        _handleHttpRequest: function(request, response) {
            var pathname = URL.parse(request.url).pathname;
            if(pathname === this.script_name + '/vogue-client.js') {
                this._sendVogueClient(response);
            }
        },

        /**
         * Sends client script.
         *
         * @param  {http.ServerResponse} response
         * @api private
         */
        _sendVogueClient: function(response) {
            FS.readFile(__dirname + '/client/vogue-client.js', function(e, fileData) {
                var script = fileData.toString();
                response.writeHead(200, {
                    'Content-Type': 'text/javascript'
                });
                response.write(script);
                response.end();
            });
        }

    });

}());