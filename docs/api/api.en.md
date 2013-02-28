# API usage

Starting from 0.2.0 version it is possible to use `bem-tools` from API.

`bem` module exports the object of a command that has an `api` property.
It is to use in this way:

```js
var Q = require('q'),
    BEM = require('bem').api,

    techs = ['css', 'js'],
    blocks = ['b-block1', 'b-block2'];

Q.when(BEM.create.block({ forceTech: techs }, { names: blocks }), function() {
    console.log('Create blocks: %s', blocks.join(', '));
});
```

The example above shows that you can use all the commands (including subcommands).

A command accepts two args:

 * **Object** `opts` command options
 * **Object** `args` command arguments

It returns an object of `Q.promise` type.

## BEM.create

Commands to create BEM entities.

### BEM.create.level()

Creates a level of definition.

#### Options

 * **String** `outputDir` a directory of output (current directory by default)
 * **String** `level` a «prototype» of the level
 * **Boolean** `force` key to force level's creating if it already exists

#### Arguments

 * **Array** `names` Namef of levels you are creating

#### Example

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

Creates BEM entities: blocks, elems, modifiers and their values.

#### Options

 * **String** `level` Level directory (current directory by default)
 * **Array** `block` Block name (required)
 * **Array** `elem` Element name
 * **Array** `mod` Modifier name
 * **Array** `val` Modifier value
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use only the techs listed
 * **Array** `noTech` Exclude the techs listed
 * **Boolean** `force` Force creating BEM entities files (rewrite)

#### Example

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

Creates a block.

#### Options

 * **String** `level` A directory of block's level. (Current directory by default)
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use these techs only
 * **Array** `noTech` Exclude these techs
 * **Boolean** `force` Force files creating

#### Arguments

 * **Array** `names` List of block names

#### Example

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

Creating an element.

#### Options

 * **String** `level` A directory of level. (Current directory by default)
 * **String** `blockName` A name of element's block (required)
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use only the techs listed
 * **Array** `noTech` Exclude the techs listed
 * **Boolean** `force` Force creating element's files (to rewrite them)

#### Arguments

 * **Array** `names` List of element names

#### Example

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

Creating a modifier for a block or an element.

#### Options

 * **String** `level` Level directory (current directory by default)
 * **String** `blockName` Block name of this modifier (required)
 * **String** `elemName` Element name
 * **Array** `modVal` Modifier value
 * **Array** `addTech` Add the techs listed
 * **Array** `forceTech` Use only the techs listed
 * **Array** `noTech` Exclude the techs listed
 * **Boolean** `force` Force creating modifier files (rewrite)

#### Arguments

 * **Array** `names` List of modifier

#### Example

```js
var Q = require('q'),
    BEM = require('bem').api,

    forceTechs = ['css'],
    block = 'b-header',
    elem = 'logo',
    mods = ['lang'],
    vals = ['ru', 'en'];

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, modVal: vals }, { names: mods }), function() {
    console.log('Create mod %s of block %s with vals %s', mods.join(', '), block, vals.join(', '));
});

Q.when(BEM.create.mod({ forceTechs: forceTechs, blockName: block, elemName: elem, modVal: vals }, { names: mods }), function() {
    console.log('Create mod %s of elem %s of block %s with vals %s', mods.join(', '), elem, block, vals.join(', '));
});
```

## BEM.build()

Build files from blocks.

#### Options

 * **String** `outputDir` An output directory (current directory by default)
 * **String** `outputName` A filename (its prefix) for output
 * **Level** `outputLevel` Output level for BEM entity to create
 * **String** `block` Block name
 * **String** `elem` Element name
 * **String** `mod` Modifier name
 * **String** `val` Modifier name
 * **String** `declaration` A filename of input declaration (required)
 * **Array** `level` List of levels to use
 * **Array** `tech` List of techs to build

You should use one of the following to specify output prefix:

 * `outputName` to specify full path-prefix
 * `outputDir` plus `outputName` to specify directory path and file prefix (they will be joined for you)
 * `outputLevel` plus properties describing BEM entity: `block`, `elem`, `mod` and `val` (path-prefix will
   be constructed for you using level file mapping scheme)

#### Example

```js
var Q = require('q'),
    B = require('bem'),
    BEM = B.api,

    decl = 'page.deps.js',
    outputDir = 'build',
    outputName = 'page',
    levels = ['blocks-common', 'blocks-desktop'],
    techs = ['css', 'js'];

// use outputDir and outputName options
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

// use outputLevel option
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

Commands to work with declarations.

### BEM.decl.merge()

Merging two or more declarations into one.

#### Options

 * **String** `output` A file for output result. By default output is in STDOUT
 * **Array** `declaration` List of filenames for declarations (required)

### BEM.decl.subtract()

Subtracting the next declarations from the first one.

#### Options

 * **String** `output` A file for output result. By default output is in STDOUT
 * **Array** `declaration` List of filenames for declarations (required)
