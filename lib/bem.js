var parser = exports.parser = (new (require('args').Parser)())
    .help('Инструменты работы с файлами, написанными по БЭМ-методу');
parser.command('build', module.id + '/commands/build');
parser.helpful();

exports.main = function (args) {
    var options = parser.parse(args);
    !options.acted && parser.printHelp(options);
};

if (module.id == require.main) exports.main(system.args);
