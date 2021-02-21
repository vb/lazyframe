const path = require('path');

const test = require('ava');

const lazyframe = require('..');

test('should expose lazyframe()', (t) => {
  t.true(typeof lazyframe === 'function');
});
