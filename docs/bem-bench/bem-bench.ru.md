***
## bem bench - тестирование скорости шаблонов
***
#### Общие сведения
Инструмент позволяет выполнять регрессионные тесты производительности `BEMHTML` шаблонов, то есть тесты между версиями, в данном случае между ревизиями репозитория, и выявлять стабильность текущего состояния файловой системы относительно указанных ревизий, либо между конкретными ревизиями. В качестве **benchmarks** используются `bemjson` деревья.

Инструмент наиболее полезен именно при тестировании с включением текущего состояния файловой системы.

Результатами тестирования является `HZ` - кол-во выполнений в единицу времени(в данном случае в секунду), а так же `RME` - относительная погрешность выраженная процентно от среднего арифметического, по этой величине можно судить, насколько истины результаты тестирования.

#### Эталонные бенчмарки
Так как **benchmarks** могут как и проект меняться от ревизии к ревизии, то логично определять эталонные, те которые будут исходными для всех ревизий. В большинстве случаев это не понадобится, но все же подобная ситуация может возникнуть. По умолчанию абсолютный приоритет имеет `current_state`, то есть из текущего состояния файловой системы копируются **benchmarks** в остальные ревизии. Если запуск осуществился с флагом `-w` (без текущего состояния файловой системы), то benchmarks будут копироваться из самой свежей по дате ревизии.
#### Состояние(RME)

`RME stat` показывает разброс(в данном случае разность между `max` и `min` значениями) в общем случае.

Стоит отметить, что следствием значительного разброса `RME` является загруженность `CPU` в момент тестирования. По возможности необходимо выгружать фоновые процессы и ПО активно использующее `CPU`. Не стоит полагаться на цифру `HZ` при значительном разбросе `RME`.

Алгоритм определения стабильности `RME`: находится максимальная и минимальная `RME`, если их разность привышает допустимую погрешность `5%`(величина была получана в ходе эксперементов и она изменима), то такое состояние считается `unstable` в ином случае `stable`.

#### Визуальный результат

![desc](http://s018.radikal.ru/i528/1306/da/2f2c006b96d1.jpg)

#### Команды

 - `-w` `--wcs` : позволяет запустить тестирование без включения текущего состояния файловой системы.
 
 - `-b` `--benchmark`: принимает 1 параметр, которым является конкретный **benchmark**, возможно указать одновременно несколько benchmaks(`-b b-logo` `-b b-link`), в данном режиме не собирается весь проект, а конкретные **benchmarks**, отсюда прирост в скорости при сборке.
 
 - `-dr` `--delta-rme` : позволяет изменить допустимое значение погрешности разброса `RME`. Значение по умолчанию = **5%**.
 
 - `-ob` `--only-bench` : позволяет запустить тест пропуская этап сборки, необходимо понимать, что только собранные в последний раз **benchmarks** могут быть готовы к тестам, в этом режиме допускаются все вышеописанные команды.
 
 - `-wait` : ( **активное ожидание** ) принимает числовой параметр, которым является задержка в секундах. Данная задержка необходима между запусками пакетов тестов, для сглаживания разброса результирующих значений. Значение по умолчанию `20сек`. Напрямую влияет на `RME`.
 
#### Конфигурирование проекта

Для запуска **bem-bench** необходимо внести несколько изменений в конфигурационные файлы проекта. В примере использовался **project-stub**.

1) Необходимо дописать следующий код  в метод `getTechs`, в файлe `./.bem/make.js`, который указывает, какие технологии собирать для benchmarks.

```js

MAKE.decl('BundleNode', {

    getTechs: function() {
        
        if (PATH.basename(this.level.dir) === 'benchmark.bundles')  {
            return [
                'bemjson.js',
                'bemdecl.js',
                'deps.js',
                'bemhtml'
            ];
        }
        ...
    }
});    
        
```

2) Создать конфигурационный файл уровня переопределения `./.bem/levels/benchmarks.js`, с содержимым:

```js
var BEM = require('bem');
    PATH = require('path'),

    pjoin = PATH.join,
    presolve = PATH.resolve.bind(null, __dirname),

    PRJ_ROOT = presolve('../../'),

    PRJ_TECHS = presolve('../techs/'),
    BEMBL_TECHS = pjoin(PRJ_ROOT, 'bem-bl/blocks-common/i-bem/bem/techs');


exports.baseLevelPath = require.resolve('./bundles.js');

exports.getConfig = function() {

    return BEM.util.extend(this.__base() || {}, {
        bundleBuildLevels: this.resolvePaths([
            '../../bem-bl/blocks-common',
            '../../bem-bl/blocks-desktop',
            '../../common.blocks',
            '../../desktop.blocks'
        ])
    });

};

exports.getTechs = function() {

    return {
        'bemjson.js'    : pjoin(PRJ_TECHS, 'bemjson.js'),
        'bemdecl.js'    : 'bemdecl.js',
        'deps.js'       : 'deps.js',

        'bemhtml'       : pjoin(BEMBL_TECHS, 'bemhtml.js')
    };

};

// Create bundles in bemjson.js tech
exports.defaultTechs = ['bemjson.js'];
```

3) В корне проекта создать файл `./benchmark.bundles/.bem/level.js`, в котором подключить `benchmarks.js`:
```js
exports.baseLevelPath = require.resolve('../../.bem/levels/benchmarks.js');
```

Benchmsrks должны находится в директории `./benchmark.bundles/`

*Пример расположения файлов:*
```
 benchmark.bundles/
        b-logo/
            b-logo.bemjson.js
        b-link/
            b-link.bemjson.js
        b-mix-input-button/
            b-mix-input-button.bemjson.js    
```

#### Пример

Тестирование **bem-bl**. Стандартный **project-stub** использующий **bem-bl** библиотеку блоков. Тестирование двух предыдущих ревизий и текущего состояния файловой системы.

benchmark (bemjson дерево) взят из **examples** 

`./benchmark.bundles/b-link/b-link.bemjson.js`: 

```js
({
    block: 'b-page',
    title: 'b-link_inner_yes',
    head: [
        { elem: 'css', url: '_30-b-link_inner.css' },
        { elem: 'css', url: '_30-b-link_inner.ie.css', ie: true },
        { block: 'i-jquery', elem: 'core' },
        { elem: 'js', url: '30_b-link_inner.js' }
    ],
    content: [
        {
            attrs: { style: 'margin: 20px 0 20px 20px;' },
            content: {
                block: 'b-link',
                mods: { inner: 'yes' },
                url: '#',
                content: [
                    {
                        block: 'b-icon',
                        url: 'http://yandex.st/lego/_/Kx6F6RQnQFitm0qRxX7vpvfP0K0.png',
                        alt: '16x16 icon'
                    },
                    {
                        elem: 'inner',
                        content: 'Link with icon 16x16'
                    }
                ]
            }
        },
        {
            attrs: { style: 'font-size: 120%; margin: 20px 0 20px 20px;' },
            content: {
                block: 'b-link',
                mods: { pseudo: 'yes', inner: 'yes' },
                url: 'http://ya.ru',
                content: [
                    {
                        block: 'b-icon',
                        url: '//yandex.st/lego/_/JMzwbLLDYCwdJBeYmjJFITN6lGI.png',
                        alt: '24x24 icon'
                    },
                    {
                        elem: 'inner',
                        content: 'Pseudo-link with icon 24x24'
                    }
                ]
            }
        },
        {
            attrs: { style: 'font-size: 140%; margin: 20px 0 20px 20px;' },
            content: {
                block: 'b-link',
                mods: { pseudo: 'yes', inner: 'yes' },
                url: 'http://ya.ru',
                content: [
                    {
                        block: 'b-icon',
                        url: '//yandex.st/lego/_/7mx2-iHmpGYwkJ_7qdwuo9cpKkg.png',
                        alt: '48x48 icon'
                    },
                    {
                        elem: 'inner',
                        content: 'Pseudo-link with icon 48x48'
                    }
                ]
            }
        }
    ]

})

```    

benchmark (bemjson дерево) взят из **examples** 

`./benchmark.bundles/b-logo/b-logo.bemjson.js`:

```js    

({
    block: 'b-page',
    title: 'b-logo',
    head: [
        { elem: 'css', url: '_20-b-logo_link.css' }
    ],
    content: [
        {
            block: 'b-logo',
            content: {
                elem: 'link',
                url: '/',
                title: 'logo',
                icon: {
                    elem: 'icon',
                    url: '../../../../blocks-desktop/b-logo/examples/20-b-logo_link.blocks/b-logo/b-logo.png',
                    alt: 'logo'
                }
            }
        }
    ]
})

```    
*Запуск* **bem bench**:

```
.../project-stub$ bem bench HEAD~1 HEAD

10:40:47.571 - info: Cleaning a TMP folder
10:40:47.916 - info: TMP folder has been cleaned: 343ms
10:40:47.917 - info: Include current_state
10:40:47.970 - info: Create revision [HEAD~1]: 48ms
10:40:47.972 - info: Create revision [HEAD]: 34ms
10:40:48.019 - info: Create revision [current_state]: 102ms
10:40:48.020 - info: Latest revision is - current_state
10:40:48.082 - info: Make...
10:41:20.994 - info: [current_state] has been assembled: 32897ms
10:41:21.029 - info: [HEAD] has been assembled: 32938ms
10:41:21.030 - info: [HEAD~1] has been assembled: 32947ms
10:41:21.031 - info: Benchmark...
10:41:21.031 - info: Wait 20sec
10:41:52.260 - info: [HEAD~1 => b-link] has been tested: 11205ms
10:42:03.276 - info: [HEAD~1 => b-logo] has been tested: 11006ms
10:42:03.278 - info: Wait 20sec
10:42:34.397 - info: [HEAD => b-link] has been tested: 11110ms
10:42:45.364 - info: [HEAD => b-logo] has been tested: 10958ms
10:42:45.366 - info: Wait 20sec
10:43:16.480 - info: [current_state => b-link] has been tested: 11105ms
10:43:27.460 - info: [current_state => b-logo] has been tested: 10970ms
10:43:27.547 - info: All time: 159976ms

```    

*Результаты*:   

```
┌───┬───────────┬───────────────────────┬──────────────┬────────────────┬──────────┐
│ № │ benchmark │ current_state(hz/rme) │ HEAD(hz/rme) │ HEAD~1(hz/rme) │ RME stat │
├───┼───────────┼───────────────────────┼──────────────┼────────────────┼──────────┤
│ 1 │ b-link    │ [3.5] ±1.5%           │ [3.5] ±1.7%  │ [3.6] ±1.8%    │ stable   │
│ 2 │ b-logo    │ [9.8] ±0.5%           │ [9.8] ±0.4%  │ [9.5] ±0.5%    │ stable   │
└───┴───────────┴───────────────────────┴──────────────┴────────────────┴──────────┘

```

Запуск **bem-bench** на той же конфигурации без сборки, на конкретном **benchmark**, с активным ожиданием между тестами  - **10** секунд.

```   
.../project-stub$ bem bench -ob -b b-link -wait 10 HEAD
    
10:54:10.166 - info: [ONLY BENCHMARKS] mode
10:54:10.168 - info: Include current_state
10:54:10.483 - info: Benchmark...
10:54:10.483 - info: Wait 10sec
10:54:31.738 - info: [current_state => b-link] has been tested: 11231ms
10:54:31.743 - info: Wait 10sec
10:54:52.864 - info: [HEAD => b-link] has been tested: 11112ms
10:54:52.870 - info: All time: 42704ms

```

*Результат:*

```
┌───┬───────────┬───────────────────────┬──────────────┬──────────┐
│ № │ benchmark │ current_state(hz/rme) │ HEAD(hz/rme) │ RME stat │
├───┼───────────┼───────────────────────┼──────────────┼──────────┤
│ 1 │ b-link    │ [3.5] ±1.6%           │ [3.5] ±1.5%  │ stable   │
└───┴───────────┴───────────────────────┴──────────────┴──────────┘
```

Эксперементы показывают, что при использовании режима `ONLY BECHMARKS` параметр `-wait` можно устанавливать в **0**.
