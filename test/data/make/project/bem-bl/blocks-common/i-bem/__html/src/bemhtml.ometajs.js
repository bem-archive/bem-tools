var ometajs_ = require('ometajs').globals || global;var StringBuffer = ometajs_.StringBuffer;
var objectThatDelegatesTo = ometajs_.objectThatDelegatesTo;
var isImmutable = ometajs_.isImmutable;
var digitValue = ometajs_.digitValue;
var isSequenceable = ometajs_.isSequenceable;
var escapeChar = ometajs_.escapeChar;
var unescape = ometajs_.unescape;
var getTag = ometajs_.getTag;
var inspect = ometajs_.inspect;
var lift = ometajs_.lift;
var clone = ometajs_.clone;
var Parser = ometajs_.Parser;
var fail = ometajs_.fail;
var OMeta = ometajs_.OMeta;
var BSNullOptimization = ometajs_.BSNullOptimization;
var BSAssociativeOptimization = ometajs_.BSAssociativeOptimization;
var BSSeqInliner = ometajs_.BSSeqInliner;
var BSJumpTableOptimization = ometajs_.BSJumpTableOptimization;
var BSOMetaOptimizer = ometajs_.BSOMetaOptimizer;
var BSOMetaParser = ometajs_.BSOMetaParser;
var BSOMetaTranslator = ometajs_.BSOMetaTranslator;
var BSJSParser = ometajs_.BSJSParser;
var BSSemActionParser = ometajs_.BSSemActionParser;
var BSJSIdentity = ometajs_.BSJSIdentity;
var BSJSTranslator = ometajs_.BSJSTranslator;
var BSOMetaJSParser = ometajs_.BSOMetaJSParser;
var BSOMetaJSTranslator = ometajs_.BSOMetaJSTranslator;
if (global === ometajs_) {
  fail = (function(fail) {
    return function() { return fail };
  })(fail);
  OMeta = require('ometajs').OMeta;
}{
    var BEMHTMLParser = exports.BEMHTMLParser = objectThatDelegatesTo(XJSTParser, {
        bemMatch: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._or(function() {
                return this._apply("bemBlock");
            }, function() {
                return this._apply("bemElem");
            }, function() {
                return this._apply("bemMod");
            });
        },
        bemVal: function() {
            var $elf = this, _fromIdx = this.input.idx, x, xs;
            return this._or(function() {
                return function() {
                    x = this._apply("letter");
                    xs = this._many1(function() {
                        return this._or(function() {
                            return this._apply("letter");
                        }, function() {
                            return this._apply("digit");
                        }, function() {
                            return function() {
                                switch (this._apply("anything")) {
                                  case "-":
                                    return "-";
                                  default:
                                    throw fail();
                                }
                            }.call(this);
                        });
                    });
                    return [ "string", x + xs.join("") ];
                }.call(this);
            }, function() {
                return this._apply("asgnExpr");
            });
        },
        bemPredic: function() {
            var $elf = this, _fromIdx = this.input.idx, n, nn;
            return function() {
                n = this._apply("anything");
                this._apply("spaces");
                nn = this._applyWithArgs("seq", n);
                this._many1(function() {
                    return this._apply("space");
                });
                return nn;
            }.call(this);
        },
        bemBlock: function() {
            var $elf = this, _fromIdx = this.input.idx, n, v;
            return function() {
                n = this._applyWithArgs("bemPredic", "block");
                v = this._apply("bemVal");
                return [ "block", v ];
            }.call(this);
        },
        bemElem: function() {
            var $elf = this, _fromIdx = this.input.idx, v;
            return function() {
                this._applyWithArgs("bemPredic", "elem");
                v = this._apply("bemVal");
                return [ "elem", v ];
            }.call(this);
        },
        bemMod: function() {
            var $elf = this, _fromIdx = this.input.idx, m, v, m, v;
            return this._or(function() {
                return function() {
                    this._applyWithArgs("bemPredic", "mod");
                    m = this._apply("bemVal");
                    this._many1(function() {
                        return this._apply("space");
                    });
                    v = this._apply("bemVal");
                    return [ "blockMod", m, v ];
                }.call(this);
            }, function() {
                return function() {
                    this._applyWithArgs("bemPredic", "elemMod");
                    m = this._apply("bemVal");
                    this._many1(function() {
                        return this._apply("space");
                    });
                    v = this._apply("bemVal");
                    return [ "elemMod", m, v ];
                }.call(this);
            });
        },
        bemCustom: function() {
            var $elf = this, _fromIdx = this.input.idx, e;
            return function() {
                e = this._apply("asgnExpr");
                return [ "xjst", e ];
            }.call(this);
        },
        bemhtmlSet: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._or(function() {
                return this._apply("bhDefault");
            }, function() {
                return this._apply("bhTag");
            }, function() {
                return this._apply("bhAttrs");
            }, function() {
                return this._apply("bhClass");
            }, function() {
                return this._apply("bhBEM");
            }, function() {
                return this._apply("bhJSAttr");
            }, function() {
                return this._apply("bhJS");
            }, function() {
                return this._apply("bhMix");
            }, function() {
                return this._apply("bhContent");
            });
        },
        bhPredic: function() {
            var $elf = this, _fromIdx = this.input.idx, n, nn;
            return function() {
                n = this._apply("anything");
                this._apply("spaces");
                nn = this._applyWithArgs("seq", n);
                return nn;
            }.call(this);
        },
        bhDefault: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "default");
                return [ n ];
            }.call(this);
        },
        bhTag: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "tag");
                return [ n ];
            }.call(this);
        },
        bhAttrs: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "attrs");
                return [ n ];
            }.call(this);
        },
        bhClass: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "cls");
                return [ n ];
            }.call(this);
        },
        bhBEM: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "bem");
                return [ n ];
            }.call(this);
        },
        bhJS: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "js");
                return [ n ];
            }.call(this);
        },
        bhJSAttr: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "jsAttr");
                return [ n ];
            }.call(this);
        },
        bhMix: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "mix");
                return [ n ];
            }.call(this);
        },
        bhContent: function() {
            var $elf = this, _fromIdx = this.input.idx, n;
            return function() {
                n = this._applyWithArgs("bhPredic", "content");
                return [ n ];
            }.call(this);
        },
        bemMatchAndSet: function() {
            var $elf = this, _fromIdx = this.input.idx;
            return this._or(function() {
                return this._apply("bemMatch");
            }, function() {
                return this._apply("bemhtmlSet");
            }, function() {
                return this._apply("bemCustom");
            });
        },
        listBemMatchAndSet: function() {
            var $elf = this, _fromIdx = this.input.idx, t, ts, t, ts, t, e, c;
            return this._or(function() {
                return function() {
                    t = this._apply("bemMatchAndSet");
                    this._applyWithArgs("exactly", ",");
                    ts = this._apply("listBemMatchAndSet");
                    return BEMHTMLParser._concatChildren(t, ts);
                }.call(this);
            }, function() {
                return function() {
                    t = this._apply("bemMatchAndSet");
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "{");
                    this._apply("spaces");
                    ts = this._many1(function() {
                        return this._apply("listBemMatchAndSet");
                    });
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "}");
                    this._apply("spaces");
                    return BEMHTMLParser._concatChildren(t, [ "sub", ts ]);
                }.call(this);
            }, function() {
                return function() {
                    t = this._apply("bemMatchAndSet");
                    this._applyWithArgs("exactly", ":");
                    c = this._or(function() {
                        return function() {
                            e = this._apply("asgnExpr");
                            return [ "return", e ];
                        }.call(this);
                    }, function() {
                        return this._apply("stmt");
                    });
                    this._opt(function() {
                        return this._applyWithArgs("exactly", ",");
                    });
                    return [ t, [ "body", c ] ];
                }.call(this);
            });
        },
        topLevel: function() {
            var $elf = this, _fromIdx = this.input.idx, ts;
            return function() {
                ts = this._many(function() {
                    return this._apply("listBemMatchAndSet");
                });
                this._apply("spaces");
                this._apply("end");
                return BEMHTMLParser._addElemPredic(BEMHTMLParser._dropAllSubs(ts));
            }.call(this);
        }
    });
    BEMHTMLParser["_concatChildren"] = function(p, cs) {
        if (cs[0] === "sub") {
            var res = [], i = 0, c;
            while (c = cs[1][i++]) {
                var cc = BEMHTMLParser._concatChildren(p, c);
                BEMHTMLParser._dropSub(res, cc);
            }
            return [ "sub", res ];
        } else {
            return [ p ].concat(cs);
        }
    };
    BEMHTMLParser["_dropSub"] = function(buf, t) {
        t[0] === "sub" ? buf["push"].apply(buf, t[1]) : buf.push(t);
    };
    BEMHTMLParser["_dropAllSubs"] = function(ts) {
        var res = [], i = 0, t;
        while (t = ts[i++]) {
            BEMHTMLParser._dropSub(res, t);
        }
        return res;
    };
    BEMHTMLParser["_addElemPredic"] = function(ts) {
        ts.forEach(function(t) {
            var isBlock = false, isElemOrCustom = false;
            t.forEach(function(p) {
                isBlock || (isBlock = p[0] === "block");
                isElemOrCustom || (isElemOrCustom = p[0] == "elem" || p[0] == "xjst");
            });
            isBlock && !isElemOrCustom && t.unshift([ "xjst", [ "unop", "!", [ "getp", [ "string", "elem" ], [ "this" ] ] ] ]);
        });
        return ts;
    };
    var BEMHTMLToXJST = exports.BEMHTMLToXJST = objectThatDelegatesTo(XJSTCompiler, {
        bhPredic: function() {
            var $elf = this, _fromIdx = this.input.idx, e, m, v, e, m, v, e, m;
            return this._or(function() {
                return function() {
                    this._form(function() {
                        return function() {
                            this._applyWithArgs("exactly", "block");
                            return e = this._apply("trans");
                        }.call(this);
                    });
                    return "this.block === " + e;
                }.call(this);
            }, function() {
                return function() {
                    this._form(function() {
                        return function() {
                            this._applyWithArgs("exactly", "blockMod");
                            m = this._apply("trans");
                            return v = this._apply("trans");
                        }.call(this);
                    });
                    return "this.mods && this.mods[" + m + "] === " + v;
                }.call(this);
            }, function() {
                return function() {
                    this._form(function() {
                        return function() {
                            this._applyWithArgs("exactly", "elem");
                            return e = this._apply("trans");
                        }.call(this);
                    });
                    return "this.elem === " + e;
                }.call(this);
            }, function() {
                return function() {
                    this._form(function() {
                        return function() {
                            this._applyWithArgs("exactly", "elemMod");
                            m = this._apply("trans");
                            return v = this._apply("trans");
                        }.call(this);
                    });
                    return "this.elemMods && this.elemMods[" + m + "] === " + v;
                }.call(this);
            }, function() {
                return function() {
                    this._form(function() {
                        return function() {
                            this._applyWithArgs("exactly", "xjst");
                            return e = this._apply("trans");
                        }.call(this);
                    });
                    return e;
                }.call(this);
            }, function() {
                return function() {
                    this._form(function() {
                        return m = this._apply("anything");
                    });
                    return 'this._mode === "' + m + '"';
                }.call(this);
            });
        },
        bhBody: function() {
            var $elf = this, _fromIdx = this.input.idx, b;
            return function() {
                this._form(function() {
                    return function() {
                        this._applyWithArgs("exactly", "body");
                        return b = this._apply("tBody");
                    }.call(this);
                });
                return "{ " + b + " }";
            }.call(this);
        },
        bhTemplate: function() {
            var $elf = this, _fromIdx = this.input.idx, ps, b;
            return function() {
                this._form(function() {
                    return function() {
                        ps = this._many1(function() {
                            return this._apply("bhPredic");
                        });
                        return b = this._apply("bhBody");
                    }.call(this);
                });
                return "template(" + ps.join(" && ") + ") " + b;
            }.call(this);
        },
        topLevel: function() {
            var $elf = this, _fromIdx = this.input.idx, ts, t;
            return this._or(function() {
                return function() {
                    this._form(function() {
                        return ts = this._many1(function() {
                            return this._apply("bhTemplate");
                        });
                    });
                    return ts.join("\n\n");
                }.call(this);
            }, function() {
                return function() {
                    t = this._apply("bhTemplate");
                    return t;
                }.call(this);
            }, function() {
                return function() {
                    this._apply("empty");
                    return "template(true){}";
                }.call(this);
            });
        }
    });
}