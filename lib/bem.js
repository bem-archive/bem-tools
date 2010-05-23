var parser = exports.parser = (new (require('args').Parser)())
    .help('Инструменты работы с файлами, написанными по БЭМ-методу');
parser.command('decl', module.id + '/commands/decl');
parser.command('build', module.id + '/commands/build');
parser.command('create', module.id + '/commands/create');
parser.helpful();

exports.main = function (args) {
    var options = parser.parse(args);
    !options.acted && parser.printHelp(options);
};

if (module.id == require.main) exports.main(system.args);
