var parser = exports.parser = (new (require('args').Parser)())
    .help('создание различных сущностей');

parser.command('level', module.id + '/level');
parser.command('block', module.id + '/block');
parser.command('elem', module.id + '/elem');

parser.helpful().action(function(){});
