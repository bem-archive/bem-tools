# bem create

С помощью `bem create` можно создавать сущности:

 * уровни переопределения
 * блоки
 * элементы
 * модификаторы

## Уровень переопределения

Уровень переопределения – это директория, в которой хранятся реализации
блоков и служебная директория `.bem`.

В `.bem` хранятся настройки этого уровня переопределения:

 * соглашения об именовании
 * ссылки на модули технологий

[Пример](https://github.com/bem/bem-bl/tree/support/0.9.x/blocks-desktop/.bem/level.js) настройки ссылок на модули технологий (уровень `blocks-desktop`
библиотеки блоков `bem-bl`).


### Создание уровня переопределения blocks в текущей директории

Чтобы создать уровень переопределения для блока, используйте команду:

    bem create level blocks

### Создание уровня переопределения для страниц

В терминах `bem-tools` страницы тоже являются блоками, а директория со страницами
является уровнем переопределения. Создать такую директорию можно так:

    bem create level pages

### Создание уровня переопределения на основе существующего

Команда `bem create level` позволяет использовать существующий уровень переопределения
в качестве прототипа для создаваемого уровня:

    bem create level --level bem-bl/blocks-desktop blocks

## Блок

Блок – это набор файлов – реализаций блока в различных технологиях.

### Создание блока

Команда для создания блока:

    bem create block b-my-block

По умолчанию, блок создается с набором файлов всех технологий (BEMHTML, CSS, JS).

### Создание блока в определенной технологии

Использование флагов `-t` и (`-T`) позволяет создавать файлы блока нужных технологий:

    bem create block -t deps.js b-my-block
        // Помимо дефолтных, создаст реализацию в технологии deps.js

    bem create block -T css b-my-block
        // Создаст только технологию CSS для блока

    bem create block -T bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js b-my-block
        // Флаг -T удобно использовать, если нужно добавить новую технологию для уже существующего блока

В качестве значения флага может быть указано название технологии (например, `css`)
или путь до модуля технологии.

Названия технологий могут быть указаны в файле `.bem/level.js` уровня переопределения.
[Пример файла](https://github.com/bem/bem-bl/tree/support/0.9.x/blocks-desktop/.bem/level.js).

Примеры реализации модулей технологий можно увидеть в [репозитории](https://github.com/bem/bem-tools/tree/support/0.9.x/lib/techs/v2).

### Создание элемента блока

Создание элемента `elem` для блока `b-my-block`:

    bem create elem -b b-my-block elem

### Создание модификатора блока или элемента

Создание модификатора `mod` для блока `b-my-block`:

    bem create mod -b b-my-block mod

Создание модификатора `mod` в значении `val` для блока `b-my-block`:

    bem create mod -b b-my-block mod -v val

Создание модификатора `mod` для элемента `elem` блока `b-my-block`:

    bem create mod -b b-my-block -e elem mod

Создание модификатора `mod` в значении `val` для элемента `elem` блока `b-my-block`:

    bem create mod -b b-my-block -e elem mod -v val

### Создание произвольной БЭМ-сущности с помощью команды bem create

При помощи команды `bem create` можно создавать произвольные БЭМ-сущности или даже наборы сущностей.

Создание блоков `b-block1` и `b-block2`:

    bem create -b b-block1 -b b-block2

Создание элементов `elem1` и `elem2` для блока `b-block`:

    bem create -b b-block -e elem1 -e elem2

Создание модификатора `mod` блока `b-block`:

    bem create -b b-block -m mod

Создание модификатора `mod` блока `b-block` в значениях `val1` и `val2`:

    bem create -b b-block -m mod -v val1 -v val2

Создание модификатора `mod` элемента `elem` блока `b-block`:

    bem create -b b-block -e elem -m mod

Создание модификатора `mod` в значениях `val1` и `val2` для элемента `elem` блока `b-block`:

    bem create -b b-block -e elem -m mod -v val1 -v val2

## Создание файла bemdecl.js по BEMJSON-декларации страницы

    bem create \
        -l pages \
        -b index \
        -T bemdecl.js

# bem build

С помощью команды `bem build` можно собирать файлы страниц для различных технологий,
основываясь на декларации страницы.

Значением флага `-t` может быть как название технологии, так и полный путь до модуля
технологии. В этом модуле указано, как именно по декларации собирается конечный файл.

Например, [модуль](https://github.com/bem/bem-tools/blob/support/0.9.x/lib/techs/v2/deps.js.js) для `deps.js`.

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
        -d pages/index/index.deps.js \
        -t bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js \
        -o pages/index -n index

# bem decl

`bem decl` позволяет работать с файлами деклараций, а именно:

 * объединять несколько деклараций в одну;
 * «вычитать» декларации, то есть получать разницу между ними.

Для всех подкоманд `bem decl` в качестве входных деклараций (ключ `-d`) могут выступать как файлы в формате `bemdecl.json`, так и в `deps.js`.

На выходе (ключ `-o`) всегда получается файл в формате `deps.js`.

## bem decl merge

Команда `bem decl merge` объединяет несколько деклараций в одну. Она бывает полезна в ситуациях,
когда, например, вам нужно произвести общую сборку для нескольких страниц.

### Создание декларации для всех страниц

    bem decl merge \
        -d pages/index/index.deps.js \
        -d pages/about/about.deps.js \
        -d pages/search/search.deps.js \
        -o pages/common/common.deps.js

## bem decl subtract

Команда `bem decl subtract` «вычитает» из первой указанной декларации все остальные. Она полезна
в ситуациях, когда, например, вам нужно создать бандл, который будет догружаться на страницу
по требованию.

### Создание декларации для подгружаемого по требованию «тяжелого» блока

    bem decl subtract \
        -d bundles/heavy-block/heavy-block.deps.js \
        -d pages/common/common.deps.js \
        -o bundles/heavy-block/heavy-block.bundle.js

# bem make
В команде `bem make` реализована сборка БЭМ проектов. Узнать больше о системах сборки можно из [доклада](https://events.yandex.ru/lib/talks/321/) Сергея Белова.

В общем случае, `bem make` собирает проект следующим образом:

 * подключает библиотеки блоков
 * выполняет сборку в уровнях переопределения
 * выполняет сборку бандлов
 * собирает шаблоны (`bemhtml`)
 * собирает `HTML` из `bemjson.js`
 * собирает статические файлы (`JS`, `CSS`)
 * раскрывает `@import` в `CSS`-файлах (`borschik`)
 * раскрывает `borschik:link:include` в `JS`-файлах (`borschik`)
 * сжимает `CSS`-файлы при помощи `CSSO`
 * сжимает `JS`-файлы при помощи `UglifyJS`

# bem server

Команда `bem server` запускает веб-сервер разработчика, который делает доступными по HTTP файлы, собранные `bem make`, на лету. При разработке статических страниц по БЭМ-методу, достаточно просто внести изменения в файлы проекта и обновить страницу в браузере: файлы, которые затронули сделанные вами изменения, будут автоматически пересобраны.

Если же в вашем проекте нет статических страниц, вы можете настроить бэкенд и окружение таким образом, чтобы он обращался к `bem server` за файлами стилей и скриптов: `bem server` позволяет общаться с ними через привычный TCP socket или через UNIX domain socket.

По умолчанию, корневым каталогом веб-сервера считается текущая директория. Вы можете указать нужный каталог с помощью
ключа `--project` (`-r`). Таким образом, если в корне есть файл `pages/about/main.css`, то он будет доступен из браузера
по адресу `http://localhost:8080/pages/about/main.css`.

TCP, который слушает сервер по умолчанию, - 8080. Вы можете указать другой порт, используя ключ `--port (-p)`.

Когда запрашиваемый URL соответствует директории, сервер проверяет, возможно ли собрать для запрошенной директории файл
`index.html`. Если это так, страница будет собрана и отдана браузеру. В ином случае браузер получит листинг файлов в директории.
