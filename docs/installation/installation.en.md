# Installation
You need [NodeJS 0.6+](http://nodejs.org/) or later and [npm 1.1.69](http://npmjs.org/) or later.
After this it suffices `npm -g install bem`.

 * Install [nodejs](http://nodejs.org)

        https://github.com/joyent/node/wiki/Installation

 * Install [npm](http://npmjs.org)

        curl http://npmjs.org/install.sh | sudo sh

 * After installation configure `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    or

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

 * Install [bem-tools](https://github.com/bem/bem-tools)

        sudo npm -g install bem

 * Use this command [bem-tools](https://github.com/bem/bem-tools) to install the development version

        sudo npm -g install bem@unstable

## bem-bl

If you are going to use `bem` with
[bem-bl](https://github.com/bem/bem-bl) block library, you should also install
[XJST](https://github.com/veged/xjst) and [OmetaJS](https://github.com/veged/ometa-js).

    sudo npm -g install xjst ometajs

## Usage
Get the list of commands with `bem --help`.
To read about commands and subcommands use `bem COMMAND --help` or `bem COMMAND SUBCOMMAND --help`.

## Shell completion

### bash

To make completions for bem-tools available in your bash, run following
command (ensure that you have bash-completion installed, first). Run this

    bem completion > /path/to/etc/bash_completion.d/bem

and restart bash.

If you aren't using `bash-completion`, you can add `bem completion` to your `.bashrc` and reload:

    bem completion >> ~/.bashrc
    source ~/.bashrc

### zsh

If you use `zsh`, you can add `bem completion` to your `.zshrc` and reload:

    bem completion >> ~/.zshrc
    source ~/.zshrc
