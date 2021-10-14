const path = require('path');
const { readFileSync } = require('fs');
const { Script } = require('vm');

const test = require('ava');
const { JSDOM, VirtualConsole } = require('jsdom');

const virtualConsole = new VirtualConsole();
virtualConsole.sendTo(console);

const script = new Script(
  readFileSync(path.join(__dirname, '..', 'dist', 'lazyframe.min.js'))
);

test.beforeEach(t => {
  const dom = new JSDOM(``, {
    includeNodeLocations: true,
    resources: 'usable',
    runScripts: 'dangerously',
    virtualConsole
  });

  dom.runVMScript(script);  
  global.document = dom.window.document;
  global.window = dom.window;
})

const createDomNode = (params = {}) => {
  const node = document.createElement('div');
  node.classList.add('lazyframe');
  for (const [ key, value ] of Object.entries(params)) {
    node.setAttribute(`data-${key}`, value)
  }
  document.body.appendChild(node);
  return node;
}

test('should expose lazyframe()', (t) => {
  t.true(typeof window.lazyframe === 'function');
});

test('should initialize one node with a string selector', (t) => {
  createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });
  window.lazyframe('.lazyframe');
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 1);
})

test('should initialize mulitple nodes with a string selector', (t) => {
  createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });
  createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });

  window.lazyframe('.lazyframe');
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 2);
})

test('should initialize with a single node', (t) => {
  const node = createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });

  window.lazyframe(node);
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 1);
})

test('should initialize with a nodelist', (t) => {
  createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDB/?rel=0' });
  createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDC/?rel=0' });

  const nodes = document.querySelectorAll('.lazyframe')
  window.lazyframe(nodes);
  t.is(document.querySelectorAll('.lazyframe--loaded').length, 2);
})

test('should append an iframe on click', (t) => {
  const node = createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });

  window.lazyframe('.lazyframe');
  node.click();
  
  t.assert(node.querySelector('iframe'))
})

test('should call onAppend callback function', (t) => {
  let i = 0;
  const node1 = createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });
  const node2 = createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0' });

  window.lazyframe('.lazyframe', {
    onAppend() {
      i++;
    }
  });
  node1.click();
  node2.click();
  
  t.is(i, 2)
})

test('should use data-title', (t) => {
  const title = 'custom title'
  const node = createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?rel=0', title });

  window.lazyframe('.lazyframe');

  node.click()
  t.is(document.querySelector('.lazyframe__title').textContent, title)
})

test('should append optional query params from data-src', (t) => {
  const query = 'rel=0&p=1'
  const node = createDomNode({ vendor: 'youtube', src: 'http://www.youtube.com/embed/iwGFalTRHDA/?' + query });
  
  window.lazyframe('.lazyframe');

  node.click()
  const iframe = node.querySelector('iframe');
  const src = iframe.getAttribute('src');
  const [,iframQuery] = src.split('?autoplay=1&')

  t.is(iframQuery, query);
})