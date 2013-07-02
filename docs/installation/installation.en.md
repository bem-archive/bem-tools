# Installation
You need [NodeJS 0.6+](http://nodejs.org/) or later and [npm 1.2.14](http://npmjs.org/) or later.
Then it's sufficient just to make `npm install bem`.

 * Install [nodejs](http://nodejs.org)

        https://github.com/joyent/node/wiki/Installation

To work with bem tools on Windows you need to have minimalist unix development environment. We recomend to install [git](http://git-scm.com/) which has built-in [MinGW](http://www.mingw.org/) as you'll probably need git in your further work anyway.

 * Install [bem-tools](https://github.com/bem/bem-tools) globally or locally for particular project (which is preferable). Don't pay attention to WARN messages while installation.

        sudo npm -g install bem

or better add bem into ``package.json`` like this:

````js
{
  "dependencies": {
    "bem": "~0.5.25"
  }
}
````

## Usage
Get the list of commands with `bem --help`.
To read about commands and subcommands use `bem COMMAND --help` or `bem COMMAND SUBCOMMAND --help`.

For quick start consider to checkout [bem project stub](https://github.com/bem/project-stub) and follow the instructions in [README.md](https://github.com/bem/project-stub/blob/master/README.md).

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
