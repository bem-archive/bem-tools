#!/usr/bin/env node

var PATH = require('path'),
    U = require('../lib/util');

U.symbolicLink(PATH.resolve(__dirname, '..', 'node_modules', 'bem'), '..', true).end();
