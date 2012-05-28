var Q = require('q'),
    INHERIT = require('inherit'),
    UTIL = require('util'),
    LOGGER = require('../logger');

exports.Node = INHERIT({

    buildMessageVerbosity: 'info',

    __constructor: function(id) {
        this.id = id;
    },

    getId: function() {
        return this.id;
    },

    run: function(ctx) {
        var _this = this,
            method = ctx.method || 'make';

        this.clearLog();

        if (this.buildMessageVerbosity === 'info') {
            LOGGER.time('[t] Build time for "%s" [%s]', this.getId(), ctx.plan.getId());
        }

        return Q.when(this.isValid(ctx), function(valid) {
            LOGGER.fverbose("[?] Node '%s' is %s [%s]", _this.getId(), valid? 'valid' : 'expired', ctx.plan.getId());
            if (valid && !ctx.force) return;

            LOGGER.flog(_this.buildMessageVerbosity, "[*] %s '%s' [%s]", method, _this.getId(), ctx.plan.getId());
            _this.log("[=] Log of %s '%s' [%s]", method, _this.getId(), ctx.plan.getId());
            return Q.invoke(_this, method, ctx).then(function(res) {
                _this.dumpLog();

                if (_this.buildMessageVerbosity === 'info') {
                    LOGGER.timeEnd('[t] Build time for "%s" [%s]', _this.getId(), ctx.plan.getId());
                }

                return res;
            });
        });
    },

    make: function(ctx) {},

    clean: function(ctx) {},

    isValid: function(ctx) {
        return false;
    },

    log: function(messages) {
        messages = Array.isArray(messages)? messages : [messages];
        var args = Array.prototype.slice.call(arguments, 1);
        this.messages = (this.messages || []).concat(messages.map(function(message) {
            return UTIL.format.apply(this, [message].concat(args));
        }));
    },

    clearLog: function() {
        delete this.messages;
    },

    formatLog: function() {
        return (this.messages || []).join('\n');
    },

    dumpLog: function() {
        LOGGER.verbose(this.formatLog());
    }

});
