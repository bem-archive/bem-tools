# БЭМ-инструменты
Работа с файлами, написанными по БЭМ-методу.

## Установка
Вам потребуется [NodeJS 0.4.x](http://nodejs.org/) и [npm](http://npmjs.org/).
После этого достаточно `npm install bem xjst ometajs`.

#### Установка на MacOSX

 * Установить [Xcode](http://h.yandex.net/?http%3A%2F%2Fru.wikipedia.org%2Fwiki%2FXcode)
 с установочного диска или с [сайта Apple](http://h.yandex.net/?http%3A%2F%2Fdeveloper.apple.com%2Ftools%2Fxcode%2F)
 * Установить [homebrew](http://h.yandex.net/?https%3A%2F%2Fgithub.com%2Fmxcl%2Fhomebrew)

        ruby -e "$(curl -fsSL https://gist.github.com/raw/323731/install_homebrew.rb)"
 * Установить [nodejs](http://h.yandex.net/?http%3A%2F%2Fnodejs.org%2F)

        brew install node
 * Установить [npm](http://h.yandex.net/?http%3A%2F%2Fnpmjs.org%2F)

        curl http://npmjs.org/install.sh | sh
 * Установить [bem-tools](http://h.yandex.net/?https%3A%2F%2Fgithub.com%2Fbem%2Fbem-tools)

        npm install bem xjst ometajs

## Использование
Всю информацию о параметрах использования можно получить с помощью `bem --help`.
Для информации о конкретной команде и подкомманде: `bem COMMAND --help` и `bem COMMAND SUBCOMMAND --help`.

### Консольные команды
#### bem create

С помошью `bem create` можно создавать сущности:

 * уровни переопределения
 * блоки
 * элементы
 * модификаторы

##### Уровень переопределения

Уровень переопределения это директория, в которой хранятся реализации
блоков и служебная директория .bem (опциональна).

В `.bem` хранятся настройки этого уровня переопределения:

 * соглашения об именовании
 * шоткаты технологий

Пример настройки шоткатов технологий (уровень blocks-desktop библиотеки
блоков bem-bl):

    https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

###### Создание уровня переопределения blocks в текущей директории:

    bem create level blocks

###### Создание уровня для страницы

В терминах `bem-tools` страницы -- это тоже блоки, директория со страницами
является уровнем переопределения. Создать такую директорию можно так:

    bem create level pages

###### Создание уровня переопределения на основе существующего

Команда `bem create level` позволяет использовать существующий уровень переопределения
в качестве прототипа для создаваемого уровня.

    bem create level -l bem-bl/blocks-desktop/.bem/level.js blocks

##### Блок

Блок -- это директория с файлами реализаций в различных технологиях.

###### Создание блока

    bem create block b-my-block

По умолчанию блок создаётся с набором файлов для всех дефолтных технологий (`bemhtml`, `css`, `js`).

###### Создание блока в определённой технологии

Использование флагов -t (-T) позволяет создавать файлы блока нужных технологий:

    bem create block -t deps.js b-my-block
        // Создаст реализацию в технологии deps.js помимо дефолтных
    bem create block -T css b-my-block
        // Создаст только технологию CSS для блока
    bem create block -T bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js b-my-block
        // Флаг -T удобно использовать, если нужно добавить новую технологию для уже существующего блока

В качестве значения флага может быть указан шоткат технологии (например, `css`) или путь
до шаблона технологии.
Шоткаты технологий могут быть указаны в .bem/level.js уровня переопределения.
Например, https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

Примеры реализации шаблонов для ращличных технологий можно увидеть
в репозитории:

    https://github.com/bem/bem-tools/tree/nodejs/lib/techs

#### bem build

С помощью `bem build` можно собирать файлы страниц для различных
технологий, основываясь на декларации страницы.

###### Создание файла bemdecl.js по bemjson-декларации страницы

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemjson.js -t bemdecl.js \
        -o pages/index -n index

Значением флага -t может быть как шоткат технологии, так и полный путь
до js-шаблона технологии. В этом js-шаблоне указано, как именно по декларации
собирается конечный файл.
Например, шаблон для `deps.js`: https://github.com/bem/bem-tools/blob/8be03b70aab21814d324718dfda0b774eeeee29f/lib/techs/deps.js.js

###### Создание файла deps.js по bemdecl.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemdecl.js -t deps.js \
        -o pages/index -n index

###### Создание js и css файлов страниц по deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js -t css \
        -o pages/index -n index
    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.deps.js -t js \
        -o pages/index -n index

###### Создание сборки с шаблонами bemhtml.js по файлу deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemhtml.js -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

Пример построения страниц при помощи `bem build` есть в демонстрационном
проекте на блоках `bem-bl`: https://github.com/toivonen/bem-bl-test/blob/b99a25adf3a9bdbb6453cfd173ede6bee70ebfc1/GNUmakefile

#### bem decl

TODO: Описать bem decl
