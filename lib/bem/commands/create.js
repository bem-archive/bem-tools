var parser = exports.parser = (new (require('args').Parser)())
    .help('создание различных сущностей');

parser.command('level', module.id + '/level');

parser.helpful().action(function(){});
