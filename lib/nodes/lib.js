var Q = require('q'),
    QFS = require('q-fs'),
    INHERIT = require('inherit'),
    CP = require('child_process'),
    PATH = require('path'),
    URL = require('url'),
    UTIL = require('util'),

    Node = require('./node').Node;

var LibraryNode = exports.LibraryNode = INHERIT(Node, {

    __constructor: function(dest, repo, paths, treeish) {
        this.dest = dest;
        this.repo = repo;
        this.treeish = treeish || '';

        paths = Array.isArray(paths)? paths : [paths];
        this.paths = paths || [''];

        this.__base(this.dest);
    },

    getInitialCheckoutCmd: function(repo, dest) {},

    getUpdateCmd: function(repo, dest) {},

    isValid: function() {
        return this.lastRunTime && (Date.now() - this.lastRunTime <= 60000);
    },

    make: function(ctx) {
        var _this = this;

        return Q.all(this.paths.map(function(p) {
            var dest = PATH.join(ctx.root, _this.dest, p),
                repo = joinUrlPath(_this.repo, p);

            return QFS.exists(dest)
                .then(function(exists){
                    var cmd = exists? _this.getUpdateCmd(repo, dest) : _this.getInitialCheckoutCmd(repo, dest),
                        d = Q.defer();

                    _this.log(cmd);

                    CP.exec(cmd, function(err, stdout, stderr) {
                        stdout && _this.log(stdout);
                        stderr && _this.log(stderr);

                        if (err) return d.reject(err);

                        _this.lastRunTime = Date.now();
                        d.resolve();
                    });

                    return d.promise;
                });
        }));
    }

});

exports.GitLibraryNode = INHERIT(LibraryNode, {

    __constructor: function(dest, repo, paths, treeish) {
        this.__base(dest, repo, paths, treeish);
        this.treeish = treeish || 'master';
    },

    getInitialCheckoutCmd: function(repo, dest) {
        return UTIL.format('git clone --progress %s %s && cd %s && git checkout %s', repo, dest, dest, this.treeish);
    },

    getUpdateCmd: function(repo, dest) {
        return UTIL.format('cd %s && git checkout HEAD~ && git branch -D %s ; git fetch origin && git checkout --track -b %s origin/%s', dest, this.treeish, this.treeish, this.treeish);
    }

});

exports.SvnLibraryNode = INHERIT(LibraryNode, {

    __constructor: function(dest, repo, paths, treeish) {
        this.__base(dest, repo, paths, treeish);
        this.treeish = treeish || 'HEAD';
    },

    getInitialCheckoutCmd: function(repo, dest) {
        return UTIL.format('svn co -q -r %s %s %s', this.treeish, repo, dest);
    },

    getUpdateCmd: function(repo, dest) {
        return UTIL.format('svn up -q -r %s %s', this.treeish, dest);
    }

});

function joinUrlPath(url, part) {
    var p = URL.parse(url);
    p.pathname = PATH.join(p.pathname, part);
    return URL.format(p);
}
