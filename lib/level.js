var PATH = require('./path'),
    INHERIT = require('inherit'),
    createTech = require('./tech').createTech,
    bemUtil = require('./util'),
    isRequireable = bemUtil.isRequireable,
    isRequireError = bemUtil.isRequireError,

    getLevelClass = function(path) {
        var level = requireLevel(path);
        if(level.Level) return level.Level;
        return INHERIT(level.baseLevelPath? getLevelClass(level.baseLevelPath) : Level, level);
    },

    requireLevel = function(path) {
        try {
            var level = bemUtil.requireWrapper(require)(PATH.resolve(path), true);
        } catch (e) {
            if(!isRequireError(e)) throw e;
        }
        return level || {};
    };

/**
 * Create level object from path on filesystem.
 *
 * @param {String} path  Path to level directory.
 * @return {Level}  Level object.
 */
exports.createLevel = function(path) {
    // NOTE: в директории .bem внутри уровня переопределения
    // лежит модуль-конфиг для уровня переопределения
    return new (getLevelClass(PATH.join(PATH.absolute(path), '.bem', 'level.js')))(path);
};

var Level = exports.Level = INHERIT(/** @lends Level.prototype */{

    /**
     * Construct an instance of Level.
     *
     * @class Level base class.
     * @constructs
     * @param {String} path  Level directory path.
     */
    __constructor: function(path) {
        this.dir = PATH.absolute(path);
        // NOTE: keep this.path for backwards compatability
        this.path = this.bemDir = PATH.join(this.dir, '.bem');

        // NOTE: tech modules cache
        this._techsCache = {};
    },

    /**
     * Place to store uncommon level configurations
     *
     * @return {Object}
     */
    getConfig: function() {
        return {};
    },

    /**
     * Tech module definitions for level
     *
     * @return {Object} Tech module definitions
     */
    getTechs: function() {
        // NOTE: this.techs if for backwards compatability with legacy level configs
        return this.techs || {};
    },

    /**
     * Get tech object from its name and optional path to tech module.
     *
     * Object will be created and stored in cache. All following calls
     * to getTech() with same name will return the same object.
     *
     * Is you need unique object every time, use createTech() method
     * with same signature.
     *
     * @param {String} name  Tech name
     * @param {String} [path]  Path to tech module
     * @return {Tech}
     */
    getTech: function(name, path) {
        if(!this._techsCache.hasOwnProperty(name)) {
            this._techsCache[name] = this.createTech(name, path || name);
        }
        return this._techsCache[name];
    },

    /**
     * Create tech object from its name and optional path to tech module.
     *
     * @param {String} name  Tech name
     * @param {String} [path]  Path to tech module
     * @return {Tech}
     */
    createTech: function(name, path) {
        return createTech(this.resolveTech(path || name), name);
    },

    /**
     * Resolve tech identifier into tech module path.
     *
     * @param {String} techIdent  Tech identifier.
     * @param {Boolean} force  Flag to not use tech name resolution.
     * @return {String}  Tech module path.
     */
    resolveTech: function(techIdent, force) {
        if(bemUtil.isPath(techIdent)) {
            return this.resolveTechPath(techIdent);
        }
        if(!force && this.getTechs().hasOwnProperty(techIdent)) {
            return this.resolveTechName(techIdent);
        }
        return bemUtil.getBemTechPath(techIdent);
    },

    /**
     * Resolve tech name into tech module path.
     *
     * @param {String} techName  Tech name.
     * @return {String}  Tech module path.
     */
    resolveTechName: function(techName) {
        var p = this.getTechs()[techName];
        return typeof p !== 'undefined'? this.resolveTech(p, true) : null;
    },

    /**
     * Resolve tech module path.
     *
     * @throws {Error}  In case when tech module is not found.
     * @param {String} techPath  Tech path (relative or absolute).
     * @return {String}  Tech module path.
     */
    resolveTechPath: function(techPath) {
        // Get absolute path if path starts with "."
        // NOTE: Can not replace check to !isAbsolute()
        if(techPath.substring(0, 1) === '.') {
            // Resolve relative path starting at level `.bem/` directory
            techPath = PATH.join(this.bemDir, techPath);
            if(!isRequireable(techPath)) {
                throw new Error("Tech module on path '" + techPath + "' not found");
            }
            return techPath;
        }

        // Trying absolute of relative-withot-dot path
        if(isRequireable(techPath)) {
            return techPath;
        }

        throw new Error("Tech module with path '" + techPath + "' not found on require search paths");
    },

    /**
     * Get list of default techs to create with `bem create {block,elem,mod}`
     * commands.
     *
     * Returns all declared techs in `defaultTechs` property or keys of result
     * of `getTech()` method if `defaultTechs` is undefined.
     *
     * @return {String[]}  Array of tech names.
     */
    getDefaultTechs: function() {
        return this.defaultTechs || Object.keys(this.getTechs());
    },

    /**
     * Resolve relative paths using level config directory `.bem/`
     * as a base for them.
     *
     * Absolute paths (and keys of object) will be left untouched.
     * Returns new Array of strings or Object.
     *
     * @param {Object|String[]} paths  Paths to resolve.
     * @return {Object|String[]}  Resolved paths.
     */
    resolvePaths: function(paths) {

        // resolve array of paths
        if (Array.isArray(paths)) {
            return paths.map(function(path) {
                return this.resolvePath(path);
            }, this);
        }

        // resolve paths in object values
        var resolved = {};
        Object.keys(paths).forEach(function(key) {
            resolved[key] = this.resolvePath(paths[key]);
        }, this);

        return resolved;

    },

    /**
     * Resolve relative path using level config directory `.bem/`
     * as a base.
     *
     * Absolute path will be left untouched.
     *
     * @param {String} path  Path to resolve.
     * @return {String}  Resolved path.
     */
    resolvePath: function(path) {
        return PATH.resolve(this.path, path);
    },

    /**
     * Construct path to tech file / directory from
     * prefix and tech name.
     *
     * @param {String} prefix  Path prefix.
     * @param {String} tech  Tech name.
     * @return {String}  Absolute path.
     */
    getPath: function(prefix, tech) {
        return this.getTech(tech).getPath(prefix);
    },

    /**
     * Construct absolute path to tech file / directory from
     * BEM entity object and tech name.
     *
     * @param {Object} item  BEM entity object.
     * @param {String} item.block  Block name.
     * @param {String} item.elem   Element name.
     * @param {String} item.mod    Modifier name.
     * @param {String} item.val    Modifier value.
     * @param {String} tech  Tech name.
     * @return {String}  Absolute path.
     */
    getPathByObj: function(item, tech) {
        return PATH.join(this.dir, this.getRelPathByObj(item, tech));
    },

    /**
     * Construct relative path to tech file / directory from
     * BEM entity object and tech name.
     *
     * @param {Object} item  BEM entity object.
     * @param {String} item.block  Block name.
     * @param {String} item.elem   Element name.
     * @param {String} item.mod    Modifier name.
     * @param {String} item.val    Modifier value.
     * @param {String} tech  Tech name.
     * @return {String}  Relative path.
     */
    getRelPathByObj: function(item, tech) {
        return this.getPath(this.getRelByObj(item), tech);
    },

    /**
     * Get absolute path prefix on the filesystem to specified
     * BEM entity described as an object with special properties.
     *
     * @param {Object} item  BEM entity object.
     * @param {String} item.block  Block name.
     * @param {String} item.elem   Element name.
     * @param {String} item.mod    Modifier name.
     * @param {String} item.val    Modifier value.
     * @return {String}  Absolute path prefix.
     */
    getByObj: function(item) {
        return PATH.join(this.dir, this.getRelByObj(item));
    },

    /**
     * Get relative to level directory path prefix on the filesystem
     * to specified BEM entity described as an object with special
     * properties.
     *
     * @param {Object} item  BEM entity object.
     * @param {String} item.block  Block name.
     * @param {String} item.elem   Element name.
     * @param {String} item.mod    Modifier name.
     * @param {String} item.val    Modifier value.
     * @return {String}  Relative path prefix.
     */
    getRelByObj: function(item) {
        var getter, args;
        if (item.block) {
            getter = 'block';
            args = [item.block];
            if (item.elem) {
                getter = 'elem';
                args.push(item.elem);
            }
            if (item.mod) {
                getter += '-mod';
                args.push(item.mod);
                if (item.val) {
                    getter += '-val';
                    args.push(item.val);
                }
            }
            return this.getRel(getter, args);
        }
        return '';
    },

    /**
     * Get absolute path prefix on the filesystem to specified
     * BEM entity described as a pair of entity type and array.
     *
     * @param {String} what  BEM entity type.
     * @param {String[]} args  Array of BEM entity meta.
     * @return {String}
     */
    get: function(what, args) {
        return PATH.join(this.dir, this.getRel(what, args));
    },

    /**
     * Get relative to level directory path prefix on the
     * filesystem to specified BEM entity described as a pair
     * of entity type and array.
     *
     * @param what
     * @param args
     * @return {String}
     */
    getRel: function(what, args) {
        return this['get-' + what].apply(this, args);
    },

    /**
     * Get relative path prefix for block.
     *
     * @param {String} block  Block name.
     * @return {String}  Path prefix.
     */
    'get-block': function(block) {
        return PATH.join.apply(null, [block, block]);
    },

    /**
     * Get relative path prefix for block modifier.
     *
     * @param {String} block  Block name.
     * @param {String} mod  Modifier name.
     * @return {String}  Path prefix.
     */
    'get-block-mod': function(block, mod) {
        return PATH.join.apply(null,
            [block,
            '_' + mod,
            block + '_' + mod]);
    },

    /**
     * Get relative path prefix for block modifier-with-value.
     *
     * @param {String} block  Block name.
     * @param {String} mod  Modifier name.
     * @param {String} val  Modifier value.
     * @return {String}  Path prefix.
     */
    'get-block-mod-val': function(block, mod, val) {
        return PATH.join.apply(null,
            [block,
            '_' + mod,
            block + '_' + mod + '_' + val]);
    },

    /**
     * Get relative path prefix for elem.
     *
     * @param {String} block  Block name.
     * @param {String} elem  Element name.
     * @return {String}  Path prefix.
     */
    'get-elem': function(block, elem) {
        return PATH.join.apply(null,
            [block,
            '__' + elem,
            block + '__' + elem]);
    },

    /**
     * Get relative path prefix for element modifier.
     *
     * @param {String} block  Block name.
     * @param {String} elem  Element name.
     * @param {String} mod  Modifier name.
     * @return {String}  Path prefix.
     */
    'get-elem-mod': function(block, elem, mod) {
        return PATH.join.apply(null,
            [block,
            '__' + elem,
            '_' + mod,
            block + '__' + elem + '_' + mod]);
    },

    /**
     * Get relative path prefix for element modifier-with-value.
     *
     * @param {String} block  Block name.
     * @param {String} elem  Element name.
     * @param {String} mod  Modifier name.
     * @param {String} val  Modifier value.
     * @return {String}  Path prefix.
     */
    'get-elem-mod-val': function(block, elem, mod, val) {
        return PATH.join.apply(null,
            [block,
            '__' + elem,
            '_' + mod,
            block + '__' + elem + '_' + mod + '_' + val]);
    },

    /**
     * Get regexp string to match parts of path that represent
     * BEM entity on filesystem.
     *
     * @return {String}
     */
    matchRe: function() {
        return '[^_.' + PATH.dirSepRe + ']+';
    },

    /**
     * Get order of matchers to apply during introspection.
     *
     * @return {String[]}  Array of matchers names.
     */
    matchOrder: function() {
        return ['elem-mod-val', 'elem-mod', 'block-mod-val',
            'block-mod', 'elem', 'block'];
    },

    /**
     * Get order of techs to match during introspection.
     *
     * @return {String[]}  Array of techs names.
     */
    matchTechsOrder: function() {
        return Object.keys(this.getTechs());
    },

    /**
     * Match path against all mathers and return first match.
     *
     * Match object will contain `block`, `suffix` and `tech` fields
     * and can also contain any of the `elem`, `mod` and `val` fields
     * or all of them.
     *
     * @param {String} path  Path to match (absolute or relative).
     * @return {Boolean|Object}  BEM entity object in case of positive match and false otherwise.
     */
    matchAny: function(path) {
        if (PATH.isAbsolute(path)) path = PATH.relative(this.bemDir, path);

        var matchTechs = this.matchTechsOrder().map(function(t) {
                return this.getTech(t);
            }, this);

        return this.matchOrder().reduce(function(match, matcher) {

            // Skip if already matched
            if (match) return match;

            // Try matcher
            match = this.match(matcher, path);

            // Skip if not matched
            if (!match) return false;

            // Try to match for tech
            match.tech = matchTechs.reduce(function(tech, t) {
                if (tech || !t.matchSuffix(match.suffix)) return tech;
                return t.getTechName();
            }, match.tech);

            return match;

        }.bind(this), false);
    },

    /**
     * Match ralative path against specified matcher.
     *
     * Match object will contain `block` and `suffix` fields and
     * can also contain any of the `elem`, `mod` and `val` fields
     * or all of them.
     *
     * @param {String} what  Matcher to match against.
     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM entity object in case of positive match and false otherwise.
     */
    match: function(what, path) {
        return this['match-' + what].call(this, path);
    },

    /**
     * Match if specified path represents block entity.
     *
     * Match object will contain `block` and `suffix` fields.

     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM block object in case of positive match and false otherwise.
     */
    'match-block': function(path) {
        var match = new RegExp(['^(' + this.matchRe() + ')',
            '\\1(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            suffix: match[2]
        };
    },

    /**
     * Match if specified path represents block modifier entity.
     *
     * Match object will contain `block`, `mod` and `suffix` fields.
     *
     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM block modifier object in case of positive match and false otherwise.
     */
    'match-block-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '_(' + m + ')',
            '\\1_\\2(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[2],
            suffix: match[3]
        };
    },

    /**
     * Match if specified path represents block modifier-with-value entity.
     *
     * Match object will contain `block`, `mod`, `val` and `suffix` fields.
     *
     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM block modifier-with-value object in case of positive match and false otherwise.
     */
    'match-block-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '_(' + m + ')',
            '\\1_\\2_(' + m + ')(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            mod: match[2],
            val: match[3],
            suffix: match[4]
        };
    },

    /**
     * Match if specified path represents element entity.
     *
     * Match object will contain `block`, `elem` and `suffix` fields.
     *
     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM element object in case of positive match and false otherwise.
     */
    'match-elem': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '__(' + m + ')',
            '\\1__\\2(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            suffix: match[3]
        };
    },

    /**
     * Match if specified path represents element modifier entity.
     *
     * Match object will contain `block`, `elem`, `mod` and `suffix` fields.
     *
     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM element modifier object in case of positive match and false otherwise.
     */
    'match-elem-mod': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '__(' + m + ')',
            '_(' + m + ')',
            '\\1__\\2_\\3(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            mod: match[3],
            suffix: match[4]
        };
    },

    /**
     * Match if specified path represents element modifier-with-value entity.
     *
     * Match object will contain `block`, `elem`, `mod`, `val` and `suffix` fields.
     *
     * @param {String} path  Path to match.
     * @return {Boolean|Object}  BEM element modifier-with-value object in case of positive match and false otherwise.
     */
    'match-elem-mod-val': function(path) {
        var m = this.matchRe(),
            match = new RegExp(['^(' + m + ')',
            '__(' + m + ')',
            '_(' + m + ')',
            '\\1__\\2_\\3_(' + m + ')(.*?)$'].join(PATH.dirSepRe)).exec(path);
        if (!match) return false;
        return {
            block: match[1],
            elem: match[2],
            mod: match[3],
            val: match[4],
            suffix: match[5]
        };
    },

    /**
     * Get declaration for block.
     *
     * @param {String} blockName  Block name to get declaration for.
     * @return {Object}  Block declaration object.
     */
    getBlockByIntrospection: function(blockName) {
        // TODO: support any custom naming scheme, e.g. flat, when there are
        // no directories for blocks
        var decl = this.getDeclByIntrospection(PATH.dirname(this.get('block', [blockName])));
        return decl.length? decl.shift() : {};
    },

    /**
     * Get declaration of level directory or one of its subdirectories.
     *
     * @param {String} from  Relative path to subdirectory of level directory.
     * @return {Array}  Array of declaration.
     */
    getDeclByIntrospection: function(from) {
        from = PATH.resolve(this.dir, from || '.');
        var decl = [];

        bemUtil.fsWalkTree(from, function(f) {
            var match = this.matchAny(PATH.relative(this.bemDir, f));
            if(match && match.tech) {
                decl = this._mergeMatchToDecl(match, decl);
            }
        }, function(f) {
            return !this.isIgnorablePath(f);
        }, this);

        return decl;
    },

    /**
     * Check path if it must be ignored during introspection.
     *
     * @param {String} path  Path to check.
     * @return {Boolean}  True if path must be ignored.
     */
    isIgnorablePath: function(path) {
        return /\.svn$/.test(path);
    },

    _mergeMatchToDecl: function(match, decl) {
        var blocks, elems, mods, vals,
            techAdded = false,
            addTech = function(o) {
                if(!techAdded && match.tech) {
                    o.techs = [{ name: match.tech }];
                    techAdded = true;
                }
                return o;
            };

        match.val &&
            (vals = [addTech({name: match.val})]);
        match.mod && match.val &&
            (mods = [addTech({name: match.mod, vals: vals})]);
        match.mod && !match.val &&
            (mods = [addTech({name: match.mod})]);
        match.elem &&
            (elems = [addTech({name: match.elem, mods: mods})]) &&
            (blocks = [addTech({name: match.block, elems: elems})]);
        !match.elem &&
            (blocks = [addTech({name: match.block, mods: mods})]);

        return bemUtil.mergeDecls(decl, blocks);
    }

});
