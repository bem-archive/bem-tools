'use strict';

var Q = require('q'),
    QFS = require('q-fs'),
    SV = require('semver'),
    PATH = require('../path'),
    L = require('../logger'),
    U = require('../util');

module.exports = function() {

    return this
        .title('Version helper.')
        .helpful()
        .opt()
            .name('merge')
            .long('merge')
            .flag()
            .end()
        .opt()
            .name('mergeInto')
            .long('merge-into')
            .end()
        .arg()
            .name('version')
            .title('Specific version (see http://semver.org) or major, minor, patch or prerelease keywords')
            .end()
        .act(function(opts, args) {

            return readFiles()
                .spread(function(pkg, bower) {

                    pkg = pkg.value;
                    bower = bower.value;

                    var data = pkg || bower;
                    if (!data) {
                        return Q.reject('No package.json or bower.json found');
                    }

                    if (!args.version) {

                        if (pkg && bower && pkg.version !== bower.version) {
                            L.warn('package.json and bower.json package versions do not match');
                        }

                        return getVersions(data);
                    }

                    var ver = args.version,
                        newVer = SV.valid(ver) || SV.inc(data.version, ver);

                    if (data.version === newVer || !newVer) {
                        return Q.reject('Version not changed');
                    }

                    // check if current dir is a git repo
                    return QFS.isDirectory(PATH.join(process.cwd(), '.git'))
                        .then(function(isGit) {
                            // write .json files and commit them
                            if (isGit) {
                                return doGit(newVer, pkg, bower);
                            }

                            // just write .json files if we are not in git repo
                            return writeFiles(newVer, pkg, bower);
                        })
                        .then(function() {
                            return 'v' + newVer;
                        });

                });


        });

};

function doGit(ver, pkg, bower) {
    var git = process.env.GIT || 'git',
        args = ['status', '--porcelain'],
        opts = { env: process.env },
        tag = 'v' + ver;

    return U.which(git)
        .fail(function() {
            return Q.reject('git executable not found in PATH: ' + git);
        })
        .then(function(git) {

            // check if working copy is clean
            return U.execFile(git, args, opts, true)
                .then(function(out) {

                    var lines = out.trim().split('\n')
                        .filter(function(line) {
                            return line.trim() && !line.match(/^\?\? /);
                        })
                        .map(function(line) {
                            return line.trim();
                        });

                    if (lines.length) {
                        return Q.reject('Git working directory not clean.\n' + lines.join('\n'));
                    }

                })
                .then(function() {
                    // write .json files
                    return writeFiles(ver, pkg, bower);
                })
                .then(function() {
                    // stage .json files
                    var pathsToCommit = [];
                    if (pkg) pathsToCommit.push(getJsonPath('package.json'));
                    if (bower) pathsToCommit.push(getJsonPath('bower.json'));

                    return U.execFile(git, ['add'].concat(pathsToCommit), opts);
                })
                .then(function() {
                    return U.execFile(git, ['commit', '-m', tag], opts);
                })
                .then(function() {
                    return U.execFile(git, ['tag', tag], opts);
                });

        });
}

function getJsonPath(name) {
    return PATH.join(process.cwd(), name);
}

function writeFiles(ver, pkg, bower) {

    var writes = [];
    if (pkg) {
        pkg.version = ver;
        writes.push(writeJson(getJsonPath('package.json'), pkg));
    }
    if (bower) {
        bower.version = ver;
        writes.push(writeJson(getJsonPath('package.json'), bower));
    }

    return Q.all(writes)
        .thenResolve();

}

function readFiles() {
    return Q.allSettled([
        readJson(getJsonPath('package.json')),
        readJson(getJsonPath('bower.json'))
    ]);
}

function readJson(path) {

    return U.readFile(path)
        .fail(function() {
            return Q.reject('No ' + path + ' found');
        })
        .then(function(data) {
            return Q.fcall(JSON.parse, data)
                .fail(function() {
                    return Q.reject('Bad ' + path + ' data');
                });
        });

}

function writeJson(path, data) {
    return U.writeFile(path, JSON.stringify(data, null, 2) + '\n');
}

function getVersions(data) {

    var v = {
            toString: function() {
                return JSON.stringify(this, null, 2);
            }
        };

    Object.keys(process.versions)
        .forEach(function(k) {
            v[k] = process.versions[k];
        });

    if (data && data.name && data.version) {
        v[data.name] = data.version;
    }
    return v;

}
