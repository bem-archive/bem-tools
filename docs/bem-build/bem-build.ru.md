# bem build

С помощью команды `bem build` можно собирать файлы страниц для различных технологий,
основываясь на декларации страницы.

## Создание файла bemdecl.js по bemjson-декларации страницы

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemjson.js -t bemdecl.js \
        -o pages/index -n index

Значением флага -t может быть как название технологии, так и полный путь до модуля
технологии. В этом модуле указано, как именно по декларации собирается конечный файл.

Например, модуль для `deps.js`: https://github.com/bem/bem-tools/blob/master/lib/techs/deps.js.js

## Создание файла deps.js по bemdecl.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemdecl.js -t deps.js \
        -o pages/index -n index

### Создание js и css файлов страниц по deps.js

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

### Создание сборки с шаблонами bemhtml.js по файлу deps.js

    bem build \
        -l bem-bl/blocks-common -l bem-bl/blocks-desktop \
        -l blocks -l pages/index/blocks \
        -d pages/index/index.bemhtml.js \
        -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

Пример построения страниц при помощи `bem build` есть в демонстрационном
проекте на блоках `bem-bl`: https://github.com/toivonen/bem-bl-test/blob/master/GNUmakefile
