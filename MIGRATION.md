# Migration from 0.6.x to 1.0.0

## Replace external libraries support with `bower-npm-install`

External libraries installation support was removed from bem-tools 1.0.0. You
should use `bower-npm-install` instead.

1.  Install `bower` and `bower-npm-install`:
        npm install -g bower bower-npm-install
2.  Create `bower.json` file in the root directory of your project. You can use
    `bower init` command to launch a wizard that will help initalizing project.
3.  Replace `libraries` declarations in `.bem/make.js` file with `dependecies` declaration
    in `bower.json` file.
    * check if your library present in bower registry:
            bower search <library name>
    * if library has been found, use only library name and version/commit hash `bower.json`.
        Otherwise, you should also specify full git repo URL.
    * `<lib>@<tag>` from 0.6.x `make.js` should become `"<lib>": "<tag>"` or
        `"<lib>": "<repo>#<tag>"` in `bower.json`;
    * `<lib>@<commit hash>` should become `"<lib>" : "<commit hash>"` or
        `"<lib>" : "repo#<commit hash>"`;
    * `<lib>@<branch>` is not supported and should be replaced with either tag or 
        commit hash.

    For example, if you had following `make.js`:

    ```javascript
    MAKE.decl('Arch', {
        libraries: [
            'bem-core@09c09aff2f2b505872840a2c693759bd4c429491',
            'bem-pr@0.3.5'
        ]
    });
    ```

    And following `.bem/repo.db.js`:
    
    ```javascript
    module.exports = {
        'bem-core' : {
            type     : 'git',
            url      : 'git://github.com/bem/bem-core.git'
        },
        'bem-pr' : {
            type     : 'git',
            url      : 'git://github.com/narqo/bem-pr.git'
        }
    };
    ``` 

    You should create following section in `bower.json`:

    ```javascript
    {
        ...
        "dependencies": [
            "bem-core": "09c09aff2f2b505872840a2c693759bd4c429491",
            "bem-pr": "git://github.com/narqo/bem-pr.git#0.3.5"
        ]
    }
    ```

    After that, `.bem/repo.db.js` file and `libraries` section in `make.js`
    can be safely removed.

4.  Create file `.bowerrc` in the project root and configure `bower` to install
    libraries into `libs` directory:

    ```javascript
    {
        "directory": "libs"
    }
    ```

5. Run `bower-npm-install` from the project root.

## `make.js` should be written as function

In bem-tools 0.6.x `make.js` file received `MAKE` variable implicitly and didn't export
anything. In 1.0.0 it should export a function which receives `MAKE` explicitly.

This example make file:

```javascript
MAKE.decl(...)

//make settings continues
...

```

should be rewritten to:

```javascript
module.exports = function(registry) {
    registry.decl(...)

    //make settings continues
    ...
};
```

## Libraries does not get installed or updated by `bem make`

You should now explicitly call `bower-npm-install` each time you change
your dependencies in `bower.json`.

## Legacy tech modules support removed

You should migrate your legacy tech modules to APIv2. Legacy modules is not
supported anymore. APIv1 is still supported, but will produce warnings
during build.

