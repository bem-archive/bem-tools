# Кастомизация сборки

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

## Примеры конфигурационных файлов для типовых задач

### Сборка статического html, css, js, bemhtml шаблонов из bemjson для уровня страниц pages. Подключаются уровень переопределения блоков blocks, а так же blocks-common и blocks-desktop из bem-bl

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


### Сборка css, js, bemhtml шаблонов из файлов декларации (bemdecl) для уровня страниц pages. Подключаются уровень переопределения блоков blocks, а также blocks-common и blocks-desktop из bem-bl

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

### Сборка тезнологий css, bemhtml и локализационной технологии js, из файлов декларации (bemdecl) для уровня страниц pages.  Подключаются уровень переопределения блоков `blocks`, а также `blocks-common` и `blocks-desktop` из `bem-bl`.

```js
// pages/.bem/level.js

var BEM = require('bem'),
    PATH = require('path'),

    BEMBL_TECHS_PATH = '../../bem-bl/blocks-common/i-bem/bem/techs/';

exports.getTechs = function() {

    return {
        'bemdecl.js': 'bemdecl.js',
        'deps.js': 'deps.js',
        'js': 'js-i',
        'i18n': PATH.join(BEMBL_TECHS_PATH, 'i18n.js'),
        'i18n.js': PATH.join(BEMBL_TECHS_PATH, 'i18n.js.js'),
        'css': 'css',
        'bemhtml.js': PATH.join(BEMBL_TECHS_PATH, 'bemhtml.js')
    };

};

exports.getConfig = function() {

    return BEM.util.extend({}, this.__base() || {}, {

        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../blocks'
        ])

    });

};
```

```js
// .bem/make.js

MAKE.decl('Arch', {

    getLibraries: function() {

        return {
            'bem-bl': {
                type: 'git',
                url: 'git://github.com/bem/bem-bl.git',
                treeish: '0.3'
            }
        };

    }

});


MAKE.decl('BundleNode', {

    getTechs: function() {

        return [
            'bemdecl.js',
            'deps.js',
            'i18n',
            'bemhtml',
            'i18n.js',
            'css'
        ];

    },

    'create-i18n.js-optimizer-node': function(tech, sourceNode, bundleNode) {

        return this.createBorschikOptimizerNode('js', sourceNode, bundleNode);

    }

});
```

### Уровни переопределения

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

### Бандлы и страницы

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

### Сборка merged (раньше так же назывался common) бандла
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

## Production и Development сборка статики
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
