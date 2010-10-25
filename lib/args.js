
// -- kriskowal Kris Kowal Copyright (C) 2009-2010 MIT License
// -- tlrobinson Tom Robinson
// -- abhinav Abhinav Gupta

var fs = require('fs'),
    path = require('path');

exports.UsageError = function (message) {
    this.name = "UsageError";
    this.message = message;
};

exports.UsageError.prototype = Object.create(Error.prototype);

exports.ConfigurationError = function (message) {
    this.name = "ConfigurationError";
    this.message = message;
};

exports.ConfigurationError.prototype = Object.create(Error.prototype);

/**
 * Create a new command line argument parser.
 *
 * @constructor
 */
exports.Parser = function () {
    this._options = [];
    this._def = {};
    this._long = {};
    this._short = {};
    this._commands = {};
    this._args = [];
    this._vargs = undefined;
    this._interleaved = false;
};

/**
 * Add an option to the parser.
 *
 * Takes the same arguments as the {@link Option} constructor.
 *
 * @returns {Option} the new Option object
 */
exports.Parser.prototype.option = function () {
    var option = new this.Option(this, arguments);
    this._options.push(option);
    return option;
};

/**
 * Create a new group of options.
 *
 * @param {String} name     name of the group
 * @returns {Group}         {@link Group} object representing the group
 */
exports.Parser.prototype.group = function (name) {
    var group = new this.Group(this, this, name);
    this._options.push(group);
    return group;
};

/**
 * Set default values for the parser.
 *
 * @param {String} name     key in the result
 * @param          value    default value for the key
 * @returns {Parser}        this
 */
exports.Parser.prototype.def = function (name, value) {
    this._def[name] = value;
    return this;
};

/**
 * Reset the default values in the given hash.
 *
 * Normally, this won't be used externally.
 *
 * @param {Object} options  parser state
 */
exports.Parser.prototype.reset = function (options) {
    var self = this;
    for (var name in this._def) {
        if (this._def.hasOwnProperty(name) && !options.hasOwnProperty(name))
            options[name] = JSON.parse(JSON.stringify(this._def[name]));
    }
    this._options.forEach(function (option) {
        if (!(option instanceof self.Option))
            return;
        if (!options.hasOwnProperty(option.getName()))
            options[option.getName()] = option._def;
    });
};

/**
 * Add a new sub-command to the parser.
 *
 * @param {String} name         name of the sub command
 * @param          [handler]    either a module name that exports a `parser'
 *                              or a function that will be used as a parser
 *                              action
 * @returns {Parser}            if no handler was given or a parser action was
 *                              given, returns the Parser for the sub-command
 */
exports.Parser.prototype.command = function (name, handler) {
    var parent = this;
    if (!handler) {
        var parser = new exports.Parser();
        this._commands[name] = function () {
            return parser;
        };
        return parser;
    } else if (typeof handler == "string") {
        this._commands[name] = function () {
            return require(handler).parser;
        };
        return;
    } else {
        var parser = new this.Parser();
        parser.action(handler);
        this._commands[name] = function () {
            return parser;
        };
        return parser;
    }
};

/**
 * Add a single positional argument to the command.
 *
 * Warning: Only used for printing the help or usage. The parser is not
 * responsible for reading them from the command line arguments.
 *
 * @param {String} name     name of the argument
 * @returns {Argument}      {@link Argument} object reprsenting the argument
 */
exports.Parser.prototype.arg = function (name) {
    var argument = new exports.Argument(this).name(name);
    this._args.push(argument);
    return argument;
};

/**
 * Add a variable number of arguments to the command.
 *
 * Warning: Only used for printing the help or usage. The parser is not
 * responsible for reading them from the command line arguments.
 *
 * @param {String} name     name of the arguments
 * @returns {Argument}      {@link Argument} object representing the argument
 */
exports.Parser.prototype.args = function (name) {
    var argument = new exports.Argument(this).name(name);
    this._vargs = argument;
    return argument;
};

/**
 * Enable or disable interleaved arguments.
 *
 * Disabled by default.
 *
 * @param {Boolean} [value=true]    true to allow interleaved arguments
 * @returns {Parser}                this
 */
exports.Parser.prototype.interleaved = function (value) {
    if (value === undefined)
        value = true;
    this._interleaved = value;
    return this;
};

/**
 * Act on the given arguments.
 *
 * Parses the arguments and calls the appropriate actions.
 *
 * Normally, this won't be used externally.
 *
 * @param {String[]} args       arguments to parse
 * @param {Option[]} options    result of the parent parser
 */
exports.Parser.prototype.act = function (args, options) {
    if (!this._action) {
        this.error(options, "Not yet implemented.");
        this.exit(-1);
    }
    options.acted = true;
    this._action.call(this, this.parse(args), options);
};

/**
 * Add an action to the parser.
 * 
 * If an action already exists, the new action will be executed after the
 * executing action.
 *
 * Warning: Not executed when the parse method is called. Normally used on
 * sub-command parsers only.
 *
 * @param {Function} action     the action to execute
 * @returns {Parser}            this
 */
exports.Parser.prototype.action = function (action) {
    if (this._action) {
        action = (function (previous, next) {
            return function () {
                previous.apply(this, arguments);
                next.apply(this, arguments);
            };
         })(this._action, action);
    }
    this._action = action;
    return this;
};

/**
 * Make the parser helpful.
 *
 * Will add help options and if required, commands.
 *
 * Warning: Must be called last, after all parser configuration is finished.
 *
 * @returns {Parser} this
 */
exports.Parser.prototype.helpful = function () {
    var self = this;
    this.option('-h', '--help')
        .help('displays usage information')
        .action(function (options) {
            return self.printHelp(options);
        })
        .halt();
    if (Object.keys(this._commands).length)
        this.command('help', function (options) {
            self.printHelp(options);
        }).help('displays usage information');
    return this;
};

exports.Parser.prototype.usage = function (usage) {
    this._usage = usage;
    return this;
};

exports.Parser.prototype.help = function (help) {
    this._help = help;
    return this;
};

exports.Parser.prototype.printHelp = function (options) {
    var args = options.args || [];
    if (args.length) {
        // parse args for deep help
        // TODO offer extended help for options
        if (!this._commands.hasOwnProperty(args[0])) {
            this.error(options, JSON.stringify(args[0]) + ' is not a command.');
            this.printCommands(options);
            this.exit(options);
        } else {
            args.splice(1, 0, '--help');
            this._commands[args[0]]().act(args, options);
            this.exit(options);
        }
    } else {
        this.printUsage(options);
        if (this._help)
            this.print('' + this._help + '');
        this.printCommands(options);
        this.printOptions(options);
        this.exit(options);
    }
};

exports.Parser.prototype.printUsage = function (options) {
    this.print(
        'Usage: \0bold(\0blue(' + path.basename(options.command || '<unknown>') +
        (!this._interleaved ?  ' [OPTIONS]' : '' ) + 
        (Object.keys(this._commands).length ?
            ' COMMAND' :
            ''
        ) + 
        (Object.keys(this._args).length ?
            ' ' + this._args.map(function (arg) {
                if (arg._optional) {
                    return '[' + arg._name.toUpperCase() + ']';
                } else {
                    return arg._name.toUpperCase();
                }
            }).join(' ') :
            ''
        ) +
        (this._vargs ?
            ' [' + this._vargs._name.toUpperCase() + ' ...]':
            ''
        ) + 
        (this._interleaved ?  ' [OPTIONS]' : '' ) + 
        (this._usage ?
            ' ' + this._usage :
            ''
        ) + "\0)\0)"
    );
};

exports.Parser.prototype.printCommands = function (options) {
    for(var name in this._commands) {
        var parser = this._commands[name]();
        this.print('  \0bold(\0green(' + name + '\0)\0)' + (
            parser._help ?
            (
                ': ' +
                (
                    parser._action?
                    '': '\0red(NYI\0): '
                ) +
                parser._help
            ) : ''
        ));
    }
};

exports.Parser.prototype.printOption = function (options, option, depth, parent) {
    var self = this;
    depth = depth || 0;
    var indent = Array(depth + 1).join('   ');

    if (option._hidden)
        return;
    if (option._group !== parent)
        return;

    if (option instanceof exports.Group) {
        self.print(indent + ' \0yellow(' + option._name + ':\0)');
        var parent = option;
        option._options.forEach(function (option) {
            return self.printOption(options, option, depth + 1, parent);
        });
        return;
    }

    var message = [];
    if (option._short.length)
        message.push(option._short.map(function (_short) {
            return ' \0bold(\0green(-' + _short + '\0)\0)';
        }).join(''));
    if (option._long.length)
        message.push(option._long.map(function (_long) {
            return ' \0bold(\0green(--' + _long + '\0)\0)';
        }).join(''));
    if (option._action && option._action.length > 2)
        message.push(
            ' ' +
            Array(option._action.length - 2)
                .map(function () {
                    return '\0bold(\0green(' +
                            option.getDisplayName().toUpperCase() +
                        '\0)\0)';
                }).join(' ')
        );
    if (option._help)
        message.push(': ' + option._help + '');
    if (option._choices) {
        var choices = option._choices;
        if (Object.prototype.toString(choices) !== '[object Array]')
            choices = Object.keys(choices);
        message.push(' \0bold(\0blue((' + choices.join(', ') + ')\0)\0)');
    }
    if (option._halt)
        message.push(' \0bold(\0blue((final option)\0)\0)');
    self.print(indent + message.join(''));

};

exports.Parser.prototype.printOptions = function (options) {
    var self = this;
    self._options.forEach(function (option) {
        self.printOption(options, option);
    });
};

exports.Parser.prototype.error = function (options, message) {
    if (this._parser) {
        this._parser.error.apply(
            this._parser,
            arguments
        );
    } else {
        this.print('\0red(' + message + '\0)');
        this.exit();
    }
};

exports.Parser.prototype.exit = function (status) {
    if (this._parser) {
        this._parser.exit.apply(
            this._parser,
            arguments
        );
    } else {
        // FIXME: exit is sometimes called with the "options" object as the "status" argument. Why?
        process.exit(typeof status == "number" ? status : 1);
        throw new Error("exit failed");
    }
};

exports.Parser.prototype.print = function () {
    if (this._parser)
        this._parser.print.apply(
            this._parser,
            arguments
        );
    else
        process.stdout.write(arguments);
};

// verifies that the parser is fully configured
exports.Parser.prototype.check = function () {
    // make sure all options have associated actions
    var self = this;
    self._options.forEach(function (option) {
        if (!(option instanceof self.Option))
            return;
        if (!option._action)
            throw new exports.ConfigurationError(
                "No action associated with the option " + 
                JSON.stringify(option.getDisplayName())
            );
    });
};

/**
 * Parse the arguments, calling the appropriate option actions.
 *
 * @param {String[]}    [args=process.argv]  command line arguments
 * @param {Object}      [options]           parser state
 * @param {Boolean}     [noCommand=false]   true if sub-commands are not
 *                                          allowed
 * @param {Boolean}     [allowInterleaved]  true to allow interleaved
 *                                          arguments; overrides
 *                                          this.interleaved
 * @returns {Object}                        final parser state
 */
exports.Parser.prototype.parse = function (args, options, noCommand, allowInterleaved) {

    // TODO break this into sub-functions
    // TODO wrap with a try catch and print the progress through the arguments

    var self = this;

    this.check();

    if (!args)
        args = process.argv;
    if (!options)
        options = {};
    if (allowInterleaved === undefined)
        allowInterleaved = this._interleaved;

    options.args = args;
    if (!noCommand && args.length && !/^-/.test(args[0]))
        options.command = args.shift();

    function mandatoryShift(n, name) {
        if (n > args.length) {
            this.error(
                options,
                'Error: The ' + JSON.stringify(name) +
                ' option requires ' + n + ' arguments.'
            );
        }
        var result = args.slice(0, n);
        for (var i = 0; i < n; i++)
            args.shift()
        return result;
    };

    function validate(option, value) {
        try {
            if (option._action.length <= 3)
                value = value[0];
            return option._validate.call(self, value);
        } catch (exception) {
            throw exception;
            self.error(options, exception);
        }
    };

    // initial values
    this.reset(options);

    var interleavedArgs = [];

    // walk args
    ARGS: while (args.length) {
        var arg = args.shift();
        if (arg == "--") {
            break;

        } else if (/^--/.test(arg)) {

            var pattern = arg.match(/^--([^=]+)(?:=(.*))?/).slice(1);
            var word = pattern[0];
            var value = pattern[1];

            if (!!value) {
                args.unshift(value);
            }

            if (this._long.hasOwnProperty(word)) {

                var option = this._long[word];
                if (!option._action) {
                    self.error(
                        options,
                        "Programmer error: The " + word +
                        " option does not have an associated action."
                    );
                }

                option._action.apply(
                    self,
                    [
                        options,
                        option.getName()
                    ].concat(
                        validate(option, mandatoryShift.call(
                            this,
                            Math.max(0, option._action.length - 2),
                            option.getName()
                        ))
                    )
                );

                if (option._halt)
                    break ARGS;

            } else {
                this.error(options, 'Error: Unrecognized option: ' + JSON.stringify(word));
            }

        } else if (/^-/.test(arg)) {

            var letters = arg.match(/^-(.*)/)[1].split('');
            while (letters.length) {
                var letter = letters.shift();
                if (this._short.hasOwnProperty(letter)) {
                    var option = this._short[letter];

                    if (option._action.length > 2) {
                        if (letters.length) {
                            args.unshift(letters.join(''));
                            letters = [];
                        }
                    }

                    option._action.apply(
                        self,
                        [
                            options,
                            option.getName(),
                        ].concat(
                            validate(
                                option,
                                mandatoryShift.call(
                                    this,
                                    Math.max(0, option._action.length - 2),
                                    option.getName()
                                )
                            )
                        )
                    );

                    if (option._halt)
                        break ARGS;

                } else {
                    this.error(options, 'Error: unrecognized option: ' + JSON.stringify(letter));
                }
            }

        } else {
            interleavedArgs.push(arg);
            if (!allowInterleaved)
                break;
        }

    }

    // add the interleaved arguments back in
    args.unshift.apply(args, interleavedArgs)

    if (Object.keys(this._commands).length) {
        if (args.length) {
            if (this._commands.hasOwnProperty(args[0])) {
                var command = this._commands[args[0]];
                command().act(args, options);
            } else {
                this.error(options, 'Error: unrecognized command');
            }
        } else {
            this.error(options, 'Error: command required');
            this.exit(0);
        }
    }

    return options;
};

/**
 * Represents positional arguments for the parser.
 * 
 * @constructor
 * @param {Parser} parser   the parent parser
 */
exports.Argument = function (parser) {
    this._parser = parser;
    return this;
};

/**
 * Set the name of the argument.
 *
 * @param {String} name     name of the parser
 * @returns {Argument}      this
 */
exports.Argument.prototype.name = function (name) {
    this._name = name;
    return this;
};

/**
 * Make the argument optional.
 *
 * @param {Boolean} [value=true]    true to make this optional
 * @returns {Argument}              this
 */
exports.Argument.prototype.optional = function (value) {
    if (value === undefined)
        value = true;
    this._optional = value;
    return this;
};

/**
 * Represents a command line option.
 *
 * Other than the parser, the arguments are read with the following rules.
 *
 * Hashes contain attributes.
 * <code>
 *      new Option(parser, {
 *          action: function () { ... },
 *          _: 'l',         // short name
 *          __: 'list',     // long name
 *          help: "list all packages"
 *      });
 * </code>
 *
 * A function is the option's action.
 * <code>
 *      new Option(parser, function () { ... });
 * </code>
 *
 * Strings starting with "-" and "--" are short and long names respectivey.
 * <code>
 *      new Option(parser, "-l", "--list");
 * </code>
 *
 * A string with spaces is the help message.
 * <code>
 *      new Option(parser, "-l", "--list", "list all packages");
 * </code>
 *
 * A one-word string is the display name and the option name. An additional
 * one-word string is the option name.
 * <code>
 *      new Option(parser, "-d", "--delete", "file", "del");
 *      // file is the display name and del is the option name
 * </code>
 *
 * @param {Parser} parser       the owning parser
 */
exports.Option = function (parser, args) {
    var self = this;
    this._parser = parser;
    this._validate = function (value) {
        return value;
    };
    this._long = [];
    this._short = [];
    for(var i in args) {
        var arg = args[i];
        if (typeof arg == "function") {
            self.action(arg);
        } else if (typeof arg !== "string") {
            for (var name in arg) {
                var value = arg[name];
                self[name](value);
            }
        } else if (/ /.test(arg)) {
            self.help(arg);
        } else if (/^--/.test(arg)) {
            arg = arg.match(/^--(.*)/)[1];
            self.__(arg);
        } else if (/^-.$/.test(arg)) {
            arg = arg.match(/^-(.)/)[1];
            self._(arg);
        } else if (/^-/.test(arg)) {
            throw new Error("option names with one dash can only have one letter.");
        } else {
            if (!self._name) {
                self.name(arg);
                self.displayName(arg);
            } else {
                self.name(arg);
            }
        }
    };
    if (!(self._short.length || self._long.length || self._name))
        throw new exports.ConfigurationError("Option has no name.");
    return this;
};

/**
 * Set the short option.
 *
 * @param {String} letter   the character for the option
 * @returns {Option}        this
 */
exports.Option.prototype._ = function (letter) {
    this._short.push(letter);
    this._parser._short[letter] = this;
    return this;
};

/**
 * Set the long option.
 *
 * @param {String} word     the word for the long option
 * @returns {Option}        this
 */
exports.Option.prototype.__ = function (word) {
    this._long.push(word);
    this._parser._long[word] = this;
    return this;
};

/**
 * Set the name of the option.
 *
 * Used in the result hash.
 *
 * @param {String} name     name of the option
 * @returns {Option}        this
 */
exports.Option.prototype.name = function (name) {
    this._name = name;
    return this;
};

/**
 * Set the display name for the option.
 *
 * Shown in the help as the name of the argument. Useless if the option
 * doesn't have an argument.
 *
 * @param {String} displayName      new display name
 * @returns {Option}                this
 */
exports.Option.prototype.displayName = function (displayName) {
    this._displayName = displayName;
    return this;
};

/**
 * @returns {String} the display name
 */
exports.Option.prototype.getDisplayName = function () {
    if (this._displayName)
        return this._displayName;
    return this.getName();
};

/**
 * @returns {String} the name
 */
exports.Option.prototype.getName = function () {
    if (this._name) {
        return this._name;
    }
    if (this._long.length > 0) {
        return this._long[0];
    }
    if (this._short.length > 0) {
        return this._short[0];
    }
    throw new Error("Programmer error: unnamed option");
};

/**
 * Set the action executed when this option is encountered.
 *
 * @param action        either a function or a string with the name of a
 *                      function in the parser
 * @returns {Option}    this
 */
exports.Option.prototype.action = function (action) {
    var self = this;
    if (typeof action == "string") {
        this._action = self._parser[action];
    } else {
        this._action = action;
    }
    return this;
};

/**
 * If value is given, the option will not take any arguments and will have the
 * given value if its flag was passed.
 *
 * Otherwise, the option will take a single argument.
 *
 * @param value         desired value
 * @returns {Option}    this
 */
exports.Option.prototype.set = function (value) {
    var option = this;
    if (arguments.length == 0)
        return this.action(function (options, name, value) {
            options[name] = value;
        });
    else if (arguments.length == 1)
        return this.action(function (options, name) {
            options[name] = value;
        });
    else
        throw new exports.UsageError("Option().set takes 0 or 1 arguments");
};

/**
 * The option can have multiple values.
 *
 * Each argument for this option will be passed separately.
 *
 * @returns {Option} this
 */
exports.Option.prototype.push = function () {
    var option = this;
    return this.def([]).action(function (options, name, value) {
        options[name].push(option._validate.call(
            this,
            value
        ));
    });
};

/**
 * The option will keep track of the number of times the flag was passed in the
 * arguments.
 *
 * @returns {Option} this
 */
exports.Option.prototype.inc = function () {
    return this.def(0).action(function (options, name) {
        options[name]++;
    });
};

/**
 * The option's value will be the negative of number of times its flag was
 * passed in the arguments.
 *
 * @returns {Option} this
 */
exports.Option.prototype.dec = function () {
    return this.def(0).action(function (options, name) {
        options[name]--;
    });
};

/**
 * The option can only have one of the given values.
 *
 * @param choices array of string containing the choices or hash whose keys
 *                will be the possible choices and the mapped value will be
 *                the value of the option
 * @returns {Option} this
 */
exports.Option.prototype.choices = function (choices) {
    this.set();
    this._choices = choices;
    var self = this;
    if (Object.prototype.toString(choices) === '[object Array]') {
        return this.validate(function (value) {
            if (choices.indexOf(value) < 0)
                throw new exports.UsageError(
                    "choice for " + self.getDisplayName().toUpperCase() +
                    " is invalid: " + JSON.stringify(value) + "\n" +
                    "Use one of: " + choices.map(function (choice) {
                        return JSON.stringify(choice);
                    }).join(', ')
                );
            return value;
        })
    } else {
        return this.validate(function (value) {
            if (!choices.hasOwnProperty(value))
                throw new exports.UsageError(
                    "choice for " + self.getDisplayName().toUpperCase() +
                    " is invalid: " + JSON.stringify(value) + "\n" +
                    "Use one of: " + Object.keys(choices).map(function (choice) {
                        return JSON.stringify(choice);
                    }).join(', ')
                );
            return choices[value];
        });
    }
};

/**
 * Set the default value for the option.
 *
 * Overrides setting from Parser.def().
 *
 * @param value      new default value
 * @returns {Option} this
 */
exports.Option.prototype.def = function (value) {
    if (this._def === undefined)
        this._def = value;
    return this;
};

/**
 * Add a validate function to the option.
 *
 * The last added validate function is executed first.
 *
 * @param {Function} validate   the validate function - takes the option's
 *                              value and returns a new value or the original
 *                              value unchanged; can throw {@link UsageError}
 * @returns {Option}            this
 */
exports.Option.prototype.validate = function (validate) {
    var current = this._validate;
    if (this._validate) {
        validate = (function (previous) {
            return function () {
                return current.call(
                    this,
                    previous.apply(this, arguments)
                );
            };
        })(validate);
    }
    this._validate = validate;
    return this;
};

/**
 * The option will take an input file.
 *
 * If the given file name is "-", stdin is used.
 *
 * @returns {Option} this
 */
exports.Option.prototype.input = function () {
    return this.set().validate(function (value) {
        if (value == "-")
            return process.openStdin();
        else
            return fs.createReadStream(value);
    });
};

/**
 * The option will take an output file.
 *
 * If the given file name is "-", stdout is used.
 *
 * @returns {Option} this
 */
exports.Option.prototype.output = function () {
    return this.set().validate(function (value) {
        if (value == "-")
            return process.stdout;
        else
            return fs.createWriteStream(value);
    });
};

/**
 * The option will take a number.
 *
 * @returns {Option} this
 */
exports.Option.prototype.number = function () {
    return this.set().validate(function (value) {
        var result = +value;
        if (isNaN(result))
            throw new exports.UsageError("not a number");
        return result;
    });
};

/**
 * The option will take an octal value.
 *
 * @returns {Option} this
 */
exports.Option.prototype.oct = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 8);
        if (isNaN(result))
            throw new exports.UsageError("not an octal value");
        return result;
    });
};

/**
 * The option will take a hexadecimal value.
 *
 * @returns {Option} this
 */
exports.Option.prototype.hex = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 16);
        if (isNaN(result))
            throw new exports.UsageError("not an hex value");
        return result;
    });
};

/**
 * The option will take an integer value.
 *
 * @returns {Option} this
 */
exports.Option.prototype.integer = function () {
    return this.set().validate(function (value) {
        var result = parseInt(value, 10);
        if (isNaN(result) || result !== +value)
            throw new exports.UsageError("not an integer");
        return result;
    });
};

/**
 * The option will take a natural number
 *
 * @returns {Option} this
 */
exports.Option.prototype.natural = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 0)
            throw new exports.UsageError("not a natural number");
        return result;
    });
};

/**
 * The option will take a whole number.
 *
 * @returns {Option} this
 */
exports.Option.prototype.whole = function () {
    return this.set().validate(function (value) {
        var result = value >>> 0;
        if (result !== +value || result < 1)
            throw new exports.UsageError("not a whole number");
        return result;
    });
};

/**
 * The option will take a boolean value.
 *
 * @param {Boolean} def     default value
 * @returns {Option}        this
 */
exports.Option.prototype.bool = function (def) {
    if (def === undefined)
        def = true;
    return this.def(!def).set(!!def);
};

exports.Option.prototype.todo = function (command, value) {
    this._parser.def('todo', []);
    command = command || this.getName();
    if (value)
        return this.action(function (options, name, value) {
            options.todo.push([command, value]);
        });
    else
        return this.action(function (options, name) {
            options.todo.push([command]);
        });
};

/**
 * The option will have an inverse option.
 *
 * @returns {Option} this
 */
exports.Option.prototype.inverse = function () {
    var args = arguments;
    if (!args.length) {
        args = [];
        this._short.forEach(function (_) {
            args.push('-' + _.toUpperCase());
        });
        this._long.forEach(function (__) {
            args.push('--no-' + __);
        });
        if (this.getName()) 
            args.push(this.getName());
    }
    var parser = this._parser;
    var inverse = this._inverse = parser.option.apply(
        parser,
        args
    ).set(!this._def).help('^ inverse');
    return this;
};

/**
 * Set the help text for this option.
 *
 * @param {String} text     the help text
 * @returns {Option}        this
 */
exports.Option.prototype.help = function (text) {
    this._help = text;
    return this;
};

/**
 * The option is final.
 *
 * None of the other options will be parsed after this.
 *
 * @param {Boolean} [value=true]    true to make this option final
 * @returns {Option}                this
 */
exports.Option.prototype.halt = function (value) {
    if (value == undefined)
        value = true;
    this._halt = value;
    return this;
};

/**
 * The option is hidden.
 *
 * It won't be shown in the program usage.
 *
 * @param {Boolean} [value=true]    true to make this option hidden
 * @returns {Option}                this
 */
exports.Option.prototype.hidden = function (value) {
    if (value === undefined)
        value = true;
    this._hidden = value;
    return this;
};

/**
 * Return the option's owning parser.
 *
 * Useful for chaining.
 *
 * @returns {Parser} owning parser
 */
exports.Option.prototype.end = function () {
    return this._parser;
};

/**
 * Helper function equivalent to end().option(...).
 */
exports.Option.prototype.option = function () {
    return this.end().option.apply(this, arguments);
};

/**
 * Return the parser's parent parser.
 *
 * @returns {Parser} parent parser
 */
exports.Parser.prototype.end = function () {
    return this._parser;
};

/**
 * Represents an option group.
 *
 * @param {Parser} parser   option parser
 * @param          parent   parent parser or group
 * @param {String} name     name of the group
 */
exports.Group = function (parser, parent, name) {
    this._name = name;
    this._parser = parser;
    this._parent = parent;
    this._options = [];
    return this;
};

/**
 * Add an option to the group.
 *
 * Takes the same arguments as the {@link Option} constructor.
 *
 * @returns {Option} the new Option object
 */
exports.Group.prototype.option = function () {
    var option = this._parser.option.apply(this._parser, arguments);
    option._group = this;
    this._options.push(option);
    return option;
};

/**
 * Create a sub-group to this group.
 *
 * @param {String} name     name of the new group
 * @returns {Group}         the new group
 */
exports.Group.prototype.group = function (name) {
    var Group = this.Group || this._parser.Group;
    var group = new Group(this._parser, this, name);
    return group;
};

/**
 * Returns the group's parent group or parser.
 * 
 * Useful for chaining commands.
 *
 * @returns parent parser or group
 */
exports.Group.prototype.end = function () {
    return this._parent;
};

exports.Parser.prototype.Parser = exports.Parser;
exports.Parser.prototype.Option = exports.Option;
exports.Parser.prototype.Group = exports.Group;

