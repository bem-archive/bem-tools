# БЭМ-инструменты
Работа с файлами, написанными по [БЭМ-методу](http://bem.github.com/bem-method/pages/beginning/beginning.en.html).

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

 * Для установки самой последней версии [bem-tools](https://github.com/bem/bem-tools) воспользуйтесь командой

        sudo npm -g install bem@unstable

### bem-bl

Если вы планируете использовать `bem` вместе с библиотекой блоков
[bem-bl](https://github.com/bem/bem-bl), установите так же
[xjst](https://github.com/veged/xjst) и [ometajs](https://github.com/veged/ometajs).

    sudo npm -g install xjst ometajs

## Использование
Всю информацию о параметрах использования можно получить с помощью `bem --help`.
Для информации о конкретной команде и подкомманде: `bem COMMAND --help` и `bem COMMAND SUBCOMMAND --help`.

### Shell completion

#### bash

Если вы используете `bash` и у вас установлен пакет `bash-completion`, выполните следующую команду и перелогиньтесь:

    bem completion > /path/to/etc/bash_completion.d/bem

Если вы не используете `bash-completion`, можете добавить вывод `bem completion` себе в `.bashrc`:

    bem completion >> ~/.bashrc

#### zsh

Если вы используете `zsh`, можете добавить вывод `bem completion` себе в `.zshrc`, после чего перелогиньтесь:

    bem completion >> ~/.zshrc

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

Пример настройки ссылок на модули технологий (уровень `blocks-desktop`
библиотеки блоков `bem-bl`):

    https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

###### Создание уровня переопределения blocks в текущей директории:

    bem create level blocks

###### Создание уровня для страниц

В терминах `bem-tools` страницы тоже блоки, директория со страницами
является уровнем переопределения. Создать такую директорию можно так:

    bem create level pages

###### Создание уровня переопределения на основе существующего

Команда `bem create level` позволяет использовать существующий уровень переопределения
в качестве прототипа для создаваемого уровня.

    bem create level --level bem-bl/blocks-desktop blocks

##### Блок

Блок -- это набор файлов -- реализаций блока в различных технологиях.

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

###### Создание элемента блока

Создание элемента `elem` для блока `b-my-block`

    bem create elem -b b-my-block elem

###### Создание модификатора блока или элемента

Создание модификатора `mod` для блока `b-my-block`

    bem create mod -b b-my-block mod

Создание модификатора `mod` в значении `val` для блока `b-my-block`

    bem create mod -b b-my-block mod -v val

Создание модификатора `mod` для элемента `elem` блока `b-my-block`

    bem create mod -b b-my-block -e elem mod

Создание модификатора `mod` в значении `val` для элемента `elem` блока `b-my-block`

    bem create mod -b b-my-block -e elem mod -v val

###### Создание произвольной БЭМ сущности используя только команду `bem create`

При момощи команды `bem create` можно создавать произвольные БЭМ сущности или даже наборы сущностей.

Создание блоков `b-block1` и `b-block2`

    bem create -b b-block1 -b b-block2

Создание элементов `elem1` и `elem2` для блока `b-block`

    bem create -b b-block -e elem1 -e elem2

Создание модификатора `mod` блока `b-block`

    bem create -b b-block -m mod

Создание модификатор `mod` блока `b-block` в значениях `val1` и `val2`

    bem create -b b-block -m mod -v val1 -v val2

Создание модификатора `mod` элемента `elem` блока `b-block`

    bem create -b b-block -e elem -m mod

Создание модификатора `mod` в значениях `val1` и `val2` для элемента `elem` блока `b-block`

    bem create -b b-block -e elem -m mod -v val1 -v val2

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

#### bem make

`bem make` собирает проект

 * подключает библиотеки блоков
 * выполняет сборку в уровнях переопределения
 * выполняет сборку бандлов
   * собирает шаблоны (bemhtml)
   * собирает html из bemjson.js
   * собирает статические файлы (js, css)
   * раскрывает @import в css файлах (borschik)
   * раскрывает borschik:link:include в js файлах (borschik)
   * TODO: сжимает css файлы при помощи csso
   * TODO: сжимает js файлы при помощи uglifyjs

##### Конфигурирование сборки

###### Библиотеки блоков

TODO: По умолчанию библиотеки блоков не подключаются. Чтобы подключить нужные библиотеки блоков, добавьте
в `.bem/make.js` следующий код:

```js
MAKE.decl('Arch', {
    getLibraries: function() {

        return {
            'bem-bl': {
                type: 'git',
                url: 'git://github.com/bem/bem-bl.git'
            }
        };
    }
});
```

или

```js
MAKE.decl('Arch', {
    libraries: {
        'bem-bl': {
            type: 'git',
            url: 'git://github.com/bem/bem-bl.git'
        }
    }
});
```

Что по сути одно и то же, но второй вариант немного короче. Здесь:
 * MAKE.decl() - метод-хелпер, который позволяет переопределять стандартные классы bem tools, тем самым меняя функциональность.
 * 'Arch' - имя класса, который мы хотим переопределить. Arch отвечает за построение начального дерева сборки.
 * getLibraries (libraries) - метод (свойство) класса Arch, который возращает (содержит) ассоциативный массив подключаемых библиотек.
 * 'bem-bl' название библиотеки и директории, в которой она будет лежать. Допустимы имена вида 'mylibraries/bem-bl' - тогда чекаут библиотеки произойдет в директорию [корень проекта]/mylibraries/bem-bl.
 * type - указывает способ подключения. В примере используется значение git, означающее что библиотеку нужно взять из git репозитория. Возможные значение: 'git', 'svn', 'symlink'. svn работает аналогично git, но с svn репозиторием. symlink - создает символическую ссылку в собираемом проекте на директорию с контентом библиотеки на файловой системе. Путь к библиотеке указывается через свойство relative.
 * url - URL к svn/git репозиторию

###### Уровни переопределения

По умолчанию уровнями переопределения считаются все директории `blocks*` в корне проекта. Чтобы это изменить,
добавьте в `.bem/make.js` следующий код:

```js
MAKE.decl('Arch', {

});
```

###### Бандлы и страницы

По умолчанию уровнями бандлов считаются все директории `pages*` и `bundles*` в корне проекта. Чтобы это изменить,
добавьте в `.bem/make.js` следующий код:

```js
MAKE.decl('', {

    // ...

});
```

Для каждого бандла по умолчанию собираются следующие конечные файлы:

 * `.bemhtml.js`
 * `.html`
 * `.css`
 * `.ie.css`
 * `.js`
 * TODO: `_*.css`
 * TODO: `_*.ie.css`
 * TODO: `_*.js`

и промежуточные:

 * `.bemdecl.js`
 * `.deps.js`
 * `.deps.js.deps.js`
 * `.bemhtml.js.meta.js`
 * `.js.meta.js`
 * `.css.meta.js`
 * `.ie.css.meta.js`

Исходным файлом считается файл `.bemjson.js`.

Чтобы добавить в перечень собираемых файлов другие, добавьте в `.bem/make.js` следующий код:

```js
MAKE.decl('', {

   // ...

});
```

Чтобы изменить правила сборки какого-либо файла, например, если вам нужно собирать `.css` из `.sass`,
добавьте в `.bem/make.js` следующий код:

```js
MAKE.decl('', {

   // ...

});
```

#### bem server

`bem server` запускает веб сервер разработчика, который делает доступными по http протоколу статические файлы,
динамичесие html страницы, получаемые из BEMJSON и BEMHTML файлов на лету, а так же пропускает через borschik css и js
файлы.

По умолчанию корневым каталогом веб сервера считается текущая директория. Вы можете указать нужный каталог с помощью
ключа --project (-r). Таким образом, если в корне есть файл pages/about/main.css, то он будет доступен из браузера
по адресу http://localhost:8080/pages/about/main.css.

TCP порт по умолчанию, который слушает сервер - 8080. Вы можете указать другой порт, используя ключ --port (-p).

Если сервер получит запрос на файл типа *.html, то он вернет браузеру результат применения BEMHTML файла (*.bemhtml.js)
к BEMJSON файлу (*.bemjson.js) если они существуют. В противном случае сервер вернет содержимое самого *.html.

Когда запрашиваемый URL соответствует директории, сервер проверит есть ли в ней index.html или index.bemhtml.js и
index.bemjson.js и вернет html или результат работы шаблона. Если файлов нет, браузер получит листинг файлов в директории.

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

### Использование через API

В версии 0.2.0 появилась возможность использовать команды `bem-tools` через API.

Модуль `bem` экспортирует объект основной команды, у которого есть свойство `api`.
Использовать его можно так:

```js
var Q = require('q'),
    BEM = require('bem').api,

    techs = ['css', 'js'],
    blocks = ['b-block1', 'b-block2'];

Q.when(BEM.create.block({ forceTech: techs }, { names: blocks }), function() {
    console.log('Create blocks: %s', blocks.join(', '));
});
```

Как видно из примера, можно обращаться ко всем командам `bem-tools`, в том числе вложенным.

Команды принимают два аргумента:

 * **Object** `opts` опции команды
 * **Object** `args` аргументы команды

Возвращают объект типа `Q.promise`.

#### BEM.create

Команды для создания БЭМ-сущностей.

##### BEM.create.level()

Создание уровня переопределения.

###### Опции

 * **String** `outputDir` директория для записи результата, по умолчанию текущая
 * **String** `level` «прототип» уровня переопределения
 * **Boolean** `force` принудительно создать уровень, даже если он существует

###### Аргументы

 * **Array** `names` имена создаваемых уровней переопределения

###### Пример использования

```js
var PATH = require('path'),
    Q = require('q'),
    BEM = require('bem').api,

    outputDir = PATH.join(__dirname, 'levels'),
    levels = ['blocks-common', 'blocks-desktop'];

Q.when(BEM.create.level({ outputDir: outputDir }, { names: levels }), function() {
    console.log('Create levels %s at %s', levels.join(', '), outputDir);
});
```

##### BEM.create.block()

Создание блока.

###### Опции

 * **String** `levelDir` директория уровня переопределения, по умолчанию текущая
 * **Array** `addTech` добавить перечисленные технологии к технологиям для уровня по умолчанию
 * **Array** `forceTech` использовать только указанные технологии
 * **Array** `noTech` исключить указанные технологии из использования
 * **Boolean** `force` принудительно создавать файлы блока

###### Аргументы

 * **Array** `names` имена создаваемых блоков

###### Пример использования

```js
var Q = require('q'),
    BEM = require('bem').api,

    addTechs = ['bemhtml'],
    blocks = ['b-header'];

Q.when(BEM.create.block({ addTech: addTechs }, { names: blocks }), function() {
    console.log('Create blocks: %s', blocks.join(', '));
});
```

##### BEM.create.elem()

Создание элемента.

###### Опции

 * **String** `levelDir` директория уровня переопределения, по умолчанию текущая
 * **String** `blockName` имя блока (обязательный параметр)
 * **Array** `addTech` добавить перечисленные технологии к технологиям для уровня по умолчанию
 * **Array** `forceTech` использовать только указанные технологии
 * **Array** `noTech` исключить указанные технологии из использования
 * **Boolean** `force` принудительно создавать файлы элемента

###### Аргументы

 * **Array** `names` имена создаваемых элементов

###### Пример использования

```js
var Q = require('q'),
    BEM = require('bem').api,

    addTechs = ['bemhtml', 'title.txt'],
    block = 'b-header',
    elems = ['logo'];

Q.when(BEM.create.elem({ addTech: addTechs, blockName: block }, { names: elems }), function() {
    console.log('Create elems %s of block %s', elems.join(', '), block);
});
```

##### BEM.create.mod()

Создание модификатора блока или иодификатора элемента.

###### Опции

 * **String** `levelDir` директория уровня переопределения, по умолчанию текущая
 * **String** `blockName` имя блока (обязательный параметр)
 * **String** `elemName` имя элемента
 * **Array** `modVal` значения модификатора
 * **Array** `addTech` добавить перечисленные технологии к технологиям для уровня по умолчанию
 * **Array** `forceTech` использовать только указанные технологии
 * **Array** `noTech` исключить указанные технологии из использования
 * **Boolean** `force` принудительно создавать файлы модификатора

###### Аргументы

 * **Array** `names` имена создаваемых модификаторов

###### Пример использования

```js
var Q = require('q'),
    BEM = require('bem').api,

    forceTechs = ['css'],
    block = 'b-header',
    elem = 'logo',
    mods = ['lang'],
    vals = ['ru', 'en'];

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, modVal: vals }, { names: mods }), function() {
    console.log('Create mod %s of block %s with vals %s', elems.join(', '), block, vals.join(', '));
});

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, elemName: elem, modVal: vals }, { names: elems }), function() {
    console.log('Create mod %s of elem %s of block %s with vals %s', elems.join(', '), elem, block, vals.join(', '));
});
```

#### BEM.build()

Сборка файлов.

###### Опции

 * **String** `outputDir` директория для записи результата, по умолчанию текущая
 * **String** `outputName` имя (префикс имени файла) для записи результата
 * **String** `declaration` имя файла декларации использования (обязательный параметр)
 * **Array** `level` уровень переопределения
 * **Array** `tech` собирать файлы указанных технологий

###### Пример использования

```js
var Q = require('q'),
    BEM = require('bem').api,

    decl = 'page.deps.js',
    outputDir = 'build',
    outputName = 'page',
    levels = ['blocks-common', 'blocks-desktop'],
    techs = ['css', 'js'];

Q.when(
    BEM.build({
        outputDir: outputDir,
        outputName: outputName,
        declaration: decl,
        level: levels,
        tech: techs
    }),
    function() {
        console.log('Finished build of techs %s for levels %s. Result in %s/%s.* files.',
            techs.join(', '), levels.join(', '), outputDir, outputName);
    }
);
```

#### BEM.decl

Команды для работы с декларациями использования.

##### BEM.decl.merge()

Объединение деклараций.

###### Опции

 * **String** `output` файл для записи результата, по умолчанию STDOUT
 * **Array** `declaration` имя файла декларации использования (обязательный параметр)

##### BEM.decl.subtract()

Вычитание деклараций.

###### Опции

 * **String** `output` файл для записи результата, по умолчанию STDOUT
 * **Array** `declaration` имя файла декларации использования (обязательный параметр)
