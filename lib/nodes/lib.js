var Q = require('q'),
    INHERIT = require('inherit'),
    CP = require('child_process'),
    PATH = require('path'),
    UTIL = require('util'),

    Node = require('./node').Node;

exports.LibraryNode = INHERIT(Node, {

    __constructor: function(path, repo, treeish) {
        this.path = path;
        this.repo = repo;
        this.treeish = treeish || 'master';
        // TODO: path relative to the project root must be passed
        this.__base(PATH.basename(this.path));
    },

    make: function() {
        var _this = this,
            up = Q.defer(),
            cmd;

        if (PATH.existsSync(this.path)) {
            // git pull origin master
            cmd = UTIL.format('cd %s && git pull --progress origin master', this.path);
        } else {
            // git clone repo path
            cmd = UTIL.format('git clone --progress %s %s', this.repo, this.path);
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
            cmd = UTIL.format('cd %s && git checkout %s', _this.path, _this.treeish);

            _this.log(cmd);
            CP.exec(cmd, function(err, stdout, stderr) {
                stdout && _this.log(stdout);
                stderr && _this.log(stderr);

                err? co.reject(err) : co.resolve();
            });
            return co.promise;
        });
    }

});
