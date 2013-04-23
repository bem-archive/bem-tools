# Модули технологий

## API

Смотрите документацию в исходном файле [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js).

## Создание модуля технологии

Существует несколько способов написания модулей технологии.

Во всех описанных ниже способах из методов можно обратиться к объекту технологии через `this`,
а через `this.__base(...)` можно вызвать метод одного из базовых классов. К классу технологии
можно обратиться через `this.__class`. Всё это является следствием использования модуля
[inherit](https://github.com/dfilatov/node-inherit) для органиазации наследования.

### Очень простой способ

Способ заключается в том, что вы создаёте обычный CommonJS модуль, из
которого экспортируете несколько функций, которые перекроют методы базового
класса `Tech` из модуля [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js).

```js
exports.getCreateResult = function(...) {
    // ваш код
};
```

Вы так же можете сгруппироать все методы в объекте `techMixin`. Это рекомендованный способ.

```js
exports.techMixin = {

    getCreateResult: function(...) {
        // ваш код
    }

};
```

### Простой способ

В простом способе к экспортируемым функциям добавляется переменная `baseTechPath`, в которой
содержится абсолютный путь до расширяемого модуля технологии.

```js
var BEM = require('bem');

exports.baseTechPath = BEM.require.resolve('./techs/css');
```

Так же вы можете организовать контекстное наследование, используя переменную `baseTechName`.
В этом случае базовый класс будет выбран в зависимости от уровня переопределения, на котором
будет использован модуль технологии.

```js
exports.baseTechName = 'css';
```

В этом примере новая технология будет расширять технологию `css`, заданную на уровне переопределения
в файле `.bem/level.js`.

### Для продвинутых

Если вам нужен полный контроль, вы можете создать модуль, экспортирующий готовый класс технологии `Tech`.

```js
var INHERIT = require('inherit'),
    BaseTech = require('bem/lib/tech').Tech;

exports.Tech = INHERIT(BaseTech, {

    create: function(prefix, vars, force) {
        // do some creation work
    },

    build: function(prefixes, outputDir, outputName) {
        // organize own build process
    }

});
```

Если в качестве базовой технологии вы хотите использовать одну из существующих технологий,
написанных в простом стиле, воспользуйтесь функцией `getTechClass()` для получения класса
этой технологии. Мы рекомендуем всегда использовать `getTechClass()`, чтобы не зависеть
от реализации базовой технологии.

```js
var INHERIT = require('inherit'),
    BEM = require('bem'),
    BaseTech = BEM.getTechClass(require.resolve('path/to/tech/module'));

exports.Tech = INHERIT(BaseTech, {

    // ваш код

});
```

### Примеры модулей технологий

 * [bem-tools/lib/techs/](https://github.com/bem/bem-tools/tree/master/lib/techs)
 * [bem-bl/blocks-common/i-bem/bem/techs/](https://github.com/bem/bem-bl/tree/master/blocks-common/i-bem/bem/techs)
