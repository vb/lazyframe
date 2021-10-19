const path = require('path')

const test = require('ava')

const lazyframe = require('../dist/lazyframe.module')

test('should expose lazyframe()', (t) => {
  t.true(typeof lazyframe === 'function')
})
