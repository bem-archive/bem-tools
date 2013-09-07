# Creating subcommands

Starting from `bem-tools 1.0.0` it is possible to extend standard set of commands with subcommands modules.
Each subcommand is npm package which should be installed in the same directory with `bem-tools`.

In order to be loaded and executed by `bem-tools` package name should be written as
`bem-<command name>`. So, when executing `bem foo`, `bem-foo` module will be loaded.

[COA](https://github.com/veged/coa) library is used for writing command's code. Subcommand module should
export `coa.Cmd` object or function configuring it. In later case `Cmd` object is passed as a function
context (`this`).

Example:

```javascript
var Q = require('q');
module.exports = function() {
    return this.title('hello world command')
        .act(function() {
            return Q.resolve('Hello, world!');
        });
};
```

For further examples and API reference of COA, see
[project documentation](https://github.com/veged/coa/blob/master/README.md).

## Using tpl-bem-command

To simplify creating a subcommands you can use [tpl-bem-command](https://github.com/bem/tpl-bem-command)
template.

First, ensure that [volo](http://volojs.org/) is installed in your system:

    npm install -g volo

Next, generate a new project from template:

    volo create <project folder> bem/tpl-bem-command

During the generation you should provide:

* command name;
* author's name and email address;
* project's repository URL on github.

As a result you will have a skeleton for npm package named `bem-<command-name>` with
following content:

* `package.json` with already included depndencies on [q](https://github.com/kriskowal/q),
    [COA](https://github.com/veged/coa), [update-notifier](https://github.com/yeoman/update-notifier/);
* file `lib/<command name>.js` which should contain your subcommand code;
* file `README.md` with installation instructions;
* file `bin/bem-<command name>` which can be used to execute command as standalone utility without `bem-tools`.
