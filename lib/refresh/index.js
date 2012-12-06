/**
 * Refresh server creates a real-time link between your web browser and your file
 * system.
 *
 * When you save a file, used by the HTML page in your browser, It
 * will make the browser reload depended resources.
 *
 * Inspired by https://github.com/andrewdavey/vogue
 */

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



var BundleWatcherRegistry = INHERIT({

    __constructor: function(bundleRoot) {
        this.watchers = {};
    },

    watch: function(bundleRoot, onChange) {
        console.log('watch', bundleRoot);
        watcher = this._getOrCreateWatcher(bundleRoot);
        watcher.on('change', onChange);
    },

    unwatch: function(bundleRoot, onChange) {
        console.log('unwatch', bundleRoot);
        if(!_.has(this.watchers, bundleRoot)) {
            return;
        }
        this.watchers[bundleRoot].removeListener('change', onChange);
        if(this.watchers[bundleRoot].listeners('change').length === 0) {
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
var Bundle = INHERIT({

    __constructor: function(bundleRoot) {
        this.bundleRoot = bundleRoot;
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
        return _.union([PATH.dirname(this.bundleRoot)], this._getBundleBuildLevels());
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
     */
    _getTechSuffix: function(filename) {
        var v = filename.match(/\.(.*)$/);
        return v ? v[1] : false;
    },

    _getBundleBuildLevels: function() {
        return this._getLevel().getConfig().bundleBuildLevels;
    },

    _getLevel: function() {
        var levelRoot = bemUtil.findLevel(this.bundleRoot);
        level = LEVEL.createLevel(levelRoot);
        return level;
    }

});


var bundleWatcherRegistry = new BundleWatcherRegistry();


exports.Server = INHERIT({

    __constructor: function(root) {
        this.script_name = '/refresh';
        this.root = root;
    },

    listen: function(httpServer) {
        var io = SOCKETIO.listen(httpServer);
        httpServer.on('request', _.bind(this._handleHttpRequest, this));
        io.sockets.on('connection', _.bind(this._onConnection, this));
    },

    /**
     * _onConnection handles single page.
     *
     * @param  {Socket} socket.io web socket.
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
                filename: filename, // what's changed
                resources: changedResources // what to reload
            };
            socket.emit("update", msg);
            console.log("update:", msg);
        };

        socket.on('watch', function(data) {
            var pathname = URL.parse(data.url).pathname,
                relPath = QS.unescape(pathname).replace(/^\/|\/$/g, '');
            bundleRoot = PATH.join(this.root, relPath);
            bundleResources = _.union(bundleResources, data.resources);
            bundleWatcherRegistry.watch(bundleRoot, onChange);
        });

        socket.on('disconnect', function() {
            bundleWatcherRegistry.unwatch(bundleRoot, onChange);
        });

        socket.emit('connected', {
            accept: true
        });

    },

    _handleHttpRequest: function(request, response) {
        var pathname = URL.parse(request.url).pathname;
        if(pathname === this.script_name + '/vogue-client.js') {
            this._sendVogueClient(response);
        }
    },

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