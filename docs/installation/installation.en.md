# Installation of bem-tools

You need [NodeJS 0.8+](http://nodejs.org/) or later and [npm 1.2.14](http://npmjs.org/) or later.
Then just run `npm install bem`.

 * Install [nodejs](http://nodejs.org)

        https://github.com/joyent/node/wiki/Installation

* Install [npm](http://npmjs.org):

        curl https://npmjs.org/install.sh | sudo sh

 * After installation configure `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    or

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

 * Install [bem-tools](https://bem.info/tools/bem/bem-tools/):

        npm install bem

 * To install the latest version of `bem-tools` run:

        npm install bem@unstable

## Usage
Get the list of commands with `bem --help`.
To read about commands and subcommands use `bem COMMAND --help` or `bem COMMAND SUBCOMMAND --help`.

For quick start consider to checkout [bem project stub](https://github.com/bem/project-stub) and follow the instructions in [README.md](https://github.com/bem/project-stub/blob/master/README.md).

## Shell completion

### bash

To make completions for `bem-tools` available in your bash, run following
command (ensure that you have bash-completion installed, first):

    bem completion > /path/to/etc/bash_completion.d/bem

Restart bash afterwards.

If you do not use `bash-completion`, you can add `bem completion` to your `.bashrc` and reload:

    bem completion >> ~/.bashrc
    source ~/.bashrc

### zsh

If you use `zsh`, you can add `bem completion` to your `.zshrc` and reload:

    bem completion >> ~/.zshrc
    source ~/.zshrc
