# Установка
Для установки `bem-tools` вам потребуются [NodeJS 0.8+](http://nodejs.org/) (или выше) и [npm 1.2.14](http://npmjs.org/) (или выше).
Для инсталляции пакета достаточно применить команду `npm -g install bem`.

Стандартная процедура установки:

1. [Установите](https://github.com/joyent/node/wiki/Installation) `NodeJS`.

2. Установите `npm`:

        curl https://npmjs.org/install.sh | sudo sh

3. После установки сконфигурируйте `NODE_PATH`:

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.bashrc && . ~/.bashrc

    или

        echo 'export NODE_PATH="'$(npm root -g)'"'>> ~/.zshrc && . ~/.zshrc

4. Установите [bem-tools](https://github.com/bem/bem-tools):

        npm install bem

 * Для установки самой последней версии `bem-tools` воспользуйтесь командой

        npm install bem@unstable

# Использование
Всю информацию о параметрах использования можно получить используя команду `bem --help`.

Информация о конкретной команде или подкоманде:

* `bem COMMAND --help`
* `bem COMMAND SUBCOMMAND --help`.

## Автодополнение в командной строке

### bash

Если вы используете `bash` и у вас установлен пакет `bash-completion`, выполните следующую команду и перелогиньтесь:

    bem completion > /path/to/etc/bash_completion.d/bem

Если вы не используете `bash-completion`, добавьте вывод `bem completion` себе в `.bashrc` и выполните перезагрузку:

    bem completion >> ~/.bashrc
    source ~/.bashrc

### zsh

Если вы используете `zsh`, добавьте вывод `bem completion` себе в `.zshrc` и выполните перезагрузку:

    bem completion >> ~/.zshrc
    source ~/.zshrc
