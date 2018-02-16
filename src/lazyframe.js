const Lazyframe = () => {

  let settings;

  const elements = [];

  const defaults = {
    vendor: undefined,
    id: undefined,
    src: undefined,
    thumbnail: undefined,
    title: undefined,
    apikey: undefined,
    initialized: false,
    parameters: undefined,
    y: undefined,
    debounce: 250,
    lazyload: true,
    initinview: false,
    onLoad: (l) => {},
    onAppend: (l) => {},
    onThumbnailLoad: (img) => {}
  };

  const constants = {
    regex: {
      youtube: /(?:youtube\.com\/\S*(?:(?:\/e(?:mbed))?\/|watch\?(?:\S*?&?v\=))|youtu\.be\/)([a-zA-Z0-9_-]{6,11})/,
      vimeo: /vimeo\.com\/(?:video\/)?([0-9]*)(?:\?|)/,
      vine: /vine.co\/v\/(.*)/
    },
    condition: {
      youtube: (m) => (m && m[1].length == 11) ? m[1] : false,
      vimeo: (m) => (m && m[1].length === 9 || m[1].length === 8) ? m[1] : false,
      vine: (m) => (m && m[1].length === 11) ? m[1] : false
    },
    src: {
      youtube: (s) => `https://www.youtube.com/embed/${s.id}/?${s.parameters}`,
      vimeo: (s) => `https://player.vimeo.com/video/${s.id}/?${s.parameters}`,
      vine: (s) => `https://vine.co/v/${s.id}/embed/simple`
    },
    endpoints: {
      youtube: (s) => `https://www.googleapis.com/youtube/v3/videos?id=${s.id}&key=${s.apikey}&fields=items(snippet(title,thumbnails))&part=snippet`,
      vimeo: (s) => `https://vimeo.com/api/oembed.json?url=https%3A//vimeo.com/${s.id}`,
      vine: (s) => `https://vine.co/oembed.json?url=https%3A%2F%2Fvine.co%2Fv%2F${s.id}`
    },
    response: {
      youtube: {
        title: (r) => r.items['0'].snippet.title,
        thumbnail: (r) => {
          let thumbs = r.items["0"].snippet.thumbnails;
          let thumb = thumbs.maxres || thumbs.standard || thumbs.high || thumbs.medium || thumbs.default;
          return thumb.url;
        }
      },
      vimeo: {
        title: (r) => r.title,
        thumbnail: (r) => r.thumbnail_url
      },
      vine: {
        title: (r) => r.title,
        thumbnail: (r) => r.thumbnail_url
      }
    }
  };

  function init(elements, ...args) {
    settings = Object.assign({}, defaults, args[0]);

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

    if(el instanceof HTMLElement === false ||
       el.classList.contains('lazyframe--loaded')) return;

    const lazyframe = {
      el: el,
      settings: setup(el),
    };

    lazyframe.el.addEventListener('click', () => {
      lazyframe.el.appendChild(lazyframe.iframe);

      const iframe = el.querySelectorAll('iframe');
      lazyframe.settings.onAppend.call(this, iframe[0]);
    });

    if (settings.lazyload) {
      build(lazyframe);
    } else {
      api(lazyframe, !!lazyframe.settings.thumbnail);
    }

  }

  function setup(el) {

    const attr = Array.prototype.slice.apply(el.attributes)
     .filter(att => att.value !== '')
     .reduce((obj, curr) => {
        let name = curr.name.indexOf('data-') === 0 ? curr.name.split('data-')[1] : curr.name;
        obj[name] = curr.value;
        return obj;
     }, {});

    const options = Object.assign({},
      settings,
      attr,
      {
        y: el.offsetTop,
        parameters: extractParams(attr.src)
      }
    );

    if (options.vendor) {
      const match = options.src.match(constants.regex[options.vendor]);
      options.id = constants.condition[options.vendor](match);
    }

    return options;

  }

  function extractParams(url) {
    let params = url.split('?');

    if (params[1]) {
      params = params[1];
      const hasAutoplay = params.indexOf('autoplay') !== -1;
      return hasAutoplay ? params : params + '&autoplay=1';

    } else {
      return 'autoplay=1';
    }

  }

  function useApi(settings) {

    if (!settings.vendor) return false;

    if (!settings.title || !settings.thumbnail) {
      if (settings.vendor === 'youtube') {
        return !!settings.apikey;
      } else {
        return true;
      }

    } else {
      return false;
    }

  }

  function api(lazyframe) {

    if (useApi(lazyframe.settings)) {
      send(lazyframe, (err, data) => {
        if (err) return;

        const response = data[0];
        const _l = data[1];

        if (!_l.settings.title) {
          _l.settings.title = constants.response[_l.settings.vendor].title(response);
        }
        if (!_l.settings.thumbnail) {
          const url = constants.response[_l.settings.vendor].thumbnail(response);
          _l.settings.thumbnail = url;
          lazyframe.settings.onThumbnailLoad.call(this, url);
        }
        build(_l, true);

      });

    }else{
      build(lazyframe, true);
    }

  }

  function send(lazyframe, cb) {

    const endpoint = constants.endpoints[lazyframe.settings.vendor](lazyframe.settings);
    const request = new XMLHttpRequest();

    request.open('GET', endpoint, true);

    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        const data = JSON.parse(request.responseText);
        cb(null, [data, lazyframe]);
      } else {
        cb(true);
      }
    };

    request.onerror = function() {
      cb(true);
    };

    request.send();

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
    let t = false, up = false;
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
      const docfrag = document.createDocumentFragment(),
            titleNode = document.createElement('span');

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

    const docfrag = document.createDocumentFragment(),
          iframeNode = document.createElement('iframe');

    if (settings.vendor) {
      settings.src = constants.src[settings.vendor](settings);
    }

    iframeNode.setAttribute('id', `lazyframe-${settings.id}`);
    iframeNode.setAttribute('src', settings.src);
    iframeNode.setAttribute('frameborder', 0);
    iframeNode.setAttribute('allowfullscreen', '');

    if (settings.vendor === 'vine') {
      const scriptNode = document.createElement('script');
      scriptNode.setAttribute('src', 'https://platform.vine.co/static/scripts/embed.js');
      docfrag.appendChild(scriptNode);
    }

    docfrag.appendChild(iframeNode);
    return docfrag;

  }

  return init;

}

const lf = Lazyframe();

export default lf;
