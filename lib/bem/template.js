exports.process = function(template, vars) {
    return (Array.isArray(template)? template.join('\n') : template)
        .replace(/{{\s*bem([^\s}]*)\s*}}/gi, function(s, varName){
            return (vars || {})[varName] || '';
        });
};
