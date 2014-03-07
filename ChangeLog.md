bem-tools changelog
===================

07.03.2014, Version 0.7.9 (stable)
----------------------------------
- Add stylus tech (`v2/styl`)
- Ability to set `--no-colors` and `--verbosity`
options with `BEM_MAKE_NO_COLORS` and `BEM_MAKE_VERBOSITY`
environment variables.

24.01.2014, Version 0.7.8 (stable)
----------------------------------
— bem create: Add possibility to create entities with predefined content
- Package: COA is updated to 0.4.0, cli-table to 0.3.0

24.01.2014, Version 0.7.7 (stable)
----------------------------------
- New roole and less techs

20.01.2014, Version 0.7.6 (stable)
----------------------------------
- Correctly handle promises reject with no reason in tech modules
- Check that bundle techs don't have common build suffixes
- Save build cache data only on successful build

09.01.2014, Version 0.7.5 (stable)
----------------------------------
- Package: borschik is updated to 0.4.2

17.12.2013, Version 0.7.4 (stable)
----------------------------------
- Fixed crash related to underscore->lodash change
- Reverted: pass Tech#getTechPath() result as bem-create's forceTech argument
    The change caused level-proto tech to break
- Tests: level-proto tech is included into bem make suite

11.12.2013, Version 0.7.3 (stable)
----------------------------------
- Fix "bem create" as worcker invocation
- Pass Tech#getTechPath() result as bem-create's forceTech argument

27.11.2013, Version 0.7.2 (stable)
----------------------------------
- bem server: fixed encoding problem with files containing non latin characters

12.11.2013, Version 0.7.1 (stable)
----------------------------------
- Fixed exception in `bem build`

11.11.2013, Version 0.7.0 (stable)
----------------------------------
- Level scanner no longer fails on symlinks
- css tech correctly generates classes for modifiers without values ([#425](http://github.com/bem/bem-tools/issues/425))
- Warning is shown when level does not exists or does not contains .bem directory ([#418](http://github.com/bem/bem-tools/issues/418))
- Ability to specify multiple elems in elem properties in `deps.js` files ([#401](http://github.com/bem/bem-tools/issues/401)):

  ```javascript
  ({
    shouldDeps: { block: 'bla', elem: ['e1', 'e2', 'e3'] }
  })
  ```

  is equivalent to:

  ```javascript
  ({
    shouldDeps: [
        { block: 'bla', elem: 'e1' },
        { block: 'bla', elem: 'e2' },
        { block: 'bla', elem: 'e3' }
  })
  ```
- Shortcut for specifying tech dependencies of the same block ([#413](http://github.com/bem/bem-tools/issues/413)):

  ```javascript
  { block: 'b',  tech: 'js', mustDeps: { tech: 'bemhtml' }  }
  ```

  is equivalent to:

  ```javascript
  { block: 'b',  tech: 'js', mustDeps: { block: 'b', tech: 'bemhtml' }  }
  ```

- build command for `bem bench` is customizable via `bem-bench-build`
  script in project's `package.json`
- GitLibraryNode specifies git dir explicitly with git commands ([#355](http://github.com/bem/bem-tools/issues/355))
- Base tech is selected according to child's `API_VER`. Error is thrown when
  base and child techs have different `API_VER` ([#416](http://github.com/bem/bem-tools/issues/416))
- It is possible to write tech module as a function ([#363](http://github.com/bem/bem-tools/issues/363)):

  ```javascript
  module.exports = function(BEM) {
      return {
          //tech mixin
      };
  }
  ```

- It is possible to write level config as a function ([#364](http://github.com/bem/bem-tools/issues/364)):

  ```javascript
  module.exports = function(BEM) {
      return {
          //level mixin
      };
  }
  ```

- `baseLevelName` property can be used in level config to specify `simple` or
  `project` level by name ([#367](http://github.com/bem/bem-tools/issues/367))
- scanner of simple level doesn't ignore dirs like name.tech
- deps: possibility to declare dependence without explicitly including item ([#459](http://github.com/bem/bem-tools/issues/459)):

  ```javascript
  {
      block: "some-block",
      mustDeps: [
        {block: "other-block", include: false}
      ]
  }

  ```

  In this case, `other-block` won't be included in bundle with `some-block` automatically. But, if
  bundle requires both `some-block` and `other-block`, `other-block` will always
  be included before `some-block`.

- `--no-colors` option to disable colors in terminal
- `v1` tech warning shows link to migration instructions
- `q-fs` and `q-http` libraries replaced with `q-io`
- `underscore` library replaced with `lodash` ([#94](http://github.com/bem/bem-tools/issues/94))
- benchmarks can be built on multiple bundle levels


04.09.2013, Version 0.6.16 (stable)
-----------------------------------

- Update csso within borschik dependency to 1.3.8
- deps.js: Fix levels cache validity check
- Warn on v1 tech module usage, not creation
- GitLibraryNode: add origin parameter to customise remote name
- Update borschik dependency to 0.3.5
- Version-independent solution for CP#fork (Node.js 0.6+)
- Add tech name and path to V1 deprecation warning
- Fix `bem create level` run without prototype (--level opt)
- LibraryNode: create the leading directories before checkout
- bemdecl.js: Traverse through all fields, not only `mix` and `content`

13.08.2013, Version 0.6.15 (stable)
-----------------------------------

- API: `getBuildResultChunk()` should've been passed source suffix, not destination, and that was fixed.
  Check your tech modules that they do not broke.

13.08.2013, Version 0.6.14 (stable)
-----------------------------------

- bem: Fix bug in `bem create level` that prevented from using level prototype from module installed in `node_modules`
  folder on the project level
- bem: Throw an error when unable to resolve tech by name specified in `baseTechName` property of tech module

09.08.2013, Version 0.6.13 (stable)
-----------------------------------

- tech/v2: `transformBuildDecl()` is reborn and used in `buildByDecl()`
- level scanner: use proper suffix for folders representing block with mod and val
- level scanner: don't ignore `block/elem/elem.tech` and `block/mod/mod.tech` kinds of folders
- deps.js v2: invalidate when declaration modified date is later than deps.js

05.08.2013, Version 0.6.12 (stable)
-----------------------------------

- bem: Add `level-proto` tech that creates levels based on prototypes in `.bem/levels/*.js` on project level

  Example usage (`.bem/level.js`):

  ```js
  exports.getTechs = function() {
      return {
          'docs':   'level-proto', // will create levels <name>.blocks/ with proto in .bem/levels/docs.js
          'blocks': 'level-proto'  // will create levels <name>.blocks/ with proto in .bem/levels/blocks.js
      };
  };
  ```

- bem: Fix bug in `bem create level` that prevented from creating level without prototype
- bem make: Fix bug in `BemCreateNode` that was causing error when using single tech on different names
  (e.g. `level-proto`)
- bem make: `require()` in `.bem/make.js` configs behaves more correctly now (try to require any dependency
  of your project from your `.bem/make.js`)
- bem make: `level` property in `BlockNode` now initialized on the first access; this helps to deal with levels being
  created during the `bem make` build process
- API: Export `logger` and `template` from `bem` module
- API: Add `Node.create()` static method to simplify creation of nodes, see example

  ```js
  var opts = {
          // node options
      },
      node = registry
          .getNodeClass('BemCreateNode')
          .create(opts);
  ```

30.07.2013, Version 0.6.11 (stable)
-----------------------------------

- tech v2: Fix cache. Two technologies with the same target name don't
  overwrite each other's metadata cache anymore
- bem make: Stop using bem create {block,mod,val} commands in make process

19.07.2013, Version 0.6.10 (stable)
-----------------------------------

- API: Recommend to use tech V2 API instead of V1
- API: Deprecate `LegacyTech` API
- API: Deprecate `bem create block`, `bem create elem` and `bem create mod` commands,
  use `bem create` command with options instead

To disable deprecation warnings set `util.deprecate.silence` value to `false`
or set `BEM_NO_DEPRECATION` environment variable to `1`.

16.07.2013, Version 0.6.9 (stable)
----------------------------------

- bem bench: Add ability to test [bh](https://github.com/enb-make/bh) templates and compare them with bemhtml

  You should run `bem bench -t bh [...other opts...]` to launch `bh` tests only or just `bem bench`
  to run both if they exist.

  See docs for more info.

10.07.2013, Version 0.6.8 (stable)
----------------------------------

- deps.js: Correct unique items in `forEach` in case of deps by techs

09.07.2013, Version 0.6.7 (stable)
----------------------------------

- level: Add `opts.noCache` support to `level.createLevel()` to force level creation without cache use
- API: Ability to specify source techs for `BundlesLevelNode` (via `getBundleSourceTechs()`)
- code: fixed jshint warnings

03.07.2013, Version 0.6.6 (stable)
----------------------------------

- package: Downgrade q from 0.9.6 to 0.9.5 because former is buggy on node 0.10
- level: Show warning when failed to load a tech during level scan, not fail.
- level: Fix level scanner to find block.tech dirs within mods
- API: Fix `util.isFileP()` and mark it as deprecated

01.07.2013, Version 0.6.5 (stable)
----------------------------------

- API: Add `util.bemParseKey()` helper to parse BEM entity key into BEM entity object
  (fixes `bem bench` execution error)

30.06.2013, Version 0.6.4 (stable)
----------------------------------

- fixed bugs in new level scanner (see BEM-467)

20.06.2013, Version 0.6.3 (unstable)
------------------------------------

- bem bench: Run `npm install` before `bem make` after revision export

20.06.2013, Version 0.6.2 (unstable)
------------------------------------

- bem bench: Disable verbose mode for `rsync` to stop output buffer overflow
- bem bench: Disable double error output on `rsync`

20.06.2013, Version 0.6.1 (unstable)
------------------------------------

- bem: Add `bem bench` command see [docs](https://github.com/bem/bem-tools/blob/master/docs/bem-bench/bem-bench.ru.md)
  (in russian) for more info

- bem: Add ability to create level prototypes (js files) using `bem create level` command. See example:

  ```
  bem create level -l simple .bem/levels/docs.js
  ```

- bem: Add `project` tech and `project` level prototype:

  This command will create `my` project:

  ```
  bem create -b my -T project
  ```

  ```
  my/
  ├── .bem/
  |   ├── levels/
  |   |   ├── blocks.js
  |   |   ├── bundles.js
  |   |   ├── docs.js
  |   |   ├── examples.js
  |   |   └── tech-docs.js
  |   ├── techs/
  |   └── level.js
  └── node_modules/
      ├── .bin/
      |   └── bem -> symplink/to/globally/installed/bem (executable)
      └── bem/ -> symplink/to/globally/installed/bem (module)
  ```

- bem: Add `docs` tech and `docs` level prototype.

  This command will create new level based on `docs`:

  ```
  bem create level -l docs docs
  ```

  ```
  docs/
  └── .bem/
      └── level.js
    ```

  This command will create `docs` tech for block `button`:

  ```
  bem create -b button -T docs
  ```

  ```
  button/
  ├── button.docs/
  |   └── .bem/
  |       └── level.js
  └── ...
  ```

- bem: Add `tech-docs` tech and `tech-docs` level prototype.

- API: Introduce `util.findLevel(path, [types])` function

11.06.2013, Version 0.6.0 (unstable)
------------------------------------

- new techs API is implemented (see lib/tech/v2.js). It operates with real file paths instead of prefixes.
This makes build avoid redundant operations and makes it work faster.
- as the part of new API new level introspection is implemented. In default implementation it just scans dirs/files
and checks their validity to being BEM entity using simple string operations (see scan* methods in lib/level.js).

30.05.2013, Version 0.5.33 (stable)
----------------------------------

- package: q updated to 0.8.12
- package: borschik updated to 0.3.1
- package: xjst updated to 0.4.13
- package: ometajs updated to 3.2.4
- package: preferglobal set to false

23.05.2013, Version 0.5.32 (stable)
-----------------------------------

- bem: Fix `bem create level` on Node 0.10.x (Closes #372)
- bem make: Create parent directory for `SymlinkLibraryNode` if it doesn't exists (Closes #342)

24.04.2013, Version 0.5.31 (stable)
-----------------------------------

- bem: Add additional techs and levels from abandoned introspect branch
- API: Add mkdrip wrapper to util.js
- bem: ie.css tech should pass absolute path for its chunks
- bem make: Fix for "Coud not call for method of undefined" when using nodes from API

04.04.2013, Version 0.5.30 (stable)
-----------------------------------

- bem make: Add ability to customize build rules more flexibly by providing Arch.createCustomNode() method
- bem make: Add match*() methods to `simple` level prototype, add tests (Closes #282)

25.03.2013, Version 0.5.29 (stable)
-----------------------------------

- bem make: don't update git library form upstream when working copy state satisfies to configured one. git update commands chain altered (no git reset for now) (Closes #335)

20.03.2013, Version 0.5.27 (stable)
-----------------------------------

- bem make: fixed to work on node 0.10 (Closes #357)
- bem make: some performance boost achieved (#250)

06.03.2013, Version 0.5.26 (stable)
-----------------------------------

- bem make: Magic nodes doesn't link the nodes it creates with parent magic nodes (Closes #306)
- deps.js: don't swallow parsing errors (Closes #353)

14.02.2013, Version 0.5.25 (stable)
-----------------------------------

- bem server: windows fixes

04.02.2013, Version 0.5.24 (stable)
-----------------------------------

- bem server: Add error handling for server.listen() (Closes #315)
- bem server: Fix server message about serving address to have real host name it is listening on (Closes #334)
- bem server: Add socket-only option to make bem server listen only unix socket (Closes #316)
- bem server: Add a check for specified tcp port value to be a number
- bem make: Fix recursion error when build target name contain trailing slash (Closes #252)
- bem make: Use tech.getSuffixes() in MetaNode to build dependencies list (Closes #320)
- bem make: Git library checkout fixed to work with commit hashes (close #302)
- bem make: Git library branch parameter is added to specify branch name. Use treeish parameter to specify commit or tag.
- ie6.css tech: Don't include bundle.css

11.12.2012, Version 0.5.21 (stable)
-----------------------------------

- Update `borschik` to `0.2.3`

12.11.2012, Version 0.5.20 (stable)
-----------------------------------

- bem make: Fixed `npmPackages` check in `LibraryNode` (Closes #300)
- bem make: Install production dependencies in `LibraryNode` by default (Closes #310)
- Update `csso` to `1.3.5`
- Update `q` to `0.8.10`

06.11.2012, Version 0.5.19 (stable)
-----------------------------------

- Freeze dependencies using `npm shrinkwrap` to fix problems with `q 0.8.10` release

06.11.2012, Version 0.5.18 (stable)
-----------------------------------

- Dummy release

25.09.2012, Version 0.5.17 (stable)
-----------------------------------

- bem: Make content read of deps.js files of block to be synchronous to gain some speed boost (PR #261)
- bem make: Provide a more convenient way to configure the list of bundles and blocks levels to build (Closes #260)
- bem make: Change signature of `getLevels()` method of `BundleNode` to `getLevels(tech)` to add ability
  to configure the list of levels more precisely
- docs: Small JSDoc improvements in `BundleNode` class
- docs: Correct links in README (@banzalik)

19.09.2012, Version 0.5.16 (stable)
-----------------------------------

- bem: Require errors in .bem/level.js were masked (Closes #223)
- bem: Add `.git` to ignorable paths during introspection
- bem: Skip `blocks/` level directory during introspection in `nested` level
- bem: Introduce `bem decl intersect` command (Closes #219)
- bem make: Install library dependencies after checkout (Closes #224)
- bem make: Do not install dependencies when `npmPackages = false` (Closes #229)
- bem make: Ability to configure list of techs to optimize, see `BundleNode.getOptimizerTechs()` (Closes #231)
- bem make: `Rename bemhtml.js` tech to `bemhtml`, fix this in your `.bem/make.js` files
- bem make: Use non interactive mode for `svn` commands in `SvnLibraryNode` (Closes #221)
- bem make: Store `*.meta.js` files in `<project-root>/.bem/cache/` directory (Closes #232)
- bem make: Fixed bug in the inspector preventing it to work properly in FF (Closes #240)
- docs: Translate into english chapter about level.js (Closes #38)
- docs: Updated english docs in installation topic (@fliptheweb, #225)
- docs: Add `CONTRIBUTING.md`
- docs: Add `LICENSE` (we use MIT)
- API: Expose `__filename` and `__dirname` vars in `.bem/make.js` files
- API: Add `util.exec()` promised function to execute commands
- API: Remove `relative()` function from `lib/path.js` in favor of that in node 0.6+ (Closes #226)
- API: Refactor introspection logic (Pull #237)
  - Add `createIntrospector()` method to `Level` class to create custom introspectors (see jsdoc)
  - Refactor `getDeclByIntrospection()` to use `createIntrospector()`
  - Add `getItemsByIntrospection()` method to `Level` class, that returns array of BEM entities in techs
- API: Refactor `LevelNode` (Pull #238)
  - Lazy level object creation
  - Use `getItemsByIntrospection()` to collect BEM items to build
  - Unify actualization of blocks and elems in `BundleLevelNode`
- tests: Cover introspection logic
- tests: Cover `deps.intersect()` and `deps.subtract()`
- tests: Cover building of bundles-as-elements
- package: Support node 0.8.x (Closes #220)

07.09.2012, Version 0.5.15 (stable)
------------------------------------

- bem: Add `;` after each include in js-based techs (`js` and `js-i`) (Closes #210)
- bem make: Bugfix: Use `Q.when()` to call base `alterArch()` method in `BundlesLevelNode` (Closes #216)
- docs: Add russian and english docs for `bem make` / `bem server` feature
- docs: Add more info on `--chdir`, `-C` option on `bem create *` commands (See #204)
- docs: Add `BEM.create()` docs: russian and english (Closes #192)
- docs: Document API changes in `BEM.build()` (Closes #193)
- docs: Document extensions in tech modules API (Closes #194)
- docs: Add russian docs for `.bem/level.js` config (See #38)
- API: Implement `include()` in `.bem/make.js` files (Closes #209)
- package: Depends on `csso ~1.2.17` (some critical bug fixes)

24.08.2012, Version 0.5.14 (unstable)
------------------------------------

- bem: Get rid of `Q` deprecation warnings (Closes #200)
- bem make: Node of type `MergedBundle` depends on all nodes of type `BundleNode` on the same level (Closes #206)
- package: Depend on `q ~0.8.8` and `apw ~0.3.6`

11.08.2012, Version 0.5.13 (unstable)
------------------------------------

- bem make: Create directory `.bem/snapshots` if it doesn't exist before writting a snapshot (Closes #201)
- bem make: Implement `clean()` method of `BemCreateNode`
- bem make: `getLevels()` method of `BundleNode` fixed to avoid putting undefined level into the resulting
  array (Closes #203)
- API: Add `getLevelPath()` helper method to `BlockNode` and `LevelNode` classes (Closes #190)

07.08.2012, Version 0.5.12 (unstable)
------------------------------------

- bem make: Forward errors from `borschik` with prefix `borschik: ` in `BorschikNode`
- bem make: Store output file name in `this.output` property to use later in the logs in `BorschikNode`
- package: Depends on `borschik ~0.0.11`

02.08.2012, Version 0.5.11 (unstable)
------------------------------------

- bem: Implement various strategies for mass IO operations in `Tech.filterPrefixes()` and `BemBuildNode.isValid()` (Closes #167)
- bem: Fix referencing techs by name
- bem: Allow use of `module.exports = ...` in files read by `util.readDecl()`
- bem: `util.getBemTechPath()` returns full tech path now, with extension
- bem: Add `-T` option as an alias for `-t`, `--tech` for `bem build` command
- bem: Add `--output-level` and `--block`, `--elem`, `--mod`, `--val` options for `bem build` command to build BEM
  entities on bundle levels
- bem: Allow using `require()` in decl-like files (Closes #172)
- bem: Add inspector server feature to `bem make` and `bem server` commands
- bem: Do not create new class from `LegacyTech` and legacy tech module content mixin in `getTechClass()` (potential bug fix)
- bem: Bugfix: `bem decl subtract` creates empty `*.deps.js` file (Closes #170)
- deps.js tech: Fix serializing of empty deps
- deps.js tech: Fix twice expansion of deps (Closes #163)
- bem make: Allow build triggering using final file names in case when tech produces many files (Closes #172)
- bem make: When `BEM_IO_STRATEGY === 'callback'` and `meta` was empty promise would never resolve
- bem make: Add merged bundle support
- bem server: Listen on file socket on `--socket` option, configure socket path using `--socket-path` option
  and socket permissions using `--socket-mode` option (Closes #166)
- docs: Document API changes in `BEM.create.block()`, `BEM.create.elem()` and `BEM.create.mod()` of version 0.5.x (Closes #161)
- docs: Declare dependency on NodeJS 0.6+
- API: Add third `level` optional argument to `getTechClass()` function of `tech` method
- API: Add third `level` optional argument to `createTech()` function of `tech` method
- API: Add `getCreateSuffixes()` and `getBuildSuffixes()` to `Tech` class to let build system to deal with techs like
  `bemhtml` more correct
- API: Add `util.removePath(path)` function to remove file and dir paths, but not recursively
- API: Add `util.readJsonJs(path)` function to read and eval JSON-JS files
- API: Add `util.symbolicLink(link, target, force)` function
- API: Add `util.lpad()` alias to `util.pad()`, add `util.rsplit(string, sep, maxsplit)` function
- API: Add `getContext()` method to `LegacyTech` class as a proxy to `this.techObj.getContext()`
- API: Add `getBuildResultChunk()` method to `LegacyTech` class as a proxy to `this.techObj.outFile()`
- API: Wait for `opts.declaration` to load before call to `this.techObj.build()` in `LegacyTech` class
- tests: Add tests for serializing empty deps in `deps.js tech`
- tests: Use `bem-bl` as git submodule for tests data (Closes #176)
- tests: Add tests that additionally build `i18n` and `i18n.js` techs for bundles
- tests: Add tests for merged bundle build
- tests: Add tests for `getTechClass()` function of `tech` module
- package: Add `dom-js` dependency for i18n tests (Closes #172)
- package: Add `clean` target to `GNUmakefile`
- package: Depend on `coverjs >= 0.0.7-aplha` (Closes #191)

13.06.2012, Version 0.5.10 (unstable)
------------------------------------

- bem: Use synchronous file existence check in `filterPrefixes()` instance method in `Tech` class
- bem: Fix bug with `--chdir` option for `bem create level` command (Closes #151)
- deps.js tech: More precisely report problems in blocks `*.deps.js` files
- deps.js tech: Read every block `*.deps.js` file only once
- bem make: Checks for target dir to exist before executing `svn info` in `SvnLibraryNode` (Closes #154)
- bem make: Output collected logs in case of fail in `Node` (Closes #155)
- bem make: Fix exception during build of `*.meta.js` files in `BemBuildMetaNode` (Closes #153)
- bem make: Sync mtime checks in `isValid()` instance method of `BemBuildNode` class (Closes #157)
- API: Add `util.readDecl()` promised function
- tests: Add legacy `Makefile` "tests" for `bem decl merge` command
- package: Depend on `coa ~0.3.5`
- package: Depend on `apw ~0.3.4`

09.06.2012, Version 0.5.9 (unstable)
------------------------------------

- bem make: Build minimized versions of `*.bemhtml.js` files
- bem make: Check for svn revision in `SvnLibraryNode.isValid()`

09.06.2012, Version 0.5.8 (unstable)
------------------------------------

- bem make: `SvnLibraryNode` extends `ScmLibraryNode`

08.06.2012, Version 0.5.7 (unstable)
------------------------------------

- More fixes on running of `bem make` and `bem server` not in project root
- bem: Output full stack traces on error
- bem: Lazy tech paths resolving in `Level` class
- bem: `bem create *` commands display error when there are no techs specified in command line options
  and `defaultTechs` in level config is empty
- bem: Add convenient `bem create` command to create all type of BEM entities
- bem server: Convert russian lang messages to english
- bem server: Fix wrong links in directory listings
- bem server: Strip query string part before accessing a file
- bem make: Do not checkout `bem-bl` by default
- bem make: Fix `LibraryNode`
- bem make: Extend context of `.bem/make.js` using `global`
- bem make: Conditional build of bundle files based on existance of `*.bemjson.js` and `*.bemdecl.js` on the file system
- bem make: Resolve tech module paths using level object in `BundleNode`
- bem make: Use `Level.createTech()` instead of `Level.getTech()` to construct tech objects for `BemBuildNode`
- bem make: Depend nodes of `BemBuildNode` class only on existing blocks files to increase performance
- bem make: Run nodes of `BemBuildNode` class forked by default to increase performance
- bem make: Add more logging to `BundleNode`
- bem make: Add support for `csso` processing of `*.css` files for production builds in `BorschikNode`
- bem make: Add support for `uglifyjs` processing of `*.js` files for production builds in `BorschikNode`
- bem make: Rename `repo` param to `url` in `ScmLibraryNode` and its derivatives
- bem make: Fix cleaning of obsolete dependencies in `BemBuildNode`
- bem make: Huge internal refactoring on `BundleNode`
- bem make: Rename `getCreateDependencies()` instance method to `getDependencies()` in `BemBuildNode` class
- bem make: Rename `getCreateDependencies()` instance method to `getDependencies()` in `BemCreateNode` class
- bem make: Add `setFileNode()` and  `setBemCreateNode()` instance methods to `BundleNode` class
- logging: Log node versions on `debug` verbosity
- logging: Log profiling info of `bem make`
- logging: Add more `debug` verbosity logging to `BundleNode`
- docs: Add jsdoc for `Level` class
- docs: Update jsdoc for `Tech` class
- docs: Add docs for `bem create elem` and `bem create mod`
- docs: Add docs for `bem create`
- docs: Fix jsdoc for `setBemBuildNode()` instance method of `BundleNode` class
- docs: Add jsdoc for `Node`, `FileNode`, `MagicNode`, `ScmLibraryNode`
- API: Export `util` module as `require('bem').util`
- API: Add `matchAny()` instance method to `Level` class
- API: Add instance methods-shortcuts to `Level` class: `getPath()`, `getPathByObj()`, `getRelPathByObj()`
- tests: Add tests for bem make
- tests: Rewrite all tests to `mocha`
- package: Add `xjst 0.2.21` to dependency list
- package: Add `ometajs ~2.1.10` to dependency list
- package: Bump `q` dependency version to `~0.8.5`
- package: Bump `apw` dependency version to `~0.3.2`
- package: Bump `borschik` dependency version to `~0.0.10`

18.05.2012, Version 0.5.6 (unstable)
------------------------------------

- docs: Draft of russian docs for `bem make` / `bem server`
- API: Add `resolvePaths(paths)` and `resolvePath(path)` methods to `Level` class
- bem make: Add more logging to `BorschikNode`
- bem make: Use `js-i` tech in `BundleNode` to build bundles `*.js` files by default
- package: Bump `borschik` dependency to `~0.0.9`

17.05.2012, Version 0.5.5 (unstable)
------------------------------------

- Require node 0.6.x
- deps.js tech: Fix bug with building of `deps.js` files introduced in 0.5.2
- Fix running of `bem make` and `bem server` not in project root
- logging: Add `flog()` shorthand function to output formatted log as a replacement for `console.log`
- logging: Log version number of `bem-tools` on `bem make` and `bem server`
- bem server: Show http link on server start
- bem server: Fix current directory output in directory listing
- bem make: Tune verbosity level for build messages
- bem make: Log targets to build on build start
- bem make: Fix validity checks in `LibraryNode` and `BemBuildNode`
- bem make: Move validity cheks from `FileNode` to `GeneratedFileNode`
- bem make: Fix `clean()` of `BemBuildMetaNode`
- bem make: Store relative paths in `*.meta.js` files
- API: Add `require('bem').version`
- API: Add `require('bem/lib/util').writeFileIfDiffers(path, content, force)`

16.05.2012, Version 0.5.4 (unstable)
------------------------------------

- package: Bump `apw` dependency version to `~0.3.0`

15.05.2012, Version 0.5.3 (unstable)
------------------------------------

- deps.js tech: Support `deps.js` format as a declaration for `bem build`

15.05.2012, Version 0.5.2 (unstable)
------------------------------------

- Add `--verbosity` option to `bem make` and `bem server` commands
- bem make: Add a lot of colorfull logging
- bem make: A lot of internal refactorings
- bem make: Fix dependency bug with building `_*.ie.css` files
- bem make: Fix child process handling in `BorschikNode` and `BemBuildNode`
- API: Add winston as logging engine

05.05.2012, Version 0.5.1 (unstalbe)
------------------------------------

- bem make: Quick fix removing testing code

05.05.2012, Version 0.5.0 (unstable)
------------------------------------

- bem make / server feature introduction
