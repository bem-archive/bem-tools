/** @requires jquery.inherit */
/** @requires jquery.isEmptyObject */
/** @requires jquery.identify */
/** @requires jquery.observable */

(function($, undefined) {

/**
 * Хранилище для отложенных функций
 * @private
 * @type Array
 */
var afterCurrentEventFns = [],

/**
 * Хранилище деклараций блоков (хэш по имени блока)
 * @private
 * @type Object
 */
    blocks = {},

/**
 * Каналы сообщений
 * @static
 * @private
 * @type Object
 */
    channels = {};

/**
 * Строит имя метода-обработчика установки модификатора
 * @static
 * @private
 * @param {String} elemName имя элемента
 * @param {String} modName имя модификатора
 * @param {String} modVal значение модификатора
 * @returns {String}
 */
function buildModFnName(elemName, modName, modVal) {

    return (elemName? '__elem_' + elemName : '') +
           '__mod' +
           (modName? '_' + modName : '') +
           (modVal? '_' + modVal : '');

}

/**
 * Преобразует хэш обработчиков модификаторов в методы
 * @static
 * @private
 * @param {Object} modFns
 * @param {Object} props
 * @param {String} [elemName]
 */
function modFnsToProps(modFns, props, elemName) {

    $.isFunction(modFns)?
        (props[buildModFnName(elemName, '*', '*')] = modFns) :
        $.each(modFns, function(modName, modFn) {
            $.isFunction(modFn)?
                (props[buildModFnName(elemName, modName, '*')] = modFn) :
                $.each(modFn, function(modVal, modFn) {
                    props[buildModFnName(elemName, modName, modVal)] = modFn;
                });
        });

}

function buildCheckMod(modName, modVal) {

    return modVal?
        Array.isArray(modVal)?
            function(block) {
                var i = 0, len = modVal.length;
                while(i < len)
                    if(block.hasMod(modName, modVal[i++]))
                        return true;
                return false;
            } :
            function(block) {
                return block.hasMod(modName, modVal);
            } :
        function(block) {
            return block.hasMod(modName);
        };

}

/** @namespace */
this.BEM = $.inherit($.observable, /** @lends BEM.prototype */ {

    /**
     * @class Базовый блок для создания bem-блоков
     * @constructs
     * @private
     * @param {Object} mods модификаторы блока
     * @param {Object} params параметры блока
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(mods, params, initImmediately) {

        var _this = this;

        /**
         * кэш модификаторов блока
         * @private
         * @type Object
         */
        _this._modCache = mods || {};

        /**
         * текущие модификаторы в стэке установки
         * @private
         * @type Object
         */
        _this._processingMods = {};

        /**
         * параметры блока с учетом дефолтных
         * @protected
         * @type Object
         */
        _this.params = $.extend(_this.getDefaultParams(), params);

        initImmediately !== false?
            _this._init() :
            _this.afterCurrentEvent(_this._init);

    },

    /**
     * Инициализирует блок
     * @private
     */
    _init : function() {

        return this
            .setMod('js', 'inited')
            .trigger('init');

    },

    /**
     * Изменяет контекст передаваемой функции
     * @protected
     * @param {Function} fn
     * @param {Object} [ctx=this] контекст
     * @returns {Function} функция с измененным контекстом
     */
    changeThis : function(fn, ctx) {

        return fn.bind(ctx || this);

    },

    /**
     * Выполняет функцию в контексте блока после "текущего события"
     * @protected
     * @param {Function} fn
     * @param {Object} [ctx] контекст
     */
    afterCurrentEvent : function(fn, ctx) {

        this.__self.afterCurrentEvent(this.changeThis(fn, ctx));

    },

    /**
     * Запускает обработчики события у блока и обработчики live-событий
     * @protected
     * @param {String} e имя события
     * @param {Object} [data] дополнительные данные
     * @returns {BEM}
     */
    trigger : function(e, data) {

        this
            .__base(e = this.buildEvent(e), data)
            .__self.trigger(e, data);

        return this;

    },

    buildEvent : function(e) {

        typeof e == 'string' && (e = $.Event(e));
        e.block = this;

        return e;

    },

    /**
     * Проверят наличие модификатора у блока/вложенного элемента
     * @protected
     * @param {Object} [elem] вложенный элемент
     * @param {String} modName имя модификатора
     * @param {String} [modVal] значение модификатора
     * @returns {Boolean}
     */
    hasMod : function(elem, modName, modVal) {

        var len = arguments.length,
            invert = false;

        if(len == 1) {
            modVal = '';
            modName = elem;
            elem = undefined;
            invert = true;
        }
        else if(len == 2) {
            if(typeof elem == 'string') {
                modVal = modName;
                modName = elem;
                elem = undefined;
            }
            else {
                modVal = '';
                invert = true;
            }
        }

        var res = this.getMod(elem, modName) === modVal;
        return invert? !res : res;

    },

    /**
     * Возвращает значение модификатора блока/вложенного элемента
     * @protected
     * @param {Object} [elem] вложенный элемент
     * @param {String} modName имя модификатора
     * @returns {String} значение модификатора
     */
    getMod : function(elem, modName) {

        var type = typeof elem;
        if(type === 'string' || type === 'undefined') { // elem либо отсутствует, либо undefined
            modName = elem || modName;
            var modCache = this._modCache;
            return modName in modCache?
                modCache[modName] :
                modCache[modName] = this._extractModVal(modName);
        }

        return this._getElemMod(modName, elem);

    },

    /**
     * Возвращает значение модификатора вложенного элемента
     * @private
     * @param {String} modName имя модификатора
     * @param {Object} elem вложенный элемент
     * @param {Object} [elem] имя вложенного элемента
     * @returns {String} значение модификатора
     */
    _getElemMod : function(modName, elem, elemName) {

        return this._extractModVal(modName, elem, elemName);

    },

    /**
     * Возвращает значения модификаторов блока/вложенного элемента
     * @protected
     * @param {Object} [elem] вложенный элемент
     * @param {String} [modName1, ..., modNameN] имена модификаторов
     * @returns {Object} значения модификаторов в виде хэша
     */
    getMods : function(elem) {

        var hasElem = elem && typeof elem != 'string',
            _this = this,
            modNames = [].slice.call(arguments, hasElem? 1 : 0),
            res = _this._extractMods(modNames, hasElem? elem : undefined);

        if(!hasElem) { // кэшируем
            modNames.length?
                modNames.forEach(function(name) {
                    _this._modCache[name] = res[name];
                }):
                _this._modCache = res;
        }

        return res;

    },

    /**
     * Устанавливает модификатор у блока/вложенного элемента
     * @protected
     * @param {Object} [elem] вложенный элемент
     * @param {String} modName имя модификатора
     * @param {String} modVal значение модификатора
     * @returns {BEM}
     */
    setMod : function(elem, modName, modVal) {

        if(typeof modVal == 'undefined') {
            modVal = modName;
            modName = elem;
            elem = undefined;
        }

        var _this = this;

        if(!elem || elem[0]) {

            var modId = (elem && elem[0]? $.identify(elem[0]) : '') + '_' + modName;

            if(this._processingMods[modId]) return _this;

            var elemName,
                curModVal = elem?
                    _this._getElemMod(modName, elem, elemName = _this.__self._extractElemNameFrom(elem)) :
                    _this.getMod(modName);

            if(curModVal === modVal) return _this;

            this._processingMods[modId] = true;

            var needSetMod = true,
                modFnParams = [modName, modVal, curModVal];

            elem && modFnParams.unshift(elem);

            [['*', '*'], [modName, '*'], [modName, modVal]].forEach(function(mod) {
                needSetMod = _this._callModFn(elemName, mod[0], mod[1], modFnParams) !== false && needSetMod;
            });

            !elem && needSetMod && (_this._modCache[modName] = modVal);

            needSetMod && _this._afterSetMod(modName, modVal, curModVal, elem, elemName);

            delete this._processingMods[modId];
        }

        return _this;

    },

    /**
     * Функция после успешного изменения модификатора у блока/вложенного элемента
     * @protected
     * @param {String} modName имя модификатора
     * @param {String} modVal значение модификатора
     * @param {String} oldModVal старое значение модификатора
     * @param {Object} [elem] вложенный элемент
     * @param {String} [elemName] имя элемента
     */
    _afterSetMod : function(modName, modVal, oldModVal, elem, elemName) {},

    /**
     * Устанавливает модификатор у блока/вложенного элемента в зависимости от условия.
     * Если передан параметр condition, то при true устанавливается modVal1, при false - modVal2,
     * если же condition не передан, то устанавливается modVal1, если установлен modVal2, и наоборот
     * @protected
     * @param {Object} [elem] вложенный элемент
     * @param {String} modName имя модификатора
     * @param {String} modVal1 первое значение модификатора
     * @param {String} [modVal2] второе значение модификатора
     * @param {Boolean} [condition] условие
     * @returns {BEM}
     */
    toggleMod : function(elem, modName, modVal1, modVal2, condition) {

        if(typeof elem == 'string') { // если это блок
            condition = modVal2;
            modVal2 = modVal1;
            modVal1 = modName;
            modName = elem;
            elem = undefined;
        }
        if(typeof modVal2 == 'undefined') {
            modVal2 = '';
        } else if(typeof modVal2 == 'boolean') {
            condition = modVal2;
            modVal2 = '';
        }

        var modVal = this.getMod(elem, modName);
        (modVal == modVal1 || modVal == modVal2) &&
            this.setMod(
                elem,
                modName,
                typeof condition === 'boolean'?
                    (condition? modVal1 : modVal2) :
                    this.hasMod(elem, modName, modVal1)? modVal2 : modVal1);

        return this;

    },

    /**
     * Удаляет модификатор у блока/вложенного элемента
     * @protected
     * @param {Object} [elem] вложенный элемент
     * @param {String} modName имя модификатора
     * @returns {BEM}
     */
    delMod : function(elem, modName) {

        if(!modName) {
            modName = elem;
            elem = undefined;
        }

        return this.setMod(elem, modName, '');

    },

    /**
     * Выполняет обработчики установки модификаторов
     * @private
     * @param {String} elemName имя элемента
     * @param {String} modName имя модификатора
     * @param {String} modVal значение модификатора
     * @param {Array} modFnParams параметры обработчика
     */
    _callModFn : function(elemName, modName, modVal, modFnParams) {

        var modFnName = buildModFnName(elemName, modName, modVal);
        return this[modFnName]?
           this[modFnName].apply(this, modFnParams) :
           undefined;

    },

    /**
     * Извлекает значение модификатора
     * @private
     * @param {String} modName имя модификатора
     * @param {Object} [elem] элемент
     * @returns {String} значение модификатора
     */
    _extractModVal : function(modName, elem) {

        return '';

    },

    /**
     * Извлекает имя/значение списка модификаторов
     * @private
     * @param {Array} modNames имена модификаторов
     * @param {Object} [elem] элемент
     * @returns {Object} хэш значений модификаторов по имени
     */
    _extractMods : function(modNames, elem) {

        return {};

    },

    /**
     * Возвращает именованный канал сообщений
     * @param {String} [id='default'] идентификатор канала
     * @param {Boolean} [drop=false] уничтожить канал
     * @returns {$.observable|undefined} канал сообщений
     */
    channel : function(id, drop) {

        return this.__self.channel(id, drop);

    },

    /**
     * Возвращает дефолтные параметры блока
     * @returns {Object}
     */
    getDefaultParams : function() {

        return {};

    },

    /**
     * Хелпер для очистки свойств блока
     * @param {Object} [obj=this]
     */
    del : function(obj) {

        var args = [].slice.call(arguments);
        typeof obj == 'string' && args.unshift(this);
        this.__self.del.apply(this.__self, args);
        return this;

	},

    /**
     * Удаляет блок
     */
    destruct : function() {}

}, /** @lends BEM */{

    _name : 'i-bem',

    /**
     * Хранилище деклараций блоков (хэш по имени блока)
     * @static
     * @protected
     * @type Object
     */
    blocks : blocks,

    /**
     * Декларатор блоков, создает класс блока
     * @static
     * @protected
     * @param {String|Object} decl имя блока (простой синтаксис) или описание
     * @param {String} decl.block|decl.name имя блока
     * @param {String} [decl.baseBlock] имя родительского блока
     * @param {String} [decl.modName] имя модификатора
     * @param {String} [decl.modVal] значение модификатора
     * @param {Object} [props] методы
     * @param {Object} [staticProps] статические методы
     */
    decl : function(decl, props, staticProps) {

        if(typeof decl == 'string')
            decl = { block : decl };
        else if(decl.name) {
            decl.block = decl.name;
        }

        if(decl.baseBlock && !blocks[decl.baseBlock])
            throw('baseBlock "' + decl.baseBlock + '" for "' + decl.block + '" is undefined');

        props || (props = {});

        if(props.onSetMod) {
            modFnsToProps(props.onSetMod, props);
            delete props.onSetMod;
        }

        if(props.onElemSetMod) {
            $.each(props.onElemSetMod, function(elemName, modFns) {
                modFnsToProps(modFns, props, elemName);
            });
            delete props.onElemSetMod;
        }

        var baseBlock = blocks[decl.baseBlock || decl.block] || this;

        if(decl.modName) {
            var checkMod = buildCheckMod(decl.modName, decl.modVal);
            $.each(props, function(name, prop) {
                $.isFunction(prop) &&
                    (props[name] = function() {
                        var method;
                        if(checkMod(this)) {
                            method = prop;
                        } else {
                            var baseMethod = baseBlock.prototype[name];
                            baseMethod && baseMethod !== props[name] &&
                                (method = this.__base);
                        }
                        return method?
                            method.apply(this, arguments) :
                            undefined;
                    });
            });
        }

        var block;
        decl.block == baseBlock._name?
            // делаем новый live в том случае, если уже запускался старый
            (block = $.inheritSelf(baseBlock, props, staticProps))._processLive(true) :
            (block = blocks[decl.block] = $.inherit(baseBlock, props, staticProps))._name = decl.block;

        return block;

    },

    /**
     * Осуществляет обработку live-свойств блока
     * @private
     * @param {Boolean} [heedLive=false] нужно ли учитывать то, что блок обрабатывал уже свои live-свойства
     * @returns {Boolean} является ли блок live-блоком
     */
    _processLive : function(heedLive) {

        return false;

    },

    /**
     * Фабричный метод для создания экземпляра блока по имени
     * @static
     * @param {String|Object} block имя блока или описание
     * @param {Object} [params] параметры блока
     * @returns {BEM}
     */
    create : function(block, params) {

        typeof block == 'string' && (block = { block : block });

        return new blocks[block.block](block.mods, params);

    },

    /**
     * Возвращает имя текущего блока
     * @static
     * @protected
     * @returns {String}
     */
    getName : function() {

        return this._name;

    },

    /**
     * Извлекает имя вложенного в блок элемента
     * @static
     * @private
     * @param {Object} elem вложенный элемент
     * @returns {String|undefined}
     */
    _extractElemNameFrom : function(elem) {},

    /**
     * Добавляет функцию в очередь для запуска после "текущего события"
     * @static
     * @protected
     * @param {Function} fn
     * @param {Object} ctx
     */
    afterCurrentEvent : function(fn, ctx) {

        afterCurrentEventFns.push({ fn : fn, ctx : ctx }) == 1 &&
            setTimeout(this._runAfterCurrentEventFns, 0);

    },

    /**
     * Запускает очерель
     * @private
     */
    _runAfterCurrentEventFns : function() {

        var fnsLen = afterCurrentEventFns.length;
        if(fnsLen) {
            var fnObj,
                fnsCopy = afterCurrentEventFns.splice(0, fnsLen);

            while(fnObj = fnsCopy.shift()) fnObj.fn.call(fnObj.ctx || this);
        }

    },

    /**
     * Изменяет контекст передаваемой функции
     * @protected
     * @param {Function} fn
     * @param {Object} ctx контекст
     * @returns {Function} функция с измененным контекстом
     */
    changeThis : function(fn, ctx) {

        return fn.bind(ctx || this);

    },

    /**
     * Хелпер для очистки свойств
     * @param {Object} [obj=this]
     */
    del : function(obj) {

        var delInThis = typeof obj == 'string',
            i = delInThis? 0 : 1,
            len = arguments.length;
        delInThis && (obj = this);

        while(i < len) delete obj[arguments[i++]];

        return this;

	},

    /**
     * Возвращает/уничтожает именованный канал сообщений
     * @param {String} [id='default'] идентификатор канала
     * @param {Boolean} [drop=false] уничтожить канал
     * @returns {$.observable|undefined} канал сообщений
     */
    channel : function(id, drop) {

        if(typeof id == 'boolean') {
            drop = id;
            id = undefined;
        }

        id || (id = 'default');

        if(drop) {
            if(channels[id]) {
                channels[id].un();
                delete channels[id];
            }
            return;
        }

        return channels[id] || (channels[id] = new $.observable());

    }

});

})(jQuery);
