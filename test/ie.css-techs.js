'use strict';
var BEMSmoke = require('bem-smoke');

function testIeTech(version, originalSuffix) {
    version = version || '';
    originalSuffix = originalSuffix || 'css';

    var techName = 'ie' + version + '.css',
        originalName = 'out.' + originalSuffix,
        sourceFile = 'example.' + techName,
        hoverSuffix = 'hover.' + techName,
        hoverSourceFile = 'example.hover.' + techName,
        targetName = 'out.' + techName;

    describe(techName +' tech', function() {
        var tech;
        beforeEach(function() {
            tech = BEMSmoke.testTech(require.resolve('../lib/techs/v2/' + techName));
        });

        it('appends .' + hoverSuffix + ' and .' + techName +' to .' + originalSuffix + ' file', function(done) {
            var sourceFiles = {'example': {}};
            sourceFiles.example[originalName] = '.original {}';
            sourceFiles.example[hoverSourceFile] = '.hover {}';
            sourceFiles.example[sourceFile] = '.source {}';

            tech.withSourceFiles(sourceFiles)
                .build('/out', {
                    deps: [
                        {block: 'example'}
                    ]
                })
                .producesFile(targetName)
                .withContent('@import url(' + originalName + ');',
                             '@import url(example/' + hoverSourceFile + ');',
                             '@import url(example/' + sourceFile + ');',
                             '')
                .notify(done);
        });
    });
}

testIeTech();
testIeTech(6, 'ie.css');
testIeTech(7, 'ie.css');
testIeTech(8, 'ie.css');
testIeTech(9);

