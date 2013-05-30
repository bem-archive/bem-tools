var BEMHTML = (function(exports) {
    function $1() {
        var __t = this._mode;
        if (__t === "attrs") {
            return $2.call(this);
        } else if (__t === "tag") {
            return $22.call(this);
        } else if (__t === "bem") {
            return $48.call(this);
        } else if (__t === "default") {
            return $69.call(this);
        } else if (__t === "content") {
            return $91.call(this);
        } else {
            return $99.call(this);
        }
    }
    function $2() {
        if (this.block === "b-page") {
            var __t = this.elem;
            if (__t === "favicon") {
                return {
                    rel: "shortcut icon",
                    href: this.ctx.url
                };
                return;
            } else if (__t === "js") {
                if (!this.ctx.url === false) {
                    return {
                        src: this.ctx.url
                    };
                    return;
                } else {
                    return $99.call(this);
                }
            } else if (__t === "css") {
                if (!this.ctx.url === false) {
                    return {
                        rel: "stylesheet",
                        href: this.ctx.url
                    };
                    return;
                } else {
                    return $99.call(this);
                }
            } else if (__t === "meta") {
                return this.ctx.attrs;
                return;
            } else {
                return $99.call(this);
            }
        } else {
            return $99.call(this);
        }
    }
    function $22() {
        var __t = this.block;
        if (__t === "b-page") {
            var __t = this.elem;
            if (__t === "favicon") {
                return "link";
                return;
            } else if (__t === "js") {
                return "script";
                return;
            } else if (__t === "css") {
                if (!this.ctx.url === false) {
                    return "link";
                    return;
                } else {
                    return "style";
                    return;
                }
            } else if (__t === "meta") {
                return "meta";
                return;
            } else if (__t === "body") {
                return "body";
                return;
            } else if (__t === "head") {
                return "head";
                return;
            } else {
                return $99.call(this);
            }
        } else if (__t === "i-ua") {
            if (!!this.elem === false) {
                return "script";
                return;
            } else {
                return $99.call(this);
            }
        } else {
            return $99.call(this);
        }
    }
    function $48() {
        var __t = this.block;
        if (__t === "b-page") {
            var __t = this.elem;
            if (__t === "favicon" || __t === "js" || __t === "css" || __t === "meta" || __t === "head") {
                return false;
                return;
            } else {
                return $99.call(this);
            }
        } else if (__t === "i-ua") {
            if (!!this.elem === false) {
                return false;
                return;
            } else {
                return $99.call(this);
            }
        } else {
            return $99.call(this);
        }
    }
    function $69() {
        var __t = this.block;
        if (__t === "b-page") {
            if (this.elem === "css") {
                if (!this.ctx.hasOwnProperty("ie") === false) {
                    if (!!this.ctx._ieCommented === false) {
                        return $74.call(this);
                    } else {
                        return $79.call(this);
                    }
                } else {
                    return $79.call(this);
                }
            } else {
                return $79.call(this);
            }
        } else if (__t === "i-jquery") {
            if (this.elem === "core") {
                var __r33, __r34, __r35;
                return "", __r33 = this._mode, this._mode = "", __r34 = this.ctx, this.ctx = {
                    block: "b-page",
                    elem: "js",
                    url: "//yandex.st/jquery/1.7.2/jquery.min.js"
                }, __r35 = $99.call(this), this._mode = __r33, this.ctx = __r34, "", __r35;
                return;
            } else {
                return $99.call(this);
            }
        } else {
            return $99.call(this);
        }
    }
    function $74() {
        {
            var ie = this.ctx.ie;
            if (ie === true) {
                {
                    "";
                    var __r38 = this._mode;
                    this._mode = "";
                    var __r39 = this.ctx;
                    this.ctx = [ 6, 7, 8, 9 ].map(function(v) {
                        return {
                            elem: "css",
                            url: this.ctx.url + ".ie" + v + ".css",
                            ie: "IE " + v
                        };
                    }, this);
                    this.apply();
                    this._mode = __r38;
                    this.ctx = __r39;
                    "";
                }
            } else {
                var hideRule = !ie ? [ "gt IE 9", "<!-->", "<!--" ] : ie == "!IE" ? [ ie, "<!-->", "<!--" ] : [ ie, "", "" ];
                {
                    "";
                    var __r40 = this._mode;
                    this._mode = "";
                    var __r41 = this.ctx, __r42 = __r41._ieCommented;
                    __r41._ieCommented = true;
                    var __r43 = this.ctx;
                    this.ctx = [ "<!--[if " + hideRule[0] + "]>", hideRule[1], this.ctx, hideRule[2], "<![endif]-->" ];
                    this.apply();
                    this._mode = __r40;
                    __r41._ieCommented = __r42;
                    this.ctx = __r43;
                    "";
                }
            }
        }
        return;
    }
    function $79() {
        if (!!this.elem === false) {
            return $81.call(this);
        } else {
            return $99.call(this);
        }
    }
    function $81() {
        {
            this._buf.push("<!DOCTYPE html>");
            {
                "";
                var __r36 = this._mode;
                this._mode = "";
                var __r37 = this.ctx;
                this.ctx = {
                    tag: "html",
                    cls: "i-ua_js_no i-ua_css_standard",
                    content: [ {
                        elem: "head",
                        content: [ {
                            tag: "meta",
                            attrs: {
                                charset: "utf-8"
                            }
                        }, {
                            tag: "meta",
                            attrs: {
                                "http-equiv": "X-UA-Compatible",
                                content: "IE=EmulateIE7, IE=edge"
                            }
                        }, {
                            tag: "title",
                            content: this.ctx.title
                        }, this.ctx.favicon ? {
                            elem: "favicon",
                            url: this.ctx.favicon
                        } : "", this.ctx.meta, {
                            block: "i-ua"
                        }, this.ctx.head ]
                    }, {
                        elem: "body",
                        mix: [ this.ctx ],
                        content: [ this.ctx.content ]
                    } ]
                };
                this.apply();
                this._mode = __r36;
                this.ctx = __r37;
                "";
            }
        }
        return;
    }
    function $91() {
        if (this.block === "i-ua") {
            if (!!this.elem === false) {
                return [ ";(function(d,e,c,r){", "e=d.documentElement;", 'c="className";', 'r="replace";', 'e[c]=e[c][r]("i-ua_js_no","i-ua_js_yes");', 'if(d.compatMode!="CSS1Compat")', 'e[c]=e[c][r]("i-ua_css_standart","i-ua_css_quirks")', "})(document);" ].join("");
                return;
            } else {
                return $99.call(this);
            }
        } else {
            return $99.call(this);
        }
    }
    function $99() {
        if (!!this._start === false) {
            return $101.call(this);
        } else {
            var __t = this._mode;
            if (__t === "content") {
                return this.ctx.content;
                return;
            } else if (__t === "mix" || __t === "bem" || __t === "jsAttr" || __t === "js" || __t === "cls" || __t === "attrs" || __t === "tag") {
                return undefined;
                return;
            } else if (__t === "default") {
                return $120.call(this);
            } else {
                if (!this._.isSimple(this.ctx) === false) {
                    if (!!this._mode === false) {
                        {
                            this._listLength--;
                            var ctx = this.ctx;
                            (ctx && ctx !== true || ctx === 0) && this._buf.push(ctx);
                        }
                        return;
                    } else {
                        return $127.call(this);
                    }
                } else {
                    return $127.call(this);
                }
            }
        }
    }
    function $101() {
        {
            var BEM_ = {}, toString = Object.prototype.toString, SHORT_TAGS = {
                area: 1,
                base: 1,
                br: 1,
                col: 1,
                command: 1,
                embed: 1,
                hr: 1,
                img: 1,
                input: 1,
                keygen: 1,
                link: 1,
                meta: 1,
                param: 1,
                source: 1,
                wbr: 1
            };
            (function(BEM, undefined) {
                var MOD_DELIM = "_", ELEM_DELIM = "__", NAME_PATTERN = "[a-zA-Z0-9-]+";
                function buildModPostfix(modName, modVal, buffer) {
                    buffer.push(MOD_DELIM, modName, MOD_DELIM, modVal);
                }
                function buildBlockClass(name, modName, modVal, buffer) {
                    buffer.push(name);
                    modVal && buildModPostfix(modName, modVal, buffer);
                }
                function buildElemClass(block, name, modName, modVal, buffer) {
                    buildBlockClass(block, undefined, undefined, buffer);
                    buffer.push(ELEM_DELIM, name);
                    modVal && buildModPostfix(modName, modVal, buffer);
                }
                BEM.INTERNAL = {
                    NAME_PATTERN: NAME_PATTERN,
                    MOD_DELIM: MOD_DELIM,
                    ELEM_DELIM: ELEM_DELIM,
                    buildModPostfix: function(modName, modVal, buffer) {
                        var res = buffer || [];
                        buildModPostfix(modName, modVal, res);
                        return buffer ? res : res.join("");
                    },
                    buildClass: function(block, elem, modName, modVal, buffer) {
                        var typeOf = typeof modName;
                        if (typeOf == "string") {
                            if (typeof modVal != "string") {
                                buffer = modVal;
                                modVal = modName;
                                modName = elem;
                                elem = undefined;
                            } else {
                                undefined;
                            }
                        } else {
                            if (typeOf != "undefined") {
                                buffer = modName;
                                modName = undefined;
                            } else {
                                if (elem && typeof elem != "string") {
                                    buffer = elem;
                                    elem = undefined;
                                } else {
                                    undefined;
                                }
                            }
                        }
                        undefined;
                        if (!(elem || modName || buffer)) {
                            return block;
                        } else {
                            undefined;
                        }
                        undefined;
                        var res = buffer || [];
                        elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res);
                        return buffer ? res : res.join("");
                    },
                    buildModsClasses: function(block, elem, mods, buffer) {
                        var res = buffer || [];
                        if (mods) {
                            var modName;
                            for (modName in mods) {
                                if (mods.hasOwnProperty(modName) && mods[modName] && mods[modName].length) {
                                    var modVal = mods[modName];
                                    res.push(" ");
                                    elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res);
                                } else {
                                    undefined;
                                }
                            }
                        } else {
                            undefined;
                        }
                        undefined;
                        return buffer ? res : res.join("");
                    },
                    buildClasses: function(block, elem, mods, buffer) {
                        var res = buffer || [];
                        elem ? buildElemClass(block, elem, undefined, undefined, res) : buildBlockClass(block, undefined, undefined, res);
                        this.buildModsClasses(block, elem, mods, buffer);
                        return buffer ? res : res.join("");
                    }
                };
            })(BEM_);
            var buildEscape = function() {
                var ts = {
                    '"': "&quot;",
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;"
                }, f = function(t) {
                    return ts[t] || t;
                };
                return function(r) {
                    r = new RegExp(r, "g");
                    return function(s) {
                        return ("" + s).replace(r, f);
                    };
                };
            }(), ctx = {
                ctx: this,
                _start: true,
                apply: apply,
                _buf: [],
                _: {
                    isArray: function(obj) {
                        return toString.call(obj) === "[object Array]";
                    },
                    isSimple: function(obj) {
                        var t = typeof obj;
                        return t === "string" || t === "number" || t === "boolean";
                    },
                    isShortTag: function(t) {
                        return SHORT_TAGS.hasOwnProperty(t);
                    },
                    extend: function(o1, o2) {
                        if (!o1 || !o2) {
                            return o1 || o2;
                        } else {
                            undefined;
                        }
                        undefined;
                        var res = {}, n;
                        for (n in o1) {
                            o1.hasOwnProperty(n) && (res[n] = o1[n]);
                        }
                        undefined;
                        for (n in o2) {
                            o2.hasOwnProperty(n) && (res[n] = o2[n]);
                        }
                        undefined;
                        return res;
                    },
                    identify: function() {
                        var cnt = 0, expando = "__" + +(new Date), get = function() {
                            return "uniq" + ++cnt;
                        };
                        return function(obj, onlyGet) {
                            if (!obj) {
                                return get();
                            } else {
                                undefined;
                            }
                            undefined;
                            if (onlyGet || obj[expando]) {
                                return obj[expando];
                            } else {
                                return obj[expando] = get();
                            }
                        };
                    }(),
                    xmlEscape: buildEscape("[&<>]"),
                    attrEscape: buildEscape('["&<>]')
                },
                BEM: BEM_,
                isFirst: function() {
                    return this.position === 1;
                },
                isLast: function() {
                    return this.position === this._listLength;
                },
                generateId: function() {
                    return this._.identify(this.ctx);
                }
            };
            ctx.apply();
            return ctx._buf.join("");
        }
        return;
    }
    function $120() {
        var __r18, __r8, __r12, __r13, __r14, __r15, __r16, __r17, __r9, __r19, __r22, __r23, __r24, __r25, __r26, __r27;
        {
            var _this = this, BEM_ = _this.BEM, v = this.ctx, buf = this._buf, tag;
            tag = ("", __r8 = this._mode, this._mode = "tag", __r9 = $22.call(this), this._mode = __r8, "", __r9);
            typeof tag != "undefined" || (tag = v.tag);
            typeof tag != "undefined" || (tag = "div");
            if (tag) {
                var jsParams, js;
                if (this.block && v.js !== false) {
                    js = ("", __r12 = this._mode, this._mode = "js", __r13 = $99.call(this), this._mode = __r12, "", __r13);
                    js = js ? this._.extend(v.js, js === true ? {} : js) : v.js === true ? {} : v.js;
                    js && ((jsParams = {})[BEM_.INTERNAL.buildClass(this.block, v.elem)] = js);
                } else {
                    undefined;
                }
                undefined;
                buf.push("<", tag);
                var isBEM = ("", __r14 = this._mode, this._mode = "bem", __r15 = $48.call(this), this._mode = __r14, "", __r15);
                typeof isBEM != "undefined" || (isBEM = typeof v.bem != "undefined" ? v.bem : v.block || v.elem);
                var cls = ("", __r16 = this._mode, this._mode = "cls", __r17 = $99.call(this), this._mode = __r16, "", __r17);
                cls || (cls = v.cls);
                var addJSInitClass = v.block && jsParams;
                if (isBEM || cls) {
                    buf.push(' class="');
                    if (isBEM) {
                        BEM_.INTERNAL.buildClasses(this.block, v.elem, v.elemMods || v.mods, buf);
                        var mix = ("", __r18 = this._mode, this._mode = "mix", __r19 = $99.call(this), this._mode = __r18, "", __r19);
                        v.mix && (mix = mix ? mix.concat(v.mix) : v.mix);
                        if (mix) {
                            var i = 0, l = mix.length, mixItem, hasItem, block;
                            while (i < l) {
                                mixItem = mix[i++];
                                hasItem = mixItem.block || mixItem.elem, block = mixItem.block || _this.block;
                                hasItem && buf.push(" ");
                                BEM_.INTERNAL[hasItem ? "buildClasses" : "buildModsClasses"](block, mixItem.elem || (mixItem.block ? undefined : _this.elem), mixItem.elemMods || mixItem.mods, buf);
                                if (mixItem.js) {
                                    (jsParams || (jsParams = {}))[BEM_.INTERNAL.buildClass(block, mixItem.elem)] = mixItem.js === true ? {} : mixItem.js;
                                    addJSInitClass || (addJSInitClass = block && !mixItem.elem);
                                } else {
                                    undefined;
                                }
                            }
                        } else {
                            undefined;
                        }
                    } else {
                        undefined;
                    }
                    undefined;
                    cls && buf.push(isBEM ? " " : "", cls);
                    addJSInitClass && buf.push(" i-bem");
                    buf.push('"');
                } else {
                    undefined;
                }
                undefined;
                if (jsParams) {
                    var jsAttr = ("", __r22 = this._mode, this._mode = "jsAttr", __r23 = $99.call(this), this._mode = __r22, "", __r23);
                    buf.push(" ", jsAttr || "onclick", '="return ', this._.attrEscape(JSON.stringify(jsParams)), '"');
                } else {
                    undefined;
                }
                undefined;
                var attrs = ("", __r24 = this._mode, this._mode = "attrs", __r25 = $2.call(this), this._mode = __r24, "", __r25);
                attrs = this._.extend(attrs, v.attrs);
                if (attrs) {
                    var name;
                    for (name in attrs) {
                        buf.push(" ", name, '="', this._.attrEscape(attrs[name]), '"');
                    }
                } else {
                    undefined;
                }
            } else {
                undefined;
            }
            undefined;
            if (this._.isShortTag(tag)) {
                buf.push("/>");
            } else {
                tag && buf.push(">");
                var content = ("", __r26 = this._mode, this._mode = "content", __r27 = $91.call(this), this._mode = __r26, "", __r27);
                if (content || content === 0) {
                    var isBEM = this.block || this.elem;
                    {
                        "";
                        var __r28 = this._notNewList;
                        this._notNewList = false;
                        var __r29 = this.position;
                        this.position = isBEM ? 1 : this.position;
                        var __r30 = this._listLength;
                        this._listLength = isBEM ? 1 : this._listLength;
                        var __r31 = this.ctx;
                        this.ctx = content;
                        var __r32 = this._mode;
                        this._mode = "";
                        $99.call(this);
                        this._notNewList = __r28;
                        this.position = __r29;
                        this._listLength = __r30;
                        this.ctx = __r31;
                        this._mode = __r32;
                        "";
                    }
                    undefined;
                    undefined;
                    undefined;
                } else {
                    undefined;
                }
                undefined;
                tag && buf.push("</", tag, ">");
            }
        }
        return;
    }
    function $127() {
        if (!!this._mode === false) {
            if (!!this.ctx === false) {
                this._listLength--;
                return;
            } else {
                return $133.call(this);
            }
        } else {
            return $133.call(this);
        }
    }
    function $133() {
        if (!this._.isArray(this.ctx) === false) {
            if (!!this._mode === false) {
                {
                    var v = this.ctx, l = v.length, i = 0, prevPos = this.position, prevNotNewList = this._notNewList;
                    if (prevNotNewList) {
                        this._listLength += l - 1;
                    } else {
                        this.position = 0;
                        this._listLength = l;
                    }
                    undefined;
                    this._notNewList = true;
                    while (i < l) {
                        {
                            "";
                            var __r7 = this.ctx;
                            this.ctx = v[i++];
                            $1.call(this);
                            this.ctx = __r7;
                            "";
                        }
                        undefined;
                    }
                    undefined;
                    undefined;
                    prevNotNewList || (this.position = prevPos);
                }
                return;
            } else {
                return $139.call(this);
            }
        } else {
            return $139.call(this);
        }
    }
    function $139() {
        if (!true === false) {
            if (!!this._mode === false) {
                return $142.call(this);
            } else {
                return $e.call(this);
            }
        } else {
            return $e.call(this);
        }
    }
    function $142() {
        {
            var vBlock = this.ctx.block, vElem = this.ctx.elem, block = this._currBlock || this.block;
            this.ctx || (this.ctx = {});
            {
                "";
                var __r0 = this._mode;
                this._mode = "default";
                var __r1 = this.block;
                this.block = vBlock || (vElem ? block : undefined);
                var __r2 = this._currBlock;
                this._currBlock = vBlock || vElem ? undefined : block;
                var __r3 = this.elem;
                this.elem = this.ctx.elem;
                var __r4 = this.mods;
                this.mods = (vBlock ? this.ctx.mods : this.mods) || {};
                var __r5 = this.elemMods;
                this.elemMods = this.ctx.elemMods || {};
                {
                    this.block || this.elem ? this.position = (this.position || 0) + 1 : this._listLength--;
                    $69.call(this);
                    undefined;
                    undefined;
                }
                this._mode = __r0;
                this.block = __r1;
                this._currBlock = __r2;
                this.elem = __r3;
                this.mods = __r4;
                this.elemMods = __r5;
                "";
            }
            undefined;
        }
        return;
    }
    function $e() {
        throw new Error;
        return;
    }
    exports.apply = apply;
    function apply() {
        return $1.call(this);
    }
    return exports;
})(typeof exports === "undefined" ? {} : exports);
BEMHTML = (function(xjst) { return function() { return xjst.apply.call([this]); }; }(BEMHTML));
typeof exports === "undefined" || (exports.BEMHTML = BEMHTML);