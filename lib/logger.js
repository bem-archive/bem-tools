var W = require('WINSTON'),
    UTIL = require('util'),
    BEMUTIL = require('./util');

for(var i in W) exports[i] = W[i];

init();

exports.setLevel = function(level) {
    return init(level);
}

/**
 * Adds tracing before and after executing specified function or specified object's methods
 *
 * @param {hash} options The object with properties:
 * object - pass object the methods of which you want to trace
 * func - pass function you want to trace (the method will return wrapper function in this case)
 * object of func must be specified
 * objectName - this value is used in the traces to identify what object method is being executed (optional)
 * whiteList - in case object was specified only methods in the whiteList will be wrapped (optional)
 * blackList - in case object was specified the methods in blackList hash won't be wrapped (optional)
 * @return {function} The wrapped function in case options.func was specified or nothing otherwise
 */
exports.trace = function(options) {

    return attach(
        options,
        function(f) {
            var err = new Error;
            Error.captureStackTrace(err, arguments.callee);
            exports.fsilly('>>> %s.%s', f.objectName || '?', f.functionName || '?');
        },

        function(f) {
            exports.fsilly('<<< %s.%s', f.objectName || '?', f.functionName || '?');
        }
    );
}

/**
 * @type {Function}
 * The same as trace but uses specified callbacks to do tracing
 *
 * @param {hash} options
 * @param {function} callbackBefore (optional)
 * @param {function} callbackAfter (optional)
 * @return {function} The wrapped function in case options.func was specified or nothing otherwise
 */
var attach = exports.attach = function(options, callbackBefore, callbackAfter) {
    if (options.object) {
        var c = options.object.prototype;
        if (!c) return;

        Object.keys(c)
            .filter(function(prop) {

                if (typeof c[prop] === 'function') {
                    if (options.whiteList) return options.whiteList[prop];

                    if (options.blackList) return !options.blackList[prop];

                    return true;
                }

                return false;
            })
            .map(function(f) {
                c[f] = wrapFunction(
                    {
                        objectName: options.objectName,
                        functionName: f,
                        func: c[f],
                        object: options.object
                    },
                    callbackBefore,
                    callbackAfter);
            });

    } else if (options.func) {
        return wrapFunction(options.func, callbackBefore, callbackAfter);
    }
}

function wrapFunction(options, callbackBefore, callbackAfter) {
    var f = (typeof options === 'function')? otions: options.func;

    return function() {
        callbackBefore && callbackBefore(options);
        var res = f.apply(this, arguments);
        callbackAfter && callbackAfter(options);

        return res;
    }
}

function init(level) {
    W.remove(W.transports.Console);
    W.add(W.transports.Console,
        {
            timestamp: function() {
                var d = new Date();

                return UTIL.format(
                    '%s:%s:%s.%s',
                    BEMUTIL.pad(d.getHours(), 2, '0'),
                    BEMUTIL.pad(d.getMinutes(), 2, '0'),
                    BEMUTIL.pad(d.getSeconds(), 2, '0'),
                    BEMUTIL.pad(d.getMilliseconds(), 3, '0'));
            },
            colorize: true,
            level: level
        });

    W.setLevels({
            silly: 0,
            debug: 1,
            verbose: 2,
            info: 3,
            warn: 4,
            error: 5
        });

    Object.keys(W.levels).forEach(function (level) {
        exports[level] = W[level];
        exports['f' + level] = function (msg) {
            var m = UTIL.format.apply(this, arguments);
            W[level](m);
        };
    });
}
