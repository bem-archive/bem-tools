/** @requires BEM */
/** @requires BEM.DOM */

(function() {

BEM.DOM.decl({ name: 'b-link', modName: 'togcolor', modVal: 'yes'}, {

    _onClick : function(e) {
        this.__base.apply(this, arguments);
        this.toggleMod('color', 'red', 'green')
    }

});

})();
