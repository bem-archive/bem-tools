#!/usr/bin/env node

'use strict';

var QFS = require('q-fs'),
    file = 'npm-shrinkwrap.json';

QFS.read(file)
    .then(function(json) {
        var obj = JSON.parse(json.toString('utf-8'));
        obj = removeResolvedKey(obj);
        return QFS.write(file, JSON.stringify(obj, null, 2) + '\n');
    })
    .done();

function removeResolvedKey(obj) {

    Object.keys(obj)
        .forEach(function(key) {
            if (key === 'resolved') delete obj[key];
            if (key === 'dependencies') {
                Object.keys(obj[key])
                    .forEach(function(pkg) {
                        obj[key][pkg] = removeResolvedKey(obj[key][pkg]);
                    });
            }
        });

    return obj;

}
