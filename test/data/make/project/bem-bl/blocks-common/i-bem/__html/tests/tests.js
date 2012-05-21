var sys = require('sys'),
    fs = require('fs');

fs.readFile(process.argv[2], 'utf8', function(err, input){
    if (err) throw err;
    //console.log(input);
    try {
        var xjst = require('xjst'),
            bemhtml = require('../lib/bemhtml'),
            result = bemhtml.BEMHTMLParser.matchAll(
                input,
                'topLevel',
                undefined,
                function(m, i) { console.log(arguments); throw { errorPos: i, toString: function(){ return "match failed" } } }
            );
        process.stdout.write('--- tree:\n' + JSON.stringify(result) + '\n\n');

        var compileFn = bemhtml.BEMHTMLToXJST.match(
            result,
            'topLevel',
            undefined,
            function(m, i) { process.stdout.write(JSON.stringify(arguments)); throw { toString: function(){ return "compilation failed" } } } );
        process.stdout.write('--- compile:\n' + compileFn + '\n\n');

        var compileFn2 = xjst.compile(xjst.parse(compileFn));
        //process.stdout.write('--- compile2:\n' + compileFn2 + '\n\n');
        //fs.writeFile('blabla', compileFn2);
        try {
            compileFn2 = process.compile(compileFn2, 'compile2').apply;
        } catch(e) { console.log(e) }

        process.stdout.write('\n-=-=-=-=-=-=-=-=-=-=-\n\n');
        fs.readFile(process.argv[2] + '.json', 'utf8', function(err, input){
            if (err) return;
            input = JSON.parse(input);

            try {
                process.stdout.write(
                    compileFn2.apply(input) +
                    '\n\n');
            } catch(e) {
                console.log(e);
                console.log(e.message);
                console.log(e.stack);
            }
        });

    } catch (e) {
        e.errorPos != undefined &&
            sys.error(
                input.slice(0, e.errorPos) +
                "\n--- Parse error ->" +
                input.slice(e.errorPos) + '\n');
        console.log('error: ' + e);
        throw e
    }
});
