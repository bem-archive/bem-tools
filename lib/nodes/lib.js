var Q = require('q'),
    INHERIT = require('inherit'),
    CP = require('child_process'),
    PATH = require('path'),
    UTIL = require('util'),

    Node = require('./node').Node;

var LibraryNode = exports.LibraryNode = INHERIT(Node, {

    __constructor: function(path, repo, treeish) {
        this.path = path;
        this.repo = repo;
        this.treeish = treeish || 'master';
        // TODO: path relative to the project root must be passed
        this.__base(PATH.basename(this.path));
    },

    getInitialCheckoutCmd: function() {

    },

    getUpdateCmd: function() {

    },

    getRevCheckoutCmd: function() {

    },

    make: function() {
        var _this = this,
            up = Q.defer(),
            cmd,
            updateCmd = this.getUpdateCmd();

        if (PATH.existsSync(this.path) && updateCmd) {
            // git pull origin master
            cmd = updateCmd;
        } else {
            // git clone repo path
            cmd = this.getInitialCheckoutCmd();
        }

        this.log(cmd);
        CP.exec(cmd, function(err, stdout, stderr) {
            stdout && _this.log(stdout);
            stderr && _this.log(stderr);

            err? up.reject(err) : up.resolve();
        });

        return Q.when(up.promise, function() {
            // git checkout treeish
            var co = Q.defer();
            cmd = _this.getRevCheckoutCmd();

            if (cmd) {
                _this.log(cmd);
                CP.exec(cmd, function(err, stdout, stderr) {
                    stdout && _this.log(stdout);
                    stderr && _this.log(stderr);

                    err? co.reject(err) : co.resolve();
                });
                return co.promise;
            }
        });
    }

});

exports.GitLibraryNode = INHERIT(LibraryNode, {

    getInitialCheckoutCmd: function() {
        return UTIL.format('git clone --progress %s %s', this.repo, this.path);
    },

    getUpdateCmd: function() {
        return UTIL.format('cd %s && git pull --progress origin %s', this.path, this.treeish);
    },

    getRevCheckoutCmd: function() {
        return UTIL.format('cd %s && git checkout %s', this.path, this.treeish);
    }
});

exports.SvnLibraryNode = INHERIT(LibraryNode, {

    getInitialCheckoutCmd: function() {
        return UTIL.format('svn co -r %s %s %s', this.treeish, this.repo, this.path);
    },

    getUpdateCmd: function() {
        return UTIL.format('svn up -r %s %s', this.treeish, this.path);
    },

    getRevCheckoutCmd: function() {
        return this.getUpdateCmd();
    }
});