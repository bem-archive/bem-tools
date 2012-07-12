var Q = require('q'),
    INHERIT = require('inherit'),
    UTIL = require('util'),
    LOGGER = require('../logger');

exports.Node = INHERIT(/** @lends Node.prototype */ {

    /**
     * Verbosity of node log messages.
     * @type {String}
     */
    buildMessageVerbosity: 'info',

    /**
     * Node instance constructor.
     *
     * @class Node base class.
     * @constructs
     * @param {Object} o  Node options.
     */
    __constructor: function(o) {
        this.id = this.__self.createId(o);
    },

    /**
     * Get node id.
     *
     * @return {String}
     */
    getId: function() {
        return this.id;
    },

    /**
     * Generic implementation of node run() method.
     *
     * @return {Promise * Undefined}
     */
    run: function() {
        var _this = this,
            ctx = this.ctx,
            method = ctx.method || 'make';

        this.clearLog();

        if (this.buildMessageVerbosity === 'info') {
            LOGGER.time('[t] Build time for "%s" [%s]', this.getId(), ctx.plan.getId());
            LOGGER.time('[t] isValid() time for "%s" [%s]', this.getId(), ctx.plan.getId());
        }

        return Q.when(this.isValid(), function(valid) {
            LOGGER.fverbose("[?] Node '%s' is %s [%s]", _this.getId(), valid? 'valid' : 'expired', ctx.plan.getId());
            if (_this.buildMessageVerbosity === 'info') {
                LOGGER.timeEnd('[t] isValid() time for "%s" [%s]', _this.getId(), ctx.plan.getId());
            }
            if (valid && !ctx.force) return;

            LOGGER.flog(_this.buildMessageVerbosity, "[*] %s '%s' [%s]", method, _this.getId(), ctx.plan.getId());
            _this.log("[=] Log of %s '%s' [%s]", method, _this.getId(), ctx.plan.getId());
            return Q.invoke(_this, method).fin(function(res) {
                _this.dumpLog();

                if (_this.buildMessageVerbosity === 'info') {
                    LOGGER.timeEnd('[t] Build time for "%s" [%s]', _this.getId(), ctx.plan.getId());
                }
            });
        });
    },

    /**
     * make() method stub.
     */
    make: function() {
        return Q.resolve();
    },

    /**
     * clean() method stub.
     */
    clean: function() {
        return Q.resolve();
    },

    /**
     * isValid() method default implementation thay always returns promised false.
     *
     * @returns {Promise * Boolean}
     */
    isValid: function() {
        return Q.resolve(false);
    },

    /**
     * Store message into node messages container.
     *
     * @param {String[]|String} messages  Message or array of messages to log.
     */
    log: function(messages) {
        messages = Array.isArray(messages)? messages : [messages];
        var args = Array.prototype.slice.call(arguments, 1);
        this.messages = (this.messages || []).concat(messages.map(function(message) {
            return UTIL.format.apply(this, [message].concat(args));
        }));
    },

    /**
     * Clear node messages container.
     */
    clearLog: function() {
        delete this.messages;
    },

    /**
     * Return messages from node container as a single string.
     *
     * @return {String}
     */
    formatLog: function() {
        return (this.messages || []).join('\n');
    },

    /**
     * Dump all messages from node container to logger.
     */
    dumpLog: function() {
        LOGGER.verbose(this.formatLog());
    },

    /**
     * Get node dependencies.
     *
     * @returns {String[]|Object}
     */
    getDependencies: function() {
        return [];
    }

}, /** @lends Node */ {

    /**
     * Create node id.
     *
     * @param {Object} o  Node options.
     * @return {String}   Node id.
     */
    createId: function(o) {
        return o;
    }

});
