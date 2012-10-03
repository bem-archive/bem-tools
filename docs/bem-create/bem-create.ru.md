# bem create

С помошью `bem create` можно создавать сущности:

 * уровни переопределения
 * блоки
 * элементы
 * модификаторы

## Уровень переопределения

Уровень переопределения -- это директория, в которой хранятся реализации
блоков и служебная директория `.bem`.

В `.bem` хранятся настройки этого уровня переопределения:

 * соглашения об именовании
 * ссылки на модули технологий

Пример настройки ссылок на модули технологий (уровень `blocks-desktop`
библиотеки блоков `bem-bl`):

    https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

### Создание уровня переопределения blocks в текущей директории:

    bem create level blocks

### Создание уровня для страниц

В терминах `bem-tools` страницы тоже блоки, директория со страницами
является уровнем переопределения. Создать такую директорию можно так:

    bem create level pages

### Создание уровня переопределения на основе существующего

Команда `bem create level` позволяет использовать существующий уровень переопределения
в качестве прототипа для создаваемого уровня.

    bem create level --level bem-bl/blocks-desktop blocks

## Блок

Блок -- это набор файлов -- реализаций блока в различных технологиях.

### Создание блока

    bem create block b-my-block

По умолчанию блок создаётся с набором файлов для всех технологий по-умолчанию (`bemhtml`, `css`, `js`).

### Создание блока в определённой технологии

Использование флагов -t (-T) позволяет создавать файлы блока нужных технологий:

    bem create block -t deps.js b-my-block
        // Создаст реализацию в технологии deps.js помимо дефолтных

    bem create block -T css b-my-block
        // Создаст только технологию CSS для блока

    bem create block -T bem-bl/blocks-desktop/i-bem/bem/techs/bemhtml.js b-my-block
        // Флаг -T удобно использовать, если нужно добавить новую технологию для уже существующего блока

В качестве значения флага может быть указано название технологии (например, `css`)
или путь до модуля технологии.

Названия технологий могут быть указаны в файле `.bem/level.js` уровня переопределения.
Например, https://github.com/bem/bem-bl/blob/master/blocks-desktop/.bem/level.js

Примеры реализации модулей технологий можно увидеть в репозитории:

    https://github.com/bem/bem-tools/tree/master/lib/techs

### Создание элемента блока

Создание элемента `elem` для блока `b-my-block`

    bem create elem -b b-my-block elem

### Создание модификатора блока или элемента

Создание модификатора `mod` для блока `b-my-block`

    bem create mod -b b-my-block mod

Создание модификатора `mod` в значении `val` для блока `b-my-block`

    bem create mod -b b-my-block mod -v val

Создание модификатора `mod` для элемента `elem` блока `b-my-block`

    bem create mod -b b-my-block -e elem mod

Создание модификатора `mod` в значении `val` для элемента `elem` блока `b-my-block`

    bem create mod -b b-my-block -e elem mod -v val

### Создание произвольной БЭМ сущности используя только команду `bem create`

При момощи команды `bem create` можно создавать произвольные БЭМ сущности или даже наборы сущностей.

Создание блоков `b-block1` и `b-block2`

    bem create -b b-block1 -b b-block2

Создание элементов `elem1` и `elem2` для блока `b-block`

    bem create -b b-block -e elem1 -e elem2

Создание модификатора `mod` блока `b-block`

    bem create -b b-block -m mod

Создание модификатор `mod` блока `b-block` в значениях `val1` и `val2`

    bem create -b b-block -m mod -v val1 -v val2

Создание модификатора `mod` элемента `elem` блока `b-block`

    bem create -b b-block -e elem -m mod

Создание модификатора `mod` в значениях `val1` и `val2` для элемента `elem` блока `b-block`

    bem create -b b-block -e elem -m mod -v val1 -v val2
