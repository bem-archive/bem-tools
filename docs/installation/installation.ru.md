# Установка
Вам потребуется [NodeJS 0.6+](http://nodejs.org/) или выше и [npm 1.x](http://npmjs.org/).
После этого достаточно `npm -g install bem`.

 * Установить [nodejs](http://nodejs.org)

        https://github.com/joyent/node/wiki/Installation

 * Установить [npm](http://npmjs.org)

        curl http://npmjs.org/install.sh | sudo sh

 * После установки сконфигурируйте `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    или

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

 * Установить [bem-tools](https://github.com/bem/bem-tools)

        sudo npm -g install bem

 * Для установки самой последней версии [bem-tools](https://github.com/bem/bem-tools) воспользуйтесь командой

        sudo npm -g install bem@unstable

## bem-bl

Если вы планируете использовать `bem` вместе с библиотекой блоков
[bem-bl](https://github.com/bem/bem-bl), установите так же
[xjst](https://github.com/veged/xjst) и [ometajs](https://github.com/veged/ometa-js).

    sudo npm -g install xjst ometajs

# Использование
Всю информацию о параметрах использования можно получить с помощью `bem --help`.
Для информации о конкретной команде и подкомманде: `bem COMMAND --help` и `bem COMMAND SUBCOMMAND --help`.

## Shell completion

### bash

Если вы используете `bash` и у вас установлен пакет `bash-completion`, выполните следующую команду и перелогиньтесь:

    bem completion > /path/to/etc/bash_completion.d/bem

Если вы не используете `bash-completion`, можете добавить вывод `bem completion` себе в `.bashrc`, а затем перезагрузить:

    bem completion >> ~/.bashrc
    source ~/.bashrc

### zsh

Если вы используете `zsh`, можете добавить вывод `bem completion` себе в `.zshrc` и перезагрузите его:

    bem completion >> ~/.zshrc
    source ~/.zshrc
