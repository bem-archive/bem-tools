# bem decl

`bem decl` позволяет работать с файлами деклараций, а именно:

 * объединять несколько деклараций в одну
 * «вычитать» декларации, то есть получать разницу между ними

Для всех подкоманд `bem decl` в качестве входных деклараций (ключ `-d`) могут выступать
файлы как в формате `bemdecl.json`, так и файлы в формате `deps.js`.

На выходе (ключ `-o`) всегда получается файл в формате `deps.js`.

## bem decl merge

`bem decl merge` объединяет несколько деклараций в одну. Она бывает полезна в ситуациях,
когда, например, вам нужно собрать общую сборку для нескольких страниц.

### Создание декларации для всех страниц

    bem decl merge \
        -d pages/index/index.deps.js \
        -d pages/about/about.deps.js \
        -d pages/search/search.deps.js \
        -o pages/common/common.deps.js

## bem decl subtract

`bem decl subtract` «вычитает» из первой указанной декларации все остальные. Она полезна
в ситуациях, когда, например, вам нужно сделать бандл, которые будет догружатся на страницу
по требованию.

### Создание декларации для подгружаемого по требованию «тяжёлого» блока

    bem decl subtract \
        -d bundles/heavy-block/heavy-block.deps.js \
        -d pages/common/common.deps.js \
        -o bundles/heavy-block/heavy-block.bundle.js
