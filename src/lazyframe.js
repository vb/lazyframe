import './scss/lazyframe.scss'

const Lazyframe = () => {

  const findVendorIdAndQuery = new RegExp(/^(?:https?:\/\/)?(?:www\.)?(youtube-nocookie|youtube|vimeo)(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)(?:\&|\?|\/\?)?(.+)?$/);

  let settings;

  const elements = [];

  const defaults = {
    vendor: undefined,
    id: undefined,
    src: undefined,
    thumbnail: undefined,
    title: undefined,
    initialized: false,
    y: undefined,
    debounce: 250,
    lazyload: true,
    autoplay: true,
    initinview: false,
    onLoad: (l) => {},
    onAppend: (l) => {},
    onThumbnailLoad: (img) => {}
  };

  function init(elements, ...args) {
    settings = {...defaults, ...args[0]};

    if (typeof elements === 'string') {

      const selector = document.querySelectorAll(elements);
      for (let i = 0; i < selector.length; i++) {
        loop(selector[i]);
      }

    } else if (typeof elements.length === 'undefined'){
      loop(elements);

    } else if (elements.length > 1) {

      for (let i = 0; i < elements.length; i++) {
        loop(elements[i]);
      }

    } else {
      loop(elements[0]);
    }

    if (settings.lazyload) {
      scroll();
    }

  }

  function loop(el) {

    if (el instanceof HTMLElement === false || el.classList.contains('lazyframe--loaded')) {
      return;
    }

    const lazyframe = {
      el: el,
      settings: setup(el),
    };

    lazyframe.el.addEventListener('click', () => {
      lazyframe.el.appendChild(lazyframe.iframe);
      lazyframe.settings.onAppend.call(this, el.querySelector('iframe'));
    });

    if (settings.lazyload) {
      build(lazyframe, false);
    } else {
      api(lazyframe);
    }

  }

  function setup(el) {

    const attributes = Array.from(el.attributes)
     .filter(att => att.value !== '')
     .filter(att => att.name.startsWith('data-'))
     .reduce((obj, { name, value }) => {
        const key = name.split('data-')[1];
        obj[key] = value;
        return obj;
     }, {});

     if (!attributes.src) {
       throw new Error('You must supply a data-src on the DOM Node');
     } 
    
    const [,vendor, id, query = ''] = attributes.src.match(findVendorIdAndQuery) || [];
    return {
      ...settings,
      ...attributes,
      ...{
        y: el.offsetTop,
        id,
        vendor,
        query: `${query}${query ? '&' : ''}autoplay=${settings.autoplay ? '1' : '0'}`
      }
    };

  }

  function api(lazyframe) {
    if (lazyframe.settings.vendor) {
      fetch(`https://noembed.com/embed?url=${lazyframe.settings.src}`)
        .then(res => res.json())
        .then(json => {
          if (!lazyframe.settings.title) {
            lazyframe.settings.title = json.title
          }
          if (!lazyframe.settings.thumbnail) {
            lazyframe.settings.thumbnail = json.thumbnail_url;
            lazyframe.settings.onThumbnailLoad.call(this, json.thumbnail_url);
          }

          build(lazyframe, true);  
        })
    }else{
      build(lazyframe, true);
    }

  }

  function scroll() {

    const height = window.innerHeight;
    let count = elements.length;
    const initElement = (el, i) => {
      el.settings.initialized = true;
      el.el.classList.add('lazyframe--loaded');
      count--;
      api(el);

      if (el.settings.initinview) {
        el.el.click();
      }

      el.settings.onLoad.call(this, el);
    }

    elements
      .filter(el => el.settings.y < height)
      .forEach(initElement);

    const onScroll = debounce(() => {

      up = lastY < window.pageYOffset;
      lastY = window.pageYOffset;

      if (up) {
        elements
          .filter(el => el.settings.y < (height + lastY) && el.settings.initialized === false)
          .forEach(initElement);
      }

      if (count === 0) {
        window.removeEventListener('scroll', onScroll, false);
      }

    }, settings.debounce);

    let lastY = 0;
    let up = false;

    window.addEventListener('scroll', onScroll, false);

    function debounce(func, wait, immediate) {
      let timeout;
      return function() {
        let context = this, args = arguments;
        let later = function() {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };
        let callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
      };
    };

  }

  function build(lazyframe, loadImage) {

    lazyframe.iframe = getIframe(lazyframe.settings);

    if (lazyframe.settings.thumbnail && loadImage) {
      lazyframe.el.style.backgroundImage = `url(${lazyframe.settings.thumbnail})`;
    }

    if (lazyframe.settings.title && lazyframe.el.children.length === 0) {
      const docfrag = document.createDocumentFragment();
      const titleNode = document.createElement('span');

      titleNode.className = 'lazyframe__title';
      titleNode.innerHTML = lazyframe.settings.title;
      docfrag.appendChild(titleNode);

      lazyframe.el.appendChild(docfrag);
    }

    if (!settings.lazyload) {
      lazyframe.el.classList.add('lazyframe--loaded');
      lazyframe.settings.onLoad.call(this, lazyframe);
      elements.push(lazyframe);
    }

    if (!lazyframe.settings.initialized) {
      elements.push(lazyframe);
    }

  }

  function getIframe(settings) {

    const docfrag = document.createDocumentFragment();
    const iframeNode = document.createElement('iframe');

    if (settings.vendor === 'youtube' || settings.vendor === 'youtube-nocookie') {
      settings.src = `https://www.${settings.vendor}.com/embed/${settings.id}/?${settings.query}`;
    } else if (settings.vimeo) {
      settings.src = `https://player.vimeo.com/video/${s.id}/?${settings.query}`
    }

    iframeNode.setAttribute('id', `lazyframe-${settings.id}`);
    iframeNode.setAttribute('src', settings.src);
    iframeNode.setAttribute('frameborder', 0);
    iframeNode.setAttribute('allowfullscreen', '');
    
    if (settings.autoplay) {
      iframeNode.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
    }

    docfrag.appendChild(iframeNode);
    return docfrag;

  }

  return init;

}

const lf = Lazyframe();

export default lf;
