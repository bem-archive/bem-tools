# deps.js — технология для декларирования зависимостей по БЭМ

Процесс сборки страницы в различных технологиях основан на декларации БЭМ-сущностей в БЭМ-дереве.

При этом существуют два способа формирования страницы:

  * **Статический** — полная сборка статической страницы и публикация готового результата;
  * **Динамический** — предварительная сборка статических файлов (CSS, JS, шаблоны), с последующим формированием
в runtime динамического БЭМ-дерева, на которое накладываются шаблоны.

В случае сборки статической страницы БЭМ-дерево содержит все БЭМ-сущности, кроме блоков без DOM-представления и блоков,
которые разворачиваются из шаблонов. Если в БЭМ-дереве (bemjson) мы указываем какой-то блок, то в процессе сборки все
необходимые для блока технологии (например, CSS и JS) будут автоматически собраны в общие файлы со всех уровней
переопределения.

При формировании динамической страницы, на этапе сборки проекта БЭМ-дерево отсутствует, соответственно для предварительной
генерации страницы нужно задекларировать все БЭМ-сущности, которые потребуются.

В обоих случаях для явного указания зависимостей от иных блоков, элементов, модификаторов и технологий используются файлы
технологии `deps.js`.

Например, шаблон `b1.bemhtml` содержит такой код:
```js
block b1, content: [
    {
        block: 'b2'
    },
    {
        block: 'b3'
    }
]
```

Чтобы подключить на проект стили и скрипты блоков `b2` и `b3`, нам понадобится создать файл `b1.deps.js` такого содержания:
```js
({
    mustDeps: { block: 'b2' },
    shouldDeps: { block: 'b3' }
})
```

Таким же образом необходимо декларировать элементы и модификаторы блоков, если они разнесены на файловой системе и не
отражены во входящем bemjson-файле.

## Синтаксис deps.js

Формат представления deps-сущности в файле `deps.js` имеет следующий синтаксис:
```js
({
    /* deps-сущность */
})
```

Эти сущности могут быть представлены в файле в виде массива. Например, когда необходимо указать зависимость для конкретной
технологии:
```js
([{
    /* deps-сущность 1 */
},{
    /* deps-сущность 2 */
}])
```

Полная запись deps-сущности имеет следующий вид:
```js
{
    block : 'bBlock',
    elem  : 'elem',
    mod   : 'modName',
    val   : 'modValue',
    tech  : 'techName',
    mustDeps   : [],
    shouldDeps : [],
    noDeps     : []
}
```

Все параметры deps-сущности не являются обязательными. При этом, параметры `block`, `elem`, `mod`, `val`, `tech` указывают,
для какой сущности необходимо подключить зависимость, а `mustDeps`, `shouldDeps`, `noDeps` определяют зависимость:

  * `block` (строка) — имя блока;
  * `elem` (строка) — имя элемента;
  * `mod` (строка) — имя модификатора;
  * `val` (строка) — значение модификатора блока;
  * `tech` (строка) — технология, для которой собираются зависимости (например, JS);
  * `mustDeps` (массив/объект) — определяются зависимости, которые гарантированно попадут в результаты сборки до кода
    блока, в котором эти зависимости объявляются;
  * `shouldDeps` (массив/объект) — определяются зависимости, порядок подключения которых не важен;
  * `noDeps` (массив/объект) — можно отменить какую-то зависимость (например, `i-bem__dom_init_auto`).

Поля, относящиеся к сущности, для которой декларируется зависимость, могут быть восстановлены из контекста по имени файла,
поэтому записи для файла `b1__e1_m1_v1.deps.js` эквивалентны:
```js
({
    block : 'b1',
    elem : 'e1',
    mod : 'm1',
    val : 'v1',
    mustDeps : { block : 'b2' }
})
```
и

```js
({
    mustDeps : { block : 'b2' }
})
```

Параметры `mustDeps`, `shouldDeps`, `noDeps` в качестве значения принимают БЭМ-сущности: `block`, `elem`, `mods`.
Также может быть использована расширенная запись БЭМ-сущностей, в которой элементы и модификаторы в качестве значения могут
принимать массив:
  * `elems` (массив) — позволяет подключить несколько элементов для блока, а также сам блок;
  * `mods` (объект) — объект, в ключах которого могут быть массивы.

Для декларации зависимостей от БЭМ-сущностей, которые по тем или иным причинам не присутствовали на этапе сборки,
необходимо объявить их в `mustDeps` или `shouldDeps`. Система сборки добавит эти объявления к плоскому списку `deps.js`-бандла,
на основании которого выполнится сборка технологий со всех уровней переопределения.

`noDeps` отменяет зависимости от более низких уровней переопределения до того уровня, на котором он объявлен.

## Механизм сборки

В предметной области БЭМ `deps.js` является технологией, которая подчиняется правилам сборки технологий.

По умолчанию, файл с описанием зависимостей располагается в корневой директории блока и имеет имя блока с расширением `.deps.js`.

В `deps.js` можно определять зависимости от блоков, элементов и модификаторов для всех видов технологий.

Предположим, что в проекте есть 4 уровня переопределения: библиотека `bem-core`, общие блоки, блоки платформы и блоки
страницы:
```
prj/
    libs/bem-core/common.blocks/
    common.blocks/
    desktop.blocks/
    desktop.bundles/page-name/blocks/
```

Указания в БЕМ-дереве `{ block: button }` достаточно, чтобы сборщик прошёл по всем уровням переопределения проекта и
подключил все соответствующие файлы:
```css
@import url(../../libs/bem-core/common.blocks/button/button.css);
@import url(../../common.blocks/button/button.css);
@import url(../../desktop.blocks/button/button.css);
@import url(blocks/button/button.css);
```
Сборка аналогична для любых других необходимых технологий (например, JS, шаблонов, документации и т.д.).

Предположим, в процессе исполнения БЭМ-дерево меняется, и блок `desktop.blocks/button` подключает в браузере элемент `e1`
из блока `common.blocks/button`.

Запись такой зависимости в `desktop.blocks/button/button.deps.js` может выглядеть так:
```js
({
    shouldDeps : { block : 'button', elem : 'e1' }
})
```

В результате сборки технологии CSS на проекте будут подключены следующие файлы:
```css
@import url(../../libs/bem-core/common.blocks/button/button.css);
@import url(../../common.blocks/button/button.css);
@import url(../../desktop.blocks/button/button.css);
@import url(blocks/button/button.css);
@import url(../../common.blocks/button/__e1/button__e1.css);
@import url(../../desktop.blocks/button/__e1/button__e1.css);
@import url(blocks/button/__e1/button__e1.css);
```
По зависимости подключатся все задекларированные БЭМ-сущности, находящиеся как на нижних уровнях, так и на уровнях,
которые расположены выше.

## Примеры декларации зависимостей

### Подключение только элемента

`elem` подключает только элемент, но не сам блок.
```js
{
    block : 'b1',
    elem : 'e1'
}
```

Аналогично для `mod` и `val`.

### Подключение нескольких элементов

Поведение `elems` немного отличается от `elem`, так как подключает вместе с элементами сам блок.
```js
{
    block : 'b1',
    elems : ['e1', 'e2']
}
```

Значение ключа `elems` может содержать не только имя, но и полное описание подключаемых элементов:
```js
{
    block : 'b1',
    elems : [
        { elem : 'e1' },
        { elem : 'e2', mods : { m1 : 'v1' } }
    ]
}
```

### Подключение зависимостей по технологии

Для того, чтобы в сборку клиентского JS попали шаблоны блока `b1` с модификатром `_m1_v1`, зависимости в `deps.js`-сущности
блока можно выразить следующим образом:
```js
{
    tech: 'js',
    mustDeps: [
        {
            block: 'b1',
            mods: { m1: 'v1' },
            tech: 'bemhtml'
        }
    ]
}
```