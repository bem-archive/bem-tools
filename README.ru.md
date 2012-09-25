# БЭМ-инструменты
Работа с файлами, написанными по [БЭМ-методу](http://bem.github.com/bem-method/pages/beginning/beginning.en.html).

## Установка
Вам потребуется [NodeJS 0.6+](http://nodejs.org/) или выше и [npm 1.x](http://npmjs.org/).
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
[xjst](https://github.com/veged/xjst) и [ometajs](https://github.com/veged/ometa-js).

    sudo npm -g install xjst ometajs

## Использование
Всю информацию о параметрах использования можно получить с помощью `bem --help`.
Для информации о конкретной команде и подкомманде: `bem COMMAND --help` и `bem COMMAND SUBCOMMAND --help`.

### Shell completion

#### bash

Если вы используете `bash` и у вас установлен пакет `bash-completion`, выполните следующую команду и перелогиньтесь:

    bem completion > /path/to/etc/bash_completion.d/bem

Если вы не используете `bash-completion`, можете добавить вывод `bem completion` себе в `.bashrc`, а затем перезагрузить:

    bem completion >> ~/.bashrc
    source ~/.bashrc

#### zsh

Если вы используете `zsh`, можете добавить вывод `bem completion` себе в `.zshrc` и перезагрузите его:

    bem completion >> ~/.zshrc
    source ~/.zshrc

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

    https://github.com/bem/bem-tools/tree/master/lib/techs

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

Например, модуль для `deps.js`: https://github.com/bem/bem-tools/blob/master/lib/techs/deps.js.js

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

##### bem make
В команде `make` реализована сборка БЭМ проектов. Узнать больше о системах сборки можно из доклада Сергея Белова http://clubs.ya.ru/yasubbotnik/replies.xml?item_no=406.

`bem make` собирает проект

 * подключает библиотеки блоков
 * выполняет сборку в уровнях переопределения
 * выполняет сборку бандлов
 * собирает шаблоны (`bemhtml`)
 * собирает `html` из `bemjson.js`
 * собирает статические файлы (`js`, `css`)
 * раскрывает `@import` в `css` файлах (`borschik`)
 * раскрывает `borschik:link:include` в `js` файлах (`borschik`)
 * сжимает `css` файлы при помощи `csso`
 * сжимает `js` файлы при помощи `uglifyjs`

##### bem server

`bem server` веб-сервер разработчика, который делает доступными по http протоколу файлы, собранные на лету bem make. bem server может быть вам полезен для разработки статических страниц по bem методу. Вы просто вносите изменения в файлы проекта, обновляете страницу в браузере и видите новый результат — файлы, которые затронули ваши изменения, будут автоматически пересобраны. Если же в вашем проекте нет статических страниц, вы можете настроить бэкенд и окружение таким образом, чтобы он обращался к bem server за файлами стилей и скриптов. bem server позволяет общаться с ним через привычный TCP socket или через UNIX domain socket.

По умолчанию корневым каталогом веб-сервера считается текущая директория. Вы можете указать нужный каталог с помощью
ключа --project (-r). Таким образом, если в корне есть файл pages/about/main.css, то он будет доступен из браузера
по адресу http://localhost:8080/pages/about/main.css.

TCP порт по умолчанию, который слушает сервер - 8080. Вы можете указать другой порт, используя ключ --port (-p).

Когда запрашиваемый URL соответствует директории, сервер проверит, возможно ли собрать для запрошенной директории файл
`index.html`. Если это так, то страница будет собрана и отдана браузеру. Иначе браузер получит листинг файлов в директории.

#### Конфигурирование сборки

В системе сборки предусмотрено некоторое поведение по умолчанию. С помощью файлов конфигурации можно как немного изменить
его, так и кардинально переделать. Необходимым минимумом для работы bem make являются конфиги `.bem/level.js` на уровнях
переопределения с функцией `getTechs()`, возвращающей массив технологий, задействованных на уровне. И функцией `getConfig()`:

```js
var extend = require('bem/lib/util').extend;

exports.getTechs = function() {
    return {
        'bemjson.js': '',
        'js': 'js-i',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js',
        'priv.js': '../../.bem/techs/priv.js',
        'html': '../../bem-bl/blocks-common/i-bem/bem/techs/html'
    };
};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

`getTechs()` возвращает массив подключаемых технологий: ключ (например `'bemjson.js'`, `'js'`, `'bemhtml.js'`) указывает 
имя, под котором технологию можно будет использовать, значение (`''`, `'js-i'`, `'../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'`) -
где взять сам файл технологии. В качестве этого значения может быть указан абсолютный или относительный путь к файлу, 
пустая строка или просто имя файла. В последнем случае подразумевается, что технология стандартная (входит в состав 
bem-tools) и ее поиск будет произведен в директории `[bem]/lib/techs`.

Функция `getConfig()` возвращает объект со свойстовом `bundleBuildLevels`, содержащим массив подключаемых уровней блоков.

Второй (опциональный) компонент конфигурации - это файл `.bem/make.js` в корне проекта. Основой сборки является граф 
узлов, каждый из которых отвечает за выполнение своей части всего процесса. В `make.js` можно изменять поведение узлов 
и построение дерева. Существует несколько типов стандартных узлов:
 * `Node` - базовый узел, от которого наследуются все остальные
 * `LibraryNode` - отвечает за подключение внешних библиотек
 * `LevelNode` - анализирует содержимое уровня переопределения и достраивает дерево для сборки этого уровня
 * `BundlesLevelNode` - доопределяет `LevelNode` для сборки уровней бандлов
 * `BundleNode` - достраивает дерево для сборки бандла
 * `MergedBundleNode` - отвечает за сборку merged бандла (называемого так же common)
 * `BorschikNode` - прогоняет файлы через утилиту `borschik`, которая разворачивает инклюды
 * `Arch` - строит исходное дерево, состоящее главным образом из узлов `LibraryNode`, `BundlesLevelNode`, `LevelNode`

Чтобы сконфигурировать сборку своего проекта, необходимо переопределить поведение тех или иных узлов. Это делается в
конфигурационном файле `.bem/make.js` в корне проекта с помощью хелпера `MAKE.decl()`. Первым аргументом ему передается 
название узла, который будет переопределен. Вторым - объект с переопределяющими методами.

```js
MAKE.decl('BundleNode', {

});
```

У узлов есть несколько основных методов, отвечающих за процесс сборки:
 * `isValid()` - проверяет, есть ли необходимость в запуске сборки данного узла. Если артефакты сборки узла уже были получены ранее и узлы, от которых зависит данный, не пересобирались в текущей сборке - то будет считаться, что узел не нужно пересобирать. Иными словами, если после первой сборки вы поменяли один файл, то при последующей сборке будут пересобраны только зависящие от этого файла узлы. Для остальных isValid вернет true и они не будут пересобираться.
 * `make()` - осуществляет непосредственно сборку узла.
 * `run()` - точка входа в узел. В реализации по умолчанию выполняет метод `isValid()` и в случае если он возвращает `false`, запускает `make()`.
 * `clean()` - удаляет артефакты сборки данного узла.

##### Примеры конфигурационных файлов для типовых задач

###### Сборка статического html, css, js, bemhtml шаблонов из bemjson для уровня страниц pages. Подключаются уровень переопределения блоков blocks, а так же blocks-common и blocks-desktop из bem-bl

`pages/.bem/level.js`
```js
var extend = require('bem/lib/util').extend;

exports.getTechs = function() {

    return {
        'bemjson.js': '',
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'js': 'js-i',
        'css': 'css',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js',
        'html': '../../bem-bl/blocks-common/i-bem/bem/techs/html.js'
    };

};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

`.bem/make.js`
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

MAKE.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemjson.js',
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'js',
            'html'
        ];
    }

});
```


###### Сборка css, js, bemhtml шаблонов из файлов декларации (bemdecl) для уровня страниц pages. Подключаются уровень переопределения блоков blocks, а также blocks-common и blocks-desktop из bem-bl

`pages/.bem/level.js`
```js
var extend = require('bem/lib/util').extend;

exports.getTechs = function() {

    return {
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'js': 'js-i',
        'css': 'css',
        'bemhtml.js': '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'
    };

};

exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

`.bem/make.js`
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

MAKE.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'js'
        ];
    }

});
```

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


Здесь:
 * `MAKE.decl()` - метод-хелпер, который позволяет переопределять стандартные классы bem tools, тем самым меняя функциональность.
 * `'Arch'` - имя класса, который мы хотим переопределить. `Arch` отвечает за построение начального дерева сборки.
 * `getLibraries` - метод класса Arch, который возвращает ассоциативный массив подключаемых библиотек.
 * `'bem-bl'` — название библиотеки и директории, в которой она будет лежать. Допустимы имена вида 'mylibraries/bem-bl' -
тогда чекаут библиотеки произойдет в директорию `[корень проекта]/mylibraries/bem-bl`.
 * `type` - указывает способ подключения. В примере используется значение `git`, означающее, что библиотеку нужно взять
из git репозитория. Возможные значение: `'git'`, `'svn'`, `'symlink'`. `svn` работает аналогично `git`, но с `svn` репозиторием.
`symlink` - создает символическую ссылку в собираемом проекте на директорию с контентом библиотеки на файловой системе.
Путь к библиотеке указывается через свойство `relative`.
 * `url` - URL к svn/git репозиторию

Или можно воспользоваться шоткатом:

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

###### Уровни переопределения

По умолчанию уровнями переопределения считаются все директории `blocks*` в корне проекта. Чтобы это изменить,
добавьте в `.bem/make.js` следующий код:

```js
MAKE.decl('Arch', {
    blocksLevelsRegexp:  /регулярное выражение/,
});
```

Регулярное выражение используется для фильтрации директорий в корне проекта. Директории, которые попадают под выражение,
будут считаться уровнями переопределения и для них будут созданы соответствующие узлы.

Если изменения маски для выбора уровней не достаточно и нужна более сложная логика, нужно переопределить метод 
`createBlocksLevelsNodes()`:

```js
MAKE.decl('Arch', {
    createBlocksLevelsNodes: function(parent, children) {
        // Создаем экземпляр LevelNode
        var node1 = new LevelNode(...);
        // Добавляем созданный узел в дерево
        this.arch.setNode(node1, parent, children);

        var node2 = new LevelNode(...);
        this.arch.setNode(node2, parent, children);

        // Возвращаем массив из идентификаторов созданных узлов
        return [node1.getId(), node2.getId()];
    }
});
```

###### Бандлы и страницы

По умолчанию уровнями бандлов считаются все директории `pages*` и `bundles*` в корне проекта. Изменить это можно по 
аналогии с конфигурацией уровней переопределения.

```js
MAKE.decl('Arch', {
    bundlesLevelsRegexp: /регулярное выражение/,
});
```

И для большего контроля:

```js
MAKE.decl('Arch', {

    getBundlesLevels: function() {
        return [
            'pages-desktop',
            'pages-touch',
            'bundles/common'
        ];
    }

});
```


Для каждого бандла по умолчанию собираются следующие конечные файлы:

 * `.bemhtml.js`
 * `.html`
 * `.css`
 * `.ie.css`
 * `.js`
 * `_*.css`
 * `_*.ie.css`
 * `_*.js`

и промежуточные:

 * `.bemdecl.js`
 * `.deps.js`
 * `.deps.js.deps.js`
 * `.bemhtml.js.meta.js`
 * `.js.meta.js`
 * `.css.meta.js`
 * `.ie.css.meta.js`

По умолчанию исходным файлом считается файл `.bemjson.js`. Если его нет на диске, исходным станет `.bemdecl.js`. Если его
тоже нет - `.deps.js`. В случаях, когда нет `.bemjson.js` статический html собран не будет.

Чтобы изменить перечень собираемых файлов, добавьте в `.bem/make.js` следующий код:

```js
MAKE.decl('BundleNode', {

    getTechs: function() {
        return [
            'bemdecl.js',
            'deps.js',
            'bemhtml.js',
            'css',
            'js',
            'priv.js'
        ];
    }
});
```

Если вы хотите дополнить стандартный набор своими:

```js
MAKE.decl('BundleNode', {

    getTechs: function() {
        return this.__base().concat(['priv.js', 'pub.js']);
    }
});
```

`this.__base()` вызывает базовый метод, который вернет нам массив технологий по умолчанию. С помощью `concat()` мы добавляем
в него технологии `priv.js` и `pub.js` и возвращаем его.

Рекомендуется возвращать список явно, т.е. переопределять `getTechs()` как в первом примере, чтобы избежать побочных
эффектов, если вдруг поменяется список технологий по умолчанию.

**ВАЖНО:** Технологии в массиве должны идти в порядке зависимости друг от друга. То есть технология B, зависящая от
технологии A, должна быть в списке **ниже** A. Также в этом списке должны быть все технологии, в том числе исходный файл,
например `bemjson.js`.

###### Сборка merged (раньше так же назывался common) бандла
Merged бандл — это бандл, который объединяет в себе декларации всех бандлов уровня. Соответственно по такой объединенной
декларации собираются и объединенные конечные файлы. Например, css будет включать в себе все стили, используемые всеми бандлами.

Merged бандл может быть полезен, например, если вы хотите использовать общие файлы статики (js, css) для нескольких 
страниц проекта. Или при использовании технологии priv.js держать шаблоны страниц в одном файле.

Следующий код включит сборку merged бандла для всех уровней:

```js
MAKE.decl('BundlesLevelNode', {
    buildMergedBundle: function() {
        return true;
    }
});
```

Если merged бандл нужен только в выборочных уровнях, необходимо добавить условие (будем собирать merged только для уровня
`pages-desktop`):

```js
var PATH = require('path');

MAKE.decl('BundlesLevelNode', {
    buildMergedBundle: function() {
        if (this.getLevelPath() === 'pages-desktop') return true;

        return false;
    }
});
```

Метод `getLevelPath()` (есть у узлов-уровней и узлов-бандлов) возвращает относительный путь данного уровня или путь 
уровня данного бандла. С его помощью мы можем определить, нужно производить какие-либо действия для уровня или нет.

Изменить название merged банлда можно следующим образом:
```js
MAKE.decl('BundlesLevelNode', {

    mergedBundleName: function() {
        return 'mymergedbundle';
    }

});
```

##### Production и Development сборка статики
Переключая значение переменной окружения `YENV`, можно собирать production или development версии статических файлов.
В production режиме файлы прогоняются через утилиту borschik, которая создаст файл с префиксом `_`, в который будет 
включено содержимое всех подключаемых файлов. Например, если собирается `index.css`, в котором подключаются `blocks/block1.css`
и `blocks/block2.css`, то `borschik` создаст `_index.css` с контентом `block1.css` и `block2.css`. Кроме этого, `css` 
файлы оптимизируются утилитой `csso`, `js` файлы минимизируются через `uglifyjs`. В development режиме файлы прогоняются
только через `borschik`, оптимизация не производится.

Режимом по умолчанию является development. Установка `YENV` в значение production переключит его соответственно.

Значения переменных окружения можно выставлять в `.bem/make.js`, например

```js
process.env.YENV = 'production';
```

### Файлы конфигурации

#### Уровень переопределения (`.bem/level.js`)

На уровне переопределения должен быть файл конфигурации `.bem/level.js`, который содержит в себе мета-информацию
об устройстве уровня, а именно:

- правила маппинга БЭМ-сущностей в файловую систему
- технологии, определённые для уровня
- мета-информация для системы сборки

При создании уровня командой `bem create level` файл `.bem/level.js` создаётся пустым, что означает, что уровень —
«стандартный». Поведение стандартного уровня описано в классе `Level` в файле
(lib/level.js)[https://github.com/bem/bem-tools/blob/master/lib/level.js].

Перекрыть поведение уроня просто. Файл `.bem/level.js` (как и практически любой файл конфигурации) является CommonJS
модулем. `bem-tools` при обнаружении такого файла создаёт класс-наследник стандартного класса `Level`, используя экспорт
этого модуля в качестве расширения класса (внутри используется модуль [inherit](https://github.com/dfilatov/node-inherit)).

В примере ниже перекрывается метод `getTechs()`.

```js
exports.getTechs = function() {

    return {
        'bemjson.js': ''
        'css': 'path/to/my/css-tech-module.js'
    }

};
```

##### Наследование уровней

Чтобы не копировать код из одного конфига уровней в другой, вы можете выносить общие части в самостоятельные модули
и наследоваться от них. Таким образом можно выстаивать целые иерархии уровней.

Для задания базового уровня нужно экспортировать из модуля свойство `baseLevelPath`, например

```js
exports.baseLevelPath = require.resolve('path/to/base/level.js');
```

Уровни-наследники также можно создавать командой

    bem create level <your-level-name> --level path/to/base/level.js

##### Правила маппинга БЭМ-сущностей в файловую систему

По умолчанию на уровне переопределения используется следующая схема маппинга (на примере технологии `css`):

```
level/
    block/
        __elem/
            _mod/
                block__elem_mod_val.css
            block__elem.css
        _mod/
            block_mod_val.css
        block.css
```

Если вас не устраивает эта схема, вы можете задать свою. Для этого нужно перекрыть соответствующие `match*()` и `get*()`
методы в файле `.bem/level.js`.

##### Технологии, определённые для уровня

Для уровня переопределения можно задекларировать список используемых технологий. Для этого нужно экспортировать
функцию `getTechs()`, которая должна вернуть объект, в ключах которого лежат имена технологий, а в значениях:

- абсолютный путь до технологии — будет использоваться модуль, находящийся по этому пути;
- короткое имя технологии — будет использоваться реализация технологии с указанным именем из `bem-tools`;
- пустая строка — будет использоваться реализация технологии по умолчанию.

По умолчанию на уровне переопределения явно не определена ни одна из технологий. Если попытаться внутри таких уровней
использовать техологии по короткому имени, например `css`, `js` и другие, то будут использованы модули технологии
из состава `bem-tools`, если они существуют. Полный список таких технологий смотрите в [lib/techs](https://github.com/bem/bem-tools/tree/master/lib/techs).

Если попытаться использовать технологии, которые явно не задекларированы, и которых при этом не существуют
в `bem-tools` — будет использоваться реализация технологии по умолчанию
(см. [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js)).

Технологии, задекларированные на уровне используются:

- командой `bem create`
- командой `bem build`
- для интроспекции по файловой системе (см. метод `getLevelByIntrospection()` класса `Level`)
- в процессе сборки командами `bem make` и `bem build`

Мы рекомендуем явно декларировать все используемые технологии.

##### Мета-информация для системы сборки

Во время сборки проекта командами `bem make` и `bem server` для выполнения команды `bem build` нужно знание о том,
из каких уровней переопределения нужно собирать тот или иной бандл. Это знания необходимо отобразить в свойсте
`bundleBuildLevels` объекта, возвращаемого функцией `getConfig()`.

```js
exports.getConfig = function() {

    return extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            // your levels here
        ])

    });

};
```

### Модули технологий

#### API

Смотрите документацию в исходном файле [lib/tech.js](https://github.com/bem/bem-tools/blob/master/lib/tech.js).

#### Создание модуля технологии

Существует несколько способов написания модулей технологии.

Во всех описанных ниже способах из методов можно обратиться к объекту технологии через `this`,
а через `this.__base(...)` можно вызвать метод одного из базовых классов. К классу технологии
можно обратиться через `this.__class`. Всё это является следствием использование модуля
[inherit](https://github.com/dfilatov/node-inherit) для органиазации наследования.

##### Очень простой способ

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

##### Простой способ

В простом способе к экспортируемым функциям добавляется переменная `baseTechPath`, в которой
содержится абсолютный путь до расширяемого модуля технологии.

```js
var BEM = require('bem');

exports.baseTechPath = BEM.require.resolve('./techs/css');
```

Так же вы можете организовать контекстное наследование, использую переменную `baseTechName`.
В этом случае базовый класс будет выбран в зависимости от уровня переопределения, на котором
будет использован модуль технологии.

```js
exports.baseTechName = 'css';
```

В этом примере новая технология будет расширять технологию `css`, заданную на уровне переопределения
в файле `.bem/level.js`.

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

##### BEM.create()

Создание БЭМ сущностей: блоков, элементов, модификаторов или их значений.

###### Опции

 * **String** `level` директория уровня переопределения, по умолчанию текущая
 * **Array** `block` имя блока (обязательный параметр)
 * **Array** `elem` имя элемента
 * **Array** `mod` имя модификатора
 * **Array** `val` значение модификатора
 * **Array** `addTech` добавить перечисленные технологии к технологиям для уровня по умолчанию
 * **Array** `forceTech` использовать только указанные технологии
 * **Array** `noTech` исключить указанные технологии из использования
 * **Boolean** `force` принудительно создавать файлы модификатора

###### Пример использования

```js
var Q = require('q'),
    BEM = require('bem').api,

    forceTechs = ['css'],
    block = 'b-header',
    elem = 'logo',
    mods = ['lang'],
    vals = ['ru', 'en'];

Q.when(BEM.create({ forceTechs: forceTechs, block: block, mod: mods, val: vals }), function() {
    console.log('Create mod %s of block %s with vals %s', mods.join(', '), block, vals.join(', '));
});

Q.when(BEM.create({ forceTechs: forceTechs, block: block, elem: elem, mod: mods, val: vals }), function() {
    console.log('Create mod %s of elem %s of block %s with vals %s', mods.join(', '), elem, block, vals.join(', '));
});
```

##### BEM.create.block()

Создание блока.

###### Опции

 * **String** `level` директория уровня переопределения, по умолчанию текущая
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

 * **String** `level` директория уровня переопределения, по умолчанию текущая
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

Создание модификатора блока или модификатора элемента.

###### Опции

 * **String** `level` директория уровня переопределения, по умолчанию текущая
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
 * **Level** `outputLevel` объект уровня переопределения, на котором нужно создать файлы БЭМ сущности
 * **String** `block` название блока
 * **String** `elem` название элемента
 * **String** `mod` название модификатора
 * **String** `val` значение модификатора
 * **String** `declaration` имя файла декларации использования (обязательный параметр)
 * **Array** `level` уровень переопределения
 * **Array** `tech` собирать файлы указанных технологий

Вы можете использовать один из следующих вариантов для задания префикса для сохранения результата сборки:

 * `outputName` для задания полного пути-префикса
 * `outputDir` плюс `outputName` для задания пути для директории и префикса файлов (они будут склеены автоматически)
 * `outputLevel` плюс свойста, описывающие БЭМ сущность: `block`, `elem`, `mod` и `val` (путь-префикс будет построен
   автоматически на базе правил маппинга сущностей в файлы, заданных для уровня)

###### Пример использования

```js
var Q = require('q'),
    B = require('bem'),
    BEM = B.api,

    decl = 'page.deps.js',
    outputDir = 'build',
    outputName = 'page',
    levels = ['blocks-common', 'blocks-desktop'],
    techs = ['css', 'js'];

// используем outputDir и outputName
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

// используем outputLevel
var level = B.createLevel('path/to/level'),
    block = 'page';
Q.when(
    BEM.build({
        outputLevel: level,
        block: block
    }),
    function() {
        console.log('Finished build of techs %s for levels %s. Result in %s.* files.',
            techs.join(', '), levels.join(', '), level.getRelByObj({ block: block }));
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

## Участие в разработке

### Запуск автотестов

Для того, чтобы проверить правильность внесённых изменений, рекомендуем выполнить следующую команду в корневой директории и убедиться, что все тесты выполнились без ошибок:

    mocha

### Запуск автотестов с отчётом о покрытии кода автотестами

Для того, чтобы узнать о степени покрытия исходного кода автотестами, следует выполнить следующую команду:

    make test-cover

После этого открыть в браузере файл coverage.html. Красным цветом в отчёте будут помечены строки, которые ни разу не выполнялись во время работы тестов.
