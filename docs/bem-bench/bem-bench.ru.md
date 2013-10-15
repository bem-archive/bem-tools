## bem bench — тестирование скорости шаблонов

Инструмент позволяет выполнять регрессионное тестирование производительности `BEMHTML` и `BH` шаблонов, сравнивая скорость выполнения шаблонов между указанными ревизиями проекта и текущей рабочей копией.

Результатом выполнения команды `bem bench` с ревизиями репозитория в качестве параметров (`bem bench -r HEAD~1 -r HEAD`) будет таблица, где:

 - `benchmark` — имя теста;
 - столбцы с результатами тестируемых ревизий: количество выполнений шаблонов в секунду и `RME` — относительная погрешность, выраженная процентно от среднего арифметического. По `RME` можно судить, насколько истинны результаты тестирования;
 - `RME-stat` — показывает, был ли сильный скачек в погрешностях. Как определяется стабильность состояния? Находится максимальная и минимальная `RME` по одному тесту, если их разность превышает допустимую погрешность `5%` (величина была получена в ходе экспериментов и она изменима), то такое состояние считается нестабильным (`unstable`), в ином случае — стабильным (`stable`).

Следствием значительного разброса `RME` является загруженность CPU в момент тестирования. По возможности необходимо выгружать фоновые процессы и ПО, активно использующее CPU. Не стоит доверять результатам тестов при значительном разбросе `RME`.

![Результаты](https://raw.github.com/bem/bem-bench/dev/bem-bench.ru.jpg "Рисунок 1 — Результаты тестирования")

*Рис. 1 — Результаты тестирования*

#### Опции

 Опция | Алиас   | Описание|
:-------:|:-------:| :-------|
| `--no-wc` | `-w` | Позволяет запустить тесты не используя рабочую копию. |
| `--revision` | `-r` | Позволяет указать ревизии, между которыми будет выполняться сравнение. |
| `--rme` | | Позволяет изменить допустимое значение погрешности для `RME-stat`. Значение по умолчанию — `5%`. |
| `--rerun` |  | Позволяет запустить тесты пропуская этап сборки, используя тесты собранные в предыдущий запуск. |
| `--techs` | `-t` | Позволяет указать конкретный шаблонизатор. Аргументы - `bh`, `bemhtml`. |
| `--delay` | `-d` | **"Активное ожидание"** — задержка в секундах между запусками пакетов тестов для сглаживания `RME`. Значение по умолчанию `20` сек. Это значение напрямую влияет на `RME`. Эксперементы показали, что при использовании режима `NO MAKE` параметр `--delay` можно устанавливать в `0`.|

При запуске `bem bench` без аргументов, будет протестирована рабочая копия проекта со всеми найдеными уровнями переопределения в технологии **benchmarks**. Если необходимо протестировать конкретные тесты или уровни с тестами, то их необходимо указать аргументами, например:

`bem bench desktop.benchmarks -r HEAD`

`bem bench desktop.benchmarks touch-phone.benchmarks:button -r HEAD`

#### Конфигурирование проекта для запуска тестов, на примере `project-stub`

Для запуска `bem bench` необходимо внести следующие изменения в конфигурационные файлы проекта:

1. В файлe `.bem/make.js` в методы `getTechs()` и `getLevels()` класса `BundleNode`, которые указывают, какие технологии собирать для тестов и какие уровни использовать, напишите следующий код:

    ```js
    MAKE.decl('BundleNode', {
    
        getTechs: function() {
            
            if (PATH.basename(this.level.dir) === 'benchmark.bundles')  {
                return [
                    'bemjson.js',
                    'bemdecl.js',
                    'deps.js',
                    'bemhtml',
                    'bh' // опционально
                ];
            }

            return this.__base(tech);

        },

        getLevels: function(tech) {

            if (PATH.basename(this.level.dir) === 'benchmark.bundles') {
                return ['../bem-bl/blocks-common',
                        '../bem-bl/blocks-desktop',
                        '../common.blocks',
                        '../bem-bl-bh/blocks-common',  // опционально
                        '../bem-bl-bh/blocks-desktop', // опционально
                        '../desktop.blocks']
                    .map(PATH.resolve.bind(PATH, __dirname));
            }

            return this.__base(tech);

        }
    });
    ```

2. Создайте конфигурационный файл уровня переопределения `.bem/levels/benchmarks.js`, добавьте в него:

    ```js
    var PATH = require('path');
    
    exports.baseLevelPath = require.resolve('./bundles.js');
    
    exports.getTechs = function() {
    
        return {
            'bemjson.js'    : PATH.resolve(__dirname, '../techs/bemjson.js'),
            'bemdecl.js'    : 'bemdecl.js',
            'deps.js'       : 'deps.js',
            'bemhtml'       : PATH.resolve(__dirname, '../../bem-bl/blocks-common/i-bem/bem/techs/bemhtml.js'),
            'bh'            : PATH.resolve(__dirname,'../techs/bh.js') // опционально
        };
    
    };
    
    // Create bundles in bemjson.js tech
    exports.defaultTechs = ['bemjson.js'];
    ```
    В файле `./bem/level.js` задекларируйте технологию **benchmarks** в методе `getTech()`:
    
    ```
    'benchmarks' : 'level-proto'
    ```

3. Создайте уровень/уровни переопределения для тестов

    ```
    bem create -T benchmarks -b desktop -b touch-phone -b touch-pad
    ```

    Модуль `bh` технологи находится в pull request - https://github.com/bem/project-stub/pull/14. В этом pull request проект уже сконфигурирован для сборки и тестирования BH шаблонов.
    
    Тесты должны находится в директории `benchmark.bundles/` в корне проекта.

    *Пример расположения файлов:*
    ```
    benchmark.bundles/
        logo/
            logo.bemjson.js
        link/
            link.bemjson.js
        mix-input-button/
            mix-input-button.bemjson.js
    ```
    
#### Кастомизация сборки

Перед сборкой каждой ревизии осуществляется поиск скрипта в секции `bem-bench-build` в `package.json` на уровне проекта. Для более короткой записи, в переменную окружения `PATH` дописывается путь к `./node_modules/.bin/`.

```javascript
  "scripts": {
    "bem-bench-build": "npm install && bem make ..."
  }
```
Если скрипт не будет найден, будет выполнена сборка по умолчанию: `npm install && ./node_modules/.bin/bem make ...`

Если сборку необходимо выполнять по конкретным целям, определенным через опцию **-b**, то необходимо добавить параметр **$targets** в строку скрипта, тогда все перечисленые цели будут записаны в этот параметр.

```javascript
  "scripts": {
    "bem-bench-build": "npm install && bem make $targets"
  }
```
