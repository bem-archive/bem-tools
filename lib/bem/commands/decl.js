var parser = exports.parser = (new (require('args').Parser)())
    .help('работа с декларациями использования');

parser.command('merge', module.id + '/merge');

parser.helpful().action(function(){});
