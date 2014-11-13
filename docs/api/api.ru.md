# Использование через API

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

 * **Object** `opts` - опции команды
 * **Object** `args` - аргументы команды

Возвращают объект типа `Q.promise`.

## BEM.create

Команды для создания БЭМ-сущностей.

### BEM.create.level()

Создание уровня переопределения.

#### Опции

 * **String** `outputDir` - директория для записи результата, по умолчанию текущая;
 * **String** `level` - «прототип» уровня переопределения;
 * **Boolean** `force` - принудительно создать уровень, даже если он существует.

#### Аргументы

 * **Array** `names` - имена создаваемых уровней переопределения.

#### Пример использования

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

### BEM.create()

Создание БЭМ-сущностей: блоков, элементов, модификаторов или их значений.

#### Опции

 * **String** `level` - директория уровня переопределения, по умолчанию текущая;
 * **Array** `block` - имя блока (обязательный параметр)
 * **Array** `elem` - имя элемента;
 * **Array** `mod` - имя модификатора;
 * **Array** `val` - значение модификатора;
 * **Array** `addTech` - добавить перечисленные технологии к технологиям для уровня по умолчанию;
 * **Array** `forceTech` - использовать только указанные технологии;
 * **Array** `noTech` - исключить указанные технологии из использования;
 * **Boolean** `force` - принудительно создавать файлы модификатора.

#### Пример использования

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

### BEM.create.block()

Создание блока.

#### Опции

 * **String** `level` - директория уровня переопределения, по умолчанию текущая;
 * **Array** `addTech` - добавить перечисленные технологии к технологиям для уровня по умолчанию;
 * **Array** `forceTech` - использовать только указанные технологии;
 * **Array** `noTech` - исключить указанные технологии из использования;
 * **Boolean** `force` - принудительно создавать файлы блока.

#### Аргументы

 * **Array** `names` - имена создаваемых блоков.

#### Пример использования

```js
var Q = require('q'),
    BEM = require('bem').api,

    addTechs = ['bemhtml'],
    blocks = ['b-header'];

Q.when(BEM.create.block({ addTech: addTechs }, { names: blocks }), function() {
    console.log('Create blocks: %s', blocks.join(', '));
});
```

### BEM.create.elem()

Создание элемента.

#### Опции

 * **String** `level` - директория уровня переопределения, по умолчанию текущая;
 * **String** `blockName` - имя блока (обязательный параметр);
 * **Array** `addTech` - добавить перечисленные технологии к технологиям для уровня по умолчанию;
 * **Array** `forceTech` - использовать только указанные технологии;
 * **Array** `noTech` - исключить указанные технологии из использования;
 * **Boolean** `force` - принудительно создавать файлы элемента.

#### Аргументы

 * **Array** `names` - имена создаваемых элементов.

#### Пример использования

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

### BEM.create.mod()

Создание модификатора блока или модификатора элемента.

#### Опции

 * **String** `level` - директория уровня переопределения, по умолчанию текущая;
 * **String** `blockName` - имя блока (обязательный параметр);
 * **String** `elemName` - имя элемента;
 * **Array** `modVal` - значения модификатора;
 * **Array** `addTech` - добавить перечисленные технологии к технологиям для уровня по умолчанию;
 * **Array** `forceTech` - использовать только указанные технологии;
 * **Array** `noTech` - исключить указанные технологии из использования;
 * **Boolean** `force` - принудительно создавать файлы модификатора.

#### Аргументы

 * **Array** `names` - имена создаваемых модификаторов.

#### Пример использования

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

## BEM.build()

Сборка файлов.

#### Опции

 * **String** `outputDir` - директория для записи результата, по умолчанию текущая;
 * **String** `outputName` - имя (префикс имени файла) для записи результата;
 * **Level** `outputLevel` - объект уровня переопределения, на котором нужно создать файлы БЭМ-сущности;
 * **String** `block` - название блока;
 * **String** `elem` - название элемента;
 * **String** `mod` - название модификатора;
 * **String** `val` - значение модификатора;
 * **String** `declaration` - имя файла декларации использования (обязательный параметр);
 * **Array** `level` - уровень переопределения;
 * **Array** `tech` - собирать файлы указанных технологий.

Вы можете использовать один из следующих вариантов для задания префикса для сохранения результата сборки:

 * `outputName` - для задания полного пути-префикса;
 * `outputDir` плюс `outputName` - для задания пути для директории и префикса файлов (они будут склеены автоматически);
 * `outputLevel` плюс свойства, описывающие БЭМ-сущность: `block`, `elem`, `mod` и `val` (путь-префикс будет построен
   автоматически на базе правил маппинга сущностей в файлы, заданных для уровня).

#### Пример использования

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

## BEM.decl

Команды для работы с декларациями использования.

### BEM.decl.merge()

Объединение деклараций.

#### Опции

 * **String** `output` - файл для записи результата, по умолчанию STDOUT;
 * **Array** `declaration` - имя файла декларации использования (обязательный параметр).

### BEM.decl.subtract()

Вычитание деклараций.

#### Опции

 * **String** `output` - файл для записи результата, по умолчанию STDOUT;
 * **Array** `declaration` - имя файла декларации использования (обязательный параметр).
