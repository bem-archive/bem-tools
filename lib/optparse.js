var sys = require('sys'),
    fs = require('fs'),
    myPath = require('./path');

function Cmd(cmd) {

    if(!(this instanceof Cmd)) return new Cmd(cmd);

    cmd && cmd._cmds.push(this);
    this._cmd = cmd || this;

    this._cmds = [];
    this._cmdsByName = {};

    this._opts = [];
    this._optsByKey = {};

    this._args = [];

}

Cmd.prototype.name = function(name) {
    this._name = name;
    this._cmd._cmdsByName[name] = this;
    return this;
};

Cmd.prototype.cmd = function() { return new Cmd(this) };

Cmd.prototype.opt = function() { return new Opt(this) };

Cmd.prototype.arg = function() { return new Arg(this) };

Cmd.prototype.act = function(act, force) {
    if(!act) return this._act;

    if(!force && this._act) {
        var oldAct = this._act;
        this._act = function() {
            oldAct.apply(this, arguments);
            act.apply(this, arguments);
        };
    } else this._act = act;

    return this;
};

Cmd.prototype.apply = function(fn, args) {
    fn.apply(this, Array.prototype.slice.call(arguments, 1));
    return this;
};

Cmd.prototype.helpful = function() {
    this._helpful = true;
    this.opt().name('help')
        .short('h').long('help')
        .type(Boolean).title('Помощь');
    return this.act(function(opts, args){
        if(opts.help) this.exit(this.usage());
    });
};

Cmd.prototype.errorExit = function(msg, o) {
    msg && sys.error(msg + (o? ': ' + o : ''));
    process.exit(1);
};

Cmd.prototype.exit = function(msg) {
    msg && sys.error(msg);
    process.exit();
};

Cmd.prototype.usage = function() {
    var res = [];

    this._title && res.push(this._fullTitle());

    res.push('', 'Использование:');

    this._cmds.length && res.push(['', '',
        Color('lred', this._fullName()),
        Color('lblue', 'COMMAND'),
        Color('lgreen', '[OPTIONS]'),
        Color('lpurple', '[ARGS]')].join(' '));

    (this._opts.length + this._args.length) && res.push(['', '',
        Color('lred', this._fullName()),
        Color('lgreen', '[OPTIONS]'),
        Color('lpurple', '[ARGS]')].join(' '));

    res.push(
        this._usages(this._cmds, 'Команды'),
        this._usages(this._opts, 'Опции'),
        this._usages(this._args, 'Аргументы'));

    return res.join('\n');
};

Cmd.prototype._usage = function() {
    return Color('lblue', this._name) + ' : ' + this._title;
};

Cmd.prototype._usages = function(os, title) {
    if(!os.length) return;
    var res = [];
    res.push('', title + ':');
    os.forEach(function(o) { res.push('  ' + o._usage()) });
    return res.join('\n');
};

Cmd.prototype._fullTitle = function() {
    return (this._cmd !== this? this._cmd._fullTitle() + '\n' : '') + this._title;
};

Cmd.prototype._fullName = function() {
    return (this._cmd !== this? this._cmd._fullName() + ' ' : '') + myPath.basename(this._name);
};

Cmd.prototype._ejectOpt = function(opts, opt) {
    var i = opts.length, res;
    while(i--) opts[i] === opt && (res = i);
    if(typeof res !== 'undefined')
        return opts[res]._push?
            opts[res] :
            opts.splice(res, 1)[0];
};

Cmd.prototype.parse = function(argv) {
    var opts = {},
        args = {},
        nonParsedOpts = this._opts.concat(),
        nonParsedArgs,
        i;

    while(i = argv.shift())
        // opt
        if(!i.indexOf('-')) {

            nonParsedArgs || (nonParsedArgs = this._args.concat());

            var m = i.match(/^--(\w[\w-_]*)=(.*)$/);
            if(m) {
                i = m[1];
                argv.unshift(m[2]);
            }

            var opt = this._ejectOpt(nonParsedOpts, this._optsByKey[i]);
            opt?
                opt.parse(argv, opts) :
                this.errorExit('Неизвестная опция', i);

        // cmd
        } else if(!nonParsedArgs && /^\w[\w-_]*$/.test(i)) {
            var cmd = this._cmdsByName[i];
            if(cmd) {
                cmd.parse(argv);
            } else {
                nonParsedArgs = this._args.concat();
                argv.unshift(i);
            }
        // arg
        } else {
            var arg = nonParsedArgs.shift();
            if(arg) {
                arg._push && nonParsedArgs.unshift(arg);
                arg.parse(i, args);
            } else {
                this.errorExit('Неизвестный аргумент', i);
            }
        }

    nonParsedArgs || (nonParsedArgs = this._args.concat());

    if(!(this._helpful && opts.help)) {
        var nonParsed = nonParsedOpts.concat(nonParsedArgs);
        while(i = nonParsed.shift()) {
            i._required && i._checkParsed(opts, args) && this.errorExit(i._requiredText());
            '_def' in i && i._saveVal(opts, i._def);
        }
    }

    //console.log(opts, args);
    this._act && this._act(opts, args);
    //this.exit();
};

function Opt(cmd) {
    this._cmd = cmd;
    this._cmd._opts.push(this);
}

Opt.prototype.short = function(short) {
    this._short = short;
    return (this._cmd._optsByKey['-' + short] = this);
};

Opt.prototype.long = function(long) {
    this._long = long;
    return (this._cmd._optsByKey['--' + long] = this);
};

Opt.prototype._saveVal = function(opts, val) {
    this._validate && (val = this._validate(val));
    var n = this._name;
    this._push?
        (opts[n] || (opts[n] = [])).push(val) :
        opts[n] = val;
    return this;
};

Opt.prototype.parse = function(argv, opts) {
    return this._saveVal(
        opts,
        this._flag?
            true :
            argv.shift());
};

Opt.prototype._checkParsed = function(opts, args) {
    return !opts.hasOwnProperty(this._name);
};

Opt.prototype._usage = function() {
    var res = [],
        nameStr = this._name.toUpperCase();

    if(this._short) {
        res.push('-', Color('lgreen', this._short));
        this._flag || res.push(' ' + nameStr);
        res.push(', ');
    }

    if(this._long) {
        res.push('--', Color('green', this._long));
        this._flag || res.push('=' + nameStr);
    }

    res.push(' : ', this._title);

    return res.join('');
};

Opt.prototype._requiredText = function() {
    return 'Пропущена обязательная опция:\n  ' + this._usage();
};

function Arg(cmd) {
    (this._cmd = cmd)._args.push(this);
}

Arg.prototype.parse = function(arg, args) {
    return this._saveVal(args, arg);
};

Arg.prototype._checkParsed = function(opts, args) {
    return !args.hasOwnProperty(this._name);
};

Arg.prototype._usage = function() {
    return Color('lpurple', this._name.toUpperCase()) + ' : ' + this._title;
};

Arg.prototype._requiredText = function() {
    return 'Пропущен обязательный аргумент:\n  ' + this._usage();
};

Opt.prototype._saveVal = Arg.prototype._saveVal = function(res, val) {
    this._validate && (val = this._validate(val));
    var n = this._name;
    this._push?
        (res[n] || (res[n] = [])).push(val) :
        res[n] = val;
    return this;
};

Opt.prototype.name = Arg.prototype.name = function(name) {
    this._name = name;
    return this;
};

Opt.prototype.type = Arg.prototype.type = function(type) {
    this._type = type;
    this._type === Boolean && (this._flag = true);
    return this;
};

Opt.prototype.push = Arg.prototype.push = function() {
    this._push = true;
    return this;
};

Opt.prototype.required = Arg.prototype.required = function() {
    this._required = true;
    return this;
};

Opt.prototype.validate = Arg.prototype.validate = function(validate) {
    this._validate = validate;
    return this;
};

Opt.prototype.def = Arg.prototype.def = function(def) {
    this._def = def;
    return this;
};

Opt.prototype.output = Arg.prototype.output = function(output) {
    return this
        .def(process.stdout)
        .validate(function(v) {
            return typeof v !== 'string'?
                v :
                v === '-'?
                    process.stdout :
                    fs.createWriteStream(v, { encoding: 'utf8' });
        });
};


Cmd.prototype.title = Opt.prototype.title = Arg.prototype.title = function(title) {
    this._title = title;
    return this;
};

Cmd.prototype.end = Opt.prototype.end = Arg.prototype.end = function() {
    return this._cmd;
};

exports.Cmd = Cmd;

var colors = {
    black: '30',
    dgray: '1;30',
    red: '31',
    lred: '1;31',
    green: '32',
    lgreen: '1;32',
    brown: '33',
    yellow: '1;33',
    blue: '34',
    lblue: '1;34',
    purple: '35',
    lpurple: '1;35',
    cyan: '36',
    lcyan: '1;36',
    lgray: '37',
    white: '1;37'
};

function Color(c, str) {
    return [
            '\033[', colors[c], 'm',
            str,
            '\033[m',
        ].join('');
}
