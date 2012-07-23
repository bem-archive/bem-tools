var Color = require('coa/lib/color').Color,
    W = require('winston'),
    UTIL = require('util'),
    BEMUTIL = require('./util'),

    propertiesFilter = [
        '__self'
    ];

for(var i in W) exports[i] = W[i];

init();

/**
 * Sets the max logging level
 * @param level
 */
exports.setLevel = function(level) {
    init(level);
};

/**
 * Log formatted message
 *
 * @param {String} level
 * @param {String} message
 * @param {*} ...args
 */
exports.flog = function(level, message) {
    W[level](UTIL.format.apply(this, Array.prototype.slice.call(arguments, 1)));
};

var times = {};
exports.time = function(label) {
    label = UTIL.format.apply(UTIL, arguments);
    times[label] = Date.now();
};

exports.timeEnd = function(label) {
    label = UTIL.format.apply(UTIL, arguments);
    var duration = Date.now() - times[label];
    exports.flog('info', '%s: ' + Color('red', '%dms'), label, duration);
};

/**
 * Adds tracing before and after executing specified function or specified object's methods
 * @param {Object} options The object with properties:
 * @param {Function} options.object pass object the methods of which you want to trace
 * @param {Function} options.func pass function you want to trace (the method will return wrapper function in this case)
 * @param {String} [options.objectName] this value is used in the traces to identify what object method is being executed
 * @param {String[]} [options.whiteList] in case object was specified only methods in the whiteList will be wrapped
 * @param {String[]} [options.blackList] in case object was specified the methods in blackList hash won't be wrapped
 * @return {Function} The wrapped function in case options.func was specified or nothing otherwise
 */
var trace = exports.trace = function (options) {

    return attach(
        options,
        function(f) {
            exports.fsilly('>>> %s.%s', f.objectName || '?', f.functionName || '?');
        },

        function(f) {
            exports.fsilly('<<< %s.%s', f.objectName || '?', f.functionName || '?');
        }
    );
};

/**
 * The same as {@link trace} but uses specified callbacks to do tracing
 *
 * @param {Object} options
 * @param {Function} [callbackBefore]
 * @param {Function} [callbackAfter]
 * @return {Function} The wrapped function in case options.func was specified or nothing otherwise
 */
var attach = exports.attach = function(options, callbackBefore, callbackAfter) {
    if (options.object) {
        var c = options.object.prototype || options.object;
        if (!c) throw new Error('object has no prototype');

        Object.keys(c)
            .filter(function(prop) {
                if (typeof c[prop] === 'function' && propertiesFilter.indexOf(prop) === -1) {
                    if (options.whiteList) return (options.whiteList.indexOf(prop) !== -1);

                    if (options.blackList) return !(options.blackList.indexOf(prop) !== -1);

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
};

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
            W[level](UTIL.format.apply(this, arguments));
        };
    });
}
