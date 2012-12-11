var Q = require('q'),
    QFS = require('q-fs'),
    UTIL = require('util'),
    U = require('../util');

module.exports = function() {

    return this
        .title('BEM entities move and rename tool.')
        .helpful()
        .apply(U.chdirOptParse)
        .opt()
            .name('sourceLevel')
            .title('source level')
            .short('s').long('src')
            .apply(U.applyLevelOpt('source level'))
            .end()
        .opt()
            .name('targetLevel')
            .title('target level')
            .short('t').long('target')
            .apply(U.applyLevelOpt('destination level'))
            .end()
        .opt()
            .name('cherryPick')
            .title('cherry pick spicified entity only, without its contents')
            .short('c').long('cherry-pick')
            .flag()
            .end()
        .opt()
            .name('dryRun')
            .title('do not move anything, just output to the console')
            .long('dry-run')
            .flag()
            .end()
        .opt()
            .name('force')
            .title('force')
            .short('f').long('force')
            .flag()
            .end()
        .arg()
            .name('source')
            .title('Source BEM entity in the form of block__elem_mod_val.js')
            .val(bemParse)
            .req()
            .end()
        .arg()
            .name('target')
            .title('Target BEM entity')
            .val(bemParse)
            .end()
        .act(function(opts, args) {

            var strict = opts.cherryPick,
                force = opts.force,
                source = args.source,
                target = args.target || source,
                sourceLevel = opts.sourceLevel,
                targetLevel = opts.targetLevel,
                items = getItems(sourceLevel, source, strict);

            if (!source.block) {
                return Q.reject('bem mv: You should specify full BEM entity to move');
            }

            if (target.techs && target.techs.join(',') !== source.techs.join(',')) {
                // FIXME: Support changing tech of the BEM entity
                return Q.reject('bem mv: Changing tech of the BEM entity in not yet implemented');
            }

            if (U.bemKey(source) === U.bemKey(target) && sourceLevel.dir === targetLevel.dir) {
                return Q.reject(UTIL.format("bem mv: Could not move '%s' to self", U.bemKey(source)));
            }

            if (U.bemType(source) === U.bemType(target)) {

                // CASE: Rename BEM entity in the context of the same level
                // CASE: Move BEM entity to another level
                // CASE: Move BEM entity to another level with name change

                items = items.map(
                    function(source) {
                        return {
                            source: source,
                            target: U.extend({}, source, target)
                        }
                    });

            } else {

                // CASE: Refactor BEM entity in the context of the same level
                // CASE: Move BEM entity to another level with refactor
                // FIXME: Support changing of BEM entity type
                return Q.reject('bem mv: Changing of BEM entity type is not yet implemented');

            }

            // Map BEM source and target BEM entities to paths
            var paths = items.map(function(item) {

                return {
                    source: getPath(sourceLevel, item.source),
                    target: getPath(targetLevel, item.target)
                }

            });

            return checkExists(paths, force)
                .then(function(exists) {

                    if (opts.dryRun) return dryRun(paths);

                    // Move
                    return Q.all(
                        paths.map(function(p) {
                            return copy(p.source, p.target);
                        }))
                        .get(0);

                });

        });

};

function getItems(level, item, strict) {

    return level.getItemsByIntrospection()
        .filter(getBemEntityFilter(item, strict));

}

function checkExists(paths, force) {

    // Collect existent target paths
    var exists = U.filterPaths(
        paths.map(function(p) {
            return p.target;
        }));

    return exists.then(function(exists) {

        // Do not move if there are existent target paths and --force in not specified
        if (!force && exists.length) {
            return Q.reject('bem mv: Following target paths are exist, run with ' +
                '--force to overwrite:\n' + exists.join('\n'));
        }

        return exists;

    });

}

function dryRun(paths) {

    return paths
        .map(function(p) {
            return UTIL.format('Moving %s to %s', p.source, p.target);
        })
        .join('\n');

}

function copy(source, target) {

    // FIXME: implement
    console.log('Moving %s to %s', source, target);

}

function getPath(level, item) {
    return level.getByObj(item) + item.suffix;
}

function getBemEntityFilter(filter, strict) {

    var keys = Object.keys(filter);

    return function(item) {

        var res = true;

        if (strict && U.bemKey(filter) !== U.bemKey(item)) {
            res = false;
        }

        for (var i = 0, key; res && i < keys.length; i++) {

            key = keys[i];

            if (key === 'techs') {
                // filter on techs
                if (!~filter.techs.indexOf(item.tech)) res = false;
            } else {
                // filter on other keys
                if (item[key] !== filter[key]) res = false;
            }

        }

        return res;

    }

}

function bemParse(key) {

    var item = U.bemParseKey(key);

    // Try to get techs specified using dot notation
    if (item.tech) {
        item.techs = item.tech.split(',');
        delete item.tech;
    }

    return item;

}
