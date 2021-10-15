const path = require('path')
const { readFileSync } = require('fs')
const { Script } = require('vm')

const test = require('ava')
const { JSDOM, VirtualConsole } = require('jsdom')

const MockXMLHttpRequest = require('mock-xmlhttprequest')
const MockXhr = MockXMLHttpRequest.newMockXhr()

MockXhr.onSend = (xhr) => {
  const responseHeaders = { 'Content-Type': 'application/json' }
  const response =
    '{ "title": "mock title", "thumbnail_url": "mock thumbnail url" }'
  xhr.respond(200, responseHeaders, response)
}

const virtualConsole = new VirtualConsole()
virtualConsole.sendTo(console)

const script = new Script(
  readFileSync(path.join(__dirname, '..', 'dist', 'lazyframe.min.js'))
)

test.beforeEach(() => {
  const dom = new JSDOM(``, {
    includeNodeLocations: true,
    resources: 'usable',
    runScripts: 'dangerously',
    virtualConsole,
  })

  dom.runVMScript(script)
  global.document = dom.window.document
  dom.window.XMLHttpRequest = MockXhr
  global.window = dom.window
})

const createDomNode = (params = {}) => {
  const node = document.createElement('div')
  node.classList.add('lazyframe')
  for (const [key, value] of Object.entries(params)) {
    node.setAttribute(`data-${key}`, value)
  }
  document.body.appendChild(node)
  return node
}

const lazyframe = (initializer = '.lazyframe', config = {}, cb = 'onLoad') => {
  return new Promise((resolve) => {
    let i = 0
    const nodes = window.lazyframe(initializer, {
      ...config,
      lazyload: false,
      onLoad: (e) => {
        if (!nodes) {
          resolve(e)
        } else {
          i++

          if (i === nodes.length) {
            resolve(e)
          }
        }
      },
    })
  })
}

test('should expose lazyframe()', async (t) => {
  t.true(typeof window.lazyframe === 'function')
})

test('should initialize one node with a string selector', async (t) => {
  createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })
  await lazyframe()
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 1)
})

test('should initialize mulitple nodes with a string selector', async (t) => {
  createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })
  createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })

  await lazyframe()
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 2)
})

test('should initialize with a single node', async (t) => {
  const node = createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })

  await lazyframe(node)
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 1)
})

test('should initialize with a nodelist', async (t) => {
  createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDB/?rel=0',
  })
  createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDC/?rel=0',
  })

  const nodes = document.querySelectorAll('.lazyframe')
  await lazyframe(nodes)
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 2)
})

test('should append an iframe on click', async (t) => {
  const node = createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })

  await lazyframe()
  node.click()

  t.assert(node.querySelector('iframe'))
})

test('should call onAppend callback function', async (t) => {
  let i = 0
  const node1 = createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })
  const node2 = createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
  })

  await lazyframe('.lazyframe', {
    onAppend() {
      i++
    },
  })
  node1.click()
  node2.click()

  t.is(i, 2)
})

test('should use data-title', async (t) => {
  const title = 'custom title'
  const node = createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0',
    title,
  })

  await lazyframe()

  node.click()
  t.is(document.querySelector('.lazyframe__title').textContent, title)
})

test('should append optional query params from data-src', async (t) => {
  const query = 'rel=0&p=1'
  const node = createDomNode({
    src: 'http://www.youtube.com/embed/iwGFalTRHDA/?' + query,
  })

  await lazyframe()

  node.click()
  const iframe = node.querySelector('iframe')
  const src = iframe.getAttribute('src')
  const [, iframQuery] = src.split('?autoplay=1&')

  t.is(iframQuery, query)
})
