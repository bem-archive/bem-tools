
var TechV1 = exports.Tech = require('./v1').Tech,
    TechV2 = exports.TechV2 = require('./v2').Tech,
    INHERIT = require('inherit'),

    /**
     * Return tech class for the tech module path.
     *
     * @param {String|Object} module  Path to tech module or module object.
     * @param {Level} [level]  Level object to resolve techs by name.
     * @returns {Tech}  Tech class.
     */
    getTechClass = exports.getTechClass = function(module, level) {

        var tech = typeof module === 'string'? require(module) : module,
            TechClass = tech.API_VER?TechV2: TechV1;

        // link to tech class found in Tech property
        if (tech.Tech) return tech.Tech;

        // path to base tech module found in baseTechPath property
        if (tech.baseTechPath) {
            TechClass = getTechClass(tech.baseTechPath, level);
        }

        // base tech name found in baseTechName property
        else if (tech.baseTechName) {
            if (!level) throw new Error('getTechClass(): level argument must be specified to resolve techs by name');
            TechClass = getTechClass(level.resolveTech(tech.baseTechName), level);
        }

        // link to base tech class found in baseTech property
        else if (tech.baseTech) {
            TechClass = tech.baseTech;
        }

        // legacy tech module detected, should use LegacyTech shim
        else if (tech.techModule || tech.bemBuild || tech.bemCreate) {
            return LegacyTech;
        }

        return INHERIT(TechClass, tech.techMixin || tech);

    },

    /**
     * Create tech object for tech module, identified by path and name.
     * @param {String} path  Tech module absolute path.
     * @param {String} name  Tech name.
     * @param {Level} [level]  Level object to resolve techs by name.
     * @returns {Tech}  Tech instance object.
     */
    createTech = exports.createTech = function(path, name, level) {
        path = require.resolve(path);
        return new (getTechClass(path, level))(name, path);
    },


    LegacyTech = INHERIT(TechV1, /** @lends LegacyTech.prototype */{
        /**
         * @class Legacy tech modules wrapper class.
         * @constructs
         * @private
         * @param {String} name  Tech name.
         * @param {String} path  Tech module absolute path.
         */
        __constructor: function(name, path) {
            this.techObj = new (require('./../legacy-tech').Tech)(path, name);
            this.__base(name, path);
        },

        /**
         * Set context to use in tech module.
         *
         * @public
         * @param {Context} ctx  Context instance object.
         * @returns {LegacyTech}  Chainable API
         */
        setContext: function(ctx) {
            this.techObj.setContext(ctx);
            return this;
        },

        getContext: function() {
            return this.techObj.getContext();
        },

        create: function(prefix, vars, force) {
            return this.techObj.bemCreate(prefix, vars, force);
        },

        readAllContent: function(prefix) {
            var res = {};
            res[this.getTechName()] = this.techObj.getFileContent(prefix);
            return res;
        },

        build: function(prefixes, outputDir, outputName) {

            var _this = this,
                ctx = this.getContext();

            // wait for declaration to load
            return Q.when(ctx.opts.declaration, function(decl) {

                ctx.opts.declaration = decl;

                return Q.when(prefixes, function(prefixes) {
                    return _this.techObj.bemBuild(prefixes, outputDir, outputName);
                });

            });

        },

        getBuildResultChunk: function(relPath, path, outputDir, outputName) {
            return this.techObj.outFile.apply(this.techObj, arguments);
        },

        getTechName: function() {
            return this.techObj.getTechName();
        }

    });

