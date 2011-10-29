# БЭМ-инструменты
Работа с файлами, написанными по [БЭМ-методу](http://bem.github.com/bem-method/html/all.ru.html).

## Установка
Вам потребуется [NodeJS 0.4.x](http://nodejs.org/) или выше и [npm 1.x](http://npmjs.org/).
После этого достаточно `npm -g install bem`.

 * Установить [nodejs](http://nodejs.org)

        https://github.com/joyent/node/wiki/Installation

 * Установить [npm](http://npmjs.org)

        curl http://npmjs.org/install.sh | sudo sh

 * После установки сконфигурируйте `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    или

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

 * Установить [bem-tools](https://github.com/bem/bem-tools)

        sudo npm -g install bem

### bem-bl

Если вы планируете использовать `bem` вместе с библиотекой блоков
[bem-bl](https://github.com/bem/bem-bl), установите так же
[xjst](https://github.com/veged/xjst) и [ometajs](https://github.com/veged/ometajs).

    sudo npm -g xjst ometajs

## Использование
Всю информацию о параметрах использования можно получить с помощью `bem --help`.
Для информации о конкретной команде и подкомманде: `bem COMMAND --help` и `bem COMMAND SUBCOMMAND --help`.

### Консольные команды
#### bem create

С помошью `bem create` можно создавать сущности:

 * уровни переопределения
 * блоки
 * элементы
 * модификаторы

##### Уровень переопределения

Уровень переопределения -- это директория, в которой хранятся реализации
блоков и служебная директория `.bem`.

В `.bem` хранятся настройки этого уровня переопределения:

 * соглашения об именовании
 * ссылки на модули технологий

Пример настройки ссылок на модули технологий (уровень blocks-desktop
библиотеки блоков bem-bl):

    https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

###### Создание уровня переопределения blocks в текущей директории:

    bem create level blocks

###### Создание уровня для страницы

В терминах `bem-tools` страницы тоже блоки, директория со страницами
является уровнем переопределения. Создать такую директорию можно так:

    bem create level pages

###### Создание уровня переопределения на основе существующего

Команда `bem create level` позволяет использовать существующий уровень переопределения
в качестве прототипа для создаваемого уровня.

    bem create level -l bem-bl/blocks-desktop blocks

##### Блок

Блок -- это директория с файлами реализаций в различных технологиях.

###### Создание блока

    bem create block b-my-block

По умолчанию блок создаётся с набором файлов для всех технологий по-умолчанию (`bemhtml`, `css`, `js`).

###### Создание блока в определённой технологии

Использование флагов -t (-T) позволяет создавать файлы блока нужных технологий:

    bem create block -t deps.js b-my-block
        // Создаст реализацию в технологии deps.js помимо дефолтных

    bem create block -T css b-my-block
        // Создаст только технологию CSS для блока

    bem create block -T bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js b-my-block
        // Флаг -T удобно использовать, если нужно добавить новую технологию для уже существующего блока

В качестве значения флага может быть указано название технологии (например, `css`)
или путь до модуля технологии.

Названия технологий могут быть указаны в файле `.bem/level.js` уровня переопределения.
Например, https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

Примеры реализации модулей технологий можно увидеть в репозитории:

    https://github.com/bem/bem-tools/tree/nodejs/lib/techs

#### bem build

С помощью команды `bem build` можно собирать файлы страниц для различных технологий,
основываясь на декларации страницы.

##### Создание файла bemdecl.js по bemjson-декларации страницы

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemjson.js -t bemdecl.js \
        -o pages/index -n index

Значением флага -t может быть как название технологии, так и полный путь до модуля
технологии. В этом модуле указано, как именно по декларации собирается конечный файл.

Например, модуль для `deps.js`: https://github.com/bem/bem-tools/blob/nodejs/lib/techs/deps.js.js

##### Создание файла deps.js по bemdecl.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemdecl.js -t deps.js \
        -o pages/index -n index

###### Создание js и css файлов страниц по deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js -t css \
        -o pages/index -n index

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js -t js \
        -o pages/index -n index

###### Создание сборки с шаблонами bemhtml.js по файлу deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemhtml.js \
        -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

Пример построения страниц при помощи `bem build` есть в демонстрационном
проекте на блоках `bem-bl`: https://github.com/toivonen/bem-bl-test/blob/master/GNUmakefile

#### bem decl

`bem decl` позволяет работать с файлами деклараций, а именно:

 * объединять несколько деклараций в одну
 * «вычитать» декларации, то есть получать разницу между ними

Для всех подкоманд `bem decl` в качестве входных деклараций (ключ `-d`) могут выступать
файлы как в формате `bemdecl.json`, так и файлы в формате `deps.js`.

На выходе (ключ `-o`) всегда получается файл в формате `deps.js`.

##### bem decl merge

`bem decl merge` объединяет несколько деклараций в одну. Она бывает полезна в ситуациях,
когда, например, вам нужно собрать общую сборку для нескольких страниц.

###### Создание декларации для всех страниц

    bem decl merge \
        -d pages/index/index.deps.js \
        -d pages/about/about.deps.js \
        -d pages/search/search.deps.js \
        -o pages/common/common.deps.js

##### bem decl subtract

`bem decl subtract` «вычитает» из первой указанной декларации все остальные. Она полезна
в ситуациях, когда, например, вам нужно сделать бандл, которые будет догружатся на страницу
по требованию.

###### Создание декларации для подгружаемого по требованию «тяжёлого» блока

    bem decl subtract \
        -d bundles/heavy-block/heavy-block.deps.js \
        -d pages/common/common.deps.js \
        -o bundles/heavy-block/heavy-block.bundle.js

### Модули технологий

#### API

Смотрите документацию в исходном файле [lib/tech.js](https://github.com/bem/bem-tools/blob/nodejs/lib/tech.js).

#### Создание модуля технологии

Существует три способа написания модулей технологии: очень простой, простой и для продвинутых.

Во всех описанных ниже способах из методов можно обратиться к объекту технологии через `this`,
а через `this.__base(...)` можно вызвать метод одного из базовых классов. Это является следствием
использование модуля [inherit](https://github.com/dfilatov/node-inherit) для органиазации
наследования.

##### Очень простой способ
Способ заключается в том, что вы создаёте обычный CommonJS модуль, из
которого экспортируете несколько функций, которые перекроют методы базового
класса `Tech` из модуля [lib/tech.js](https://github.com/bem/bem-tools/blob/nodejs/lib/tech.js).

##### Простой способ
В простом способе к экспортируемым функциям добавляется переменная `baseTechPath`, в которой
содержится абсолютный путь до расширяемого модуля технологии. По умолчанию расширяется базовый
класс `Tech`.

Например:

```js

exports.baseTechPath = require.resolve('bem/lib/techs/css');

```

##### Для продвинутых
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
написанных в простом стиле, воспользуйтесь функцией `getTechClass()` модуля `bem/lib/tech`
для получения класса этой технологии.

```js
var INHERIT = require('inherit'),
    getTechClass = require('bem/lib/tech').getTechClass,
    BaseTech = getTechClass(require.resolve('path/to/tech/module'));

exports.Tech = INHERIT(BaseTech, {

    // your overrides go here

});
```

##### Примеры модулей технологий

 * [bem-tools/lib/techs/](https://github.com/bem/bem-tools/tree/nodejs/lib/techs)
 * [bem-bl/blocks-common/i-bem/bem/techs/](https://github.com/bem/bem-bl/tree/master/blocks-common/i-bem/bem/techs)
