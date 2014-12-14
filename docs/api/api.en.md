# API usage

Starting from `0.2.0` version it is possible to use `bem-tools` from API.

`bem` module exports the object of a command that has an `api` property.
It should be used the following way:

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

 * **Object** `opts` – command options
 * **Object** `args` – command arguments

It returns an object of `Q.promise` type.

## BEM.create

Commands to create BEM entities.

### BEM.create.level()

Creates a level of definition.

#### Options

 * **String** `outputDir` – directory of output (current directory by default)
 * **String** `level` – «prototype» of the level
 * **Boolean** `force` – key to force a level's creation, even if it already exists

#### Arguments

 * **Array** `names` - name of levels being created

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

Creates BEM entities: blocks, elements, modifiers, and their values.

#### Options

 * **String** `level` – level directory (current directory by default)
 * **Array** `block` – block name (required)
 * **Array** `elem` – element name
 * **Array** `mod` – modifier name
 * **Array** `val` – modifier value
 * **Array** `addTech` – add listed techs
 * **Array** `forceTech` – use only listed techs
 * **Array** `noTech` – exclude listed techs
 * **Boolean** `force` – force creating BEM entities files (rewrite)

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

 * **String** `level` – directory of block level (current directory by default)
 * **Array** `addTech` – add listed techs
 * **Array** `forceTech` – use listed techs only
 * **Array** `noTech` – exclude listed techs
 * **Boolean** `force` – force files creation

#### Arguments

 * **Array** `names` – list of blocks names

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

 * **String** `level` – level directory (current directory by default)
 * **String** `blockName` – name of element's block (required)
 * **Array** `addTech` – add listed techs
 * **Array** `forceTech` – use only listed techs
 * **Array** `noTech` – exclude listed techs
 * **Boolean** `force` - force creation of element files (to rewrite them)

#### Arguments

 * **Array** `names` – list of element names

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

 * **String** `level` – level directory (current directory by default)
 * **String** `blockName` – block name of this modifier (required)
 * **String** `elemName` – element name
 * **Array** `modVal` – modifier value
 * **Array** `addTech` – add listed techs
 * **Array** `forceTech` – use only listed techs
 * **Array** `noTech` – exclude listed techs
 * **Boolean** `force` – force creating modifier files (rewrite)

#### Arguments

 * **Array** `names` – list of modifiers

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

 * **String** `outputDir` – output directory (current directory by default)
 * **String** `outputName` – filename (its prefix) for output
 * **Level** `outputLevel` – output level for BEM entity to create
 * **String** `block` – block name
 * **String** `elem` – element name
 * **String** `mod` – modifier name
 * **String** `val` – modifier value
 * **String** `declaration` – filename of input declaration (required)
 * **Array** `level` – list of levels to use
 * **Array** `tech` – list of techs to build

You should use one of the following to specify output prefix:

 * `outputName` – to specify full path-prefix
 * `outputDir` plus `outputName` – to specify directory path and file prefix (they will be joined for you)
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

 * **String** `output` – file for output result (output is in STDOUT by default)
 * **Array** `declaration` – list of filenames for declarations (required)

### BEM.decl.subtract()

Subtracting the next declarations from the first one.

#### Options

 * **String** `output` – file for output result (output is in STDOUT by default)
 * **Array** `declaration` – list of filenames for declarations (required)
