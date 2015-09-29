# Установка bem-tools

Вам потребуется [NodeJS 0.8+](http://nodejs.org/) или выше, и [npm 1.2.14](http://npmjs.org/) или выше.
После этого достаточно выполнить команду `npm -g install bem`.

 * Установить [NodeJS](http://nodejs.org):

        https://github.com/joyent/node/wiki/Installation

 * Установить [npm](http://npmjs.org):

        curl https://npmjs.org/install.sh | sudo sh

 * После установки сконфигурируйте `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    или

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

 * Установить [bem-tools](https://ru.bem.info/tools/bem/bem-tools/):

        npm install bem

 * Для установки самой последней версии `bem-tools` воспользуйтесь командой:

        npm install bem@unstable

# Использование
Всю информацию о параметрах использования можно получить с помощью `bem --help`.
Для информации о конкретной команде и подкомманде: `bem COMMAND --help` и `bem COMMAND SUBCOMMAND --help`.

## Shell completion

### bash

Если вы используете `bash` и у вас установлен пакет `bash-completion`, выполните следующую команду и перелогиньтесь:

    bem completion > /path/to/etc/bash_completion.d/bem

Если вы не используете `bash-completion`, добавьте вывод `bem completion` себе в `.bashrc`, а затем перезагрузить:

    bem completion >> ~/.bashrc
    source ~/.bashrc

### zsh

Если вы используете `zsh`, добавьте вывод `bem completion` себе в `.zshrc` и перезагрузите его:

    bem completion >> ~/.zshrc
    source ~/.zshrc
