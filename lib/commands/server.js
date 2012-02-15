var server = require('../server/server.js');

module.exports = function() {

    return this
        .title('Запустить сервер для разработки.')
        .helpful()
        .opt()
            .name('verbose').short('v').long('verbose')
            .title('уровень логирования')
            .end()
        .opt()
            .name('port').short('p').long('port')
            .title('TCP порт (по умолчанию 8080)')
            .def(8080)
            .val(function (d) { if (!d) {throw new Error("значение параметра port не задано")} else return d })
            .end()
        .opt()
            .name('project').short('r').long('project')
            .title('путь к корню проекта (по умолчанию текущая директория)')
            .def('.')
            .val(function (d) { if (!d) {throw new Error("значение параметра project не задано")} else return d })
            .end()
        .act(function(opts, args) {
            server.start(opts);
        });
};
