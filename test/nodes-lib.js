'use strict';

var assert = require('chai').assert,
    PATH = require('path'),
    QFS = require('q-fs'),

    registry = require('..').require('./nodesregistry'),
    Node = require('..').require('./nodes/node'),
    SeedNode = require('..').require('./nodes/seed'),
    LibNodes = require('..').require('./nodes/lib');

/**
 * Mocha BDD interface.
 *
 * @name describe @function
 * @name it @function
 * @name before @function
 * @name after @function
 * @name beforeEach @function
 * @name afterEach @function
 */

describe('nodes', function() {

    describe('new SymlinkLibraryNode()', function() {

        var make = (new (registry.getNodeClass('SeedNode'))({})).make;

        registry.decl('SeedNode', {
            make: function() {
            }
        });

        var node = new (registry.getNodeClass(LibNodes.SymlinkLibraryNodeName))({
                root: PATH.resolve(__dirname, 'data'),
                target: 'symlink',
                relative: 'lib'
            }),
            symlink = PATH.resolve(__dirname, 'data', 'symlink');

        describe('.getId()', function() {
            it('equals to target*', function() {
                assert.equal(node.getId(), 'symlink*');
            });
        });

        describe('.getPath()', function() {
            it('equals to absolute path to target', function() {
                assert.equal(node.getPath(), symlink);
            });
        });

        describe('.make()', function() {

            afterEach(function() {
                QFS.remove(symlink);
            });

            it('creates symlink', function(done) {

                node.make()
                    .then(function() {

                        return QFS.statLink(symlink)
                            .then(function(stat) {
                                assert.ok(stat.isSymbolicLink());
                                done();
                            })
                            .fail(done);

                    })
                    .fail(done)
                    .done();

            });

        });

        registry.decl('SeedNode', { make: make });

    });

});
