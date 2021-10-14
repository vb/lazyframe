import './scss/lazyframe.scss'

const Lazyframe = () => {
  const findVendorIdAndQuery = new RegExp(
    /^(?:https?:\/\/)?(?:www\.)?(youtube-nocookie|youtube|vimeo)(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)(?:\&|\?|\/\?)?(.+)?$/
  )

  const nodes = []

  const defaults = {
    vendor: undefined,
    id: undefined,
    src: undefined,
    thumbnail: undefined,
    title: undefined,
    debounce: 250,
    lazyload: true,
    autoplay: true,
    initinview: false,
    onLoad: () => {},
    onAppend: () => {},
    onThumbnailLoad: () => {},
  }

  function init(initializer, globalConfig) {
    const settings = { ...defaults, ...globalConfig }

    const selection =
      typeof initializer === 'string'
        ? document.querySelectorAll(initializer)
        : typeof initializer.length === 'undefined'
        ? [initializer]
        : initializer

    for (const node of selection) {
      if (node instanceof HTMLElement) {
        loop(node, settings)
      }
    }

    if (settings.lazyload) {
      scroll(settings.debounce)
    }
  }

  function loop(node, settings) {
    if (node.classList.contains('lazyframe--loaded')) {
      return
    }

    const lazyframe = {
      ...settings,
      ...setup(node, settings),
      node,
      initialized: false,
    }

    lazyframe.node.addEventListener('click', () => {
      lazyframe.node.appendChild(lazyframe.iframe)
      lazyframe.onAppend.call(this, node.querySelector('iframe'))
    })

    if (settings.lazyload) {
      build(lazyframe, false)
    } else {
      api(lazyframe)
    }
  }

  function setup(node, settings) {
    const src = node.getAttribute('data-src')
    const title = node.getAttribute('data-title')
    const thumbnail = node.getAttribute('data-thumbnail')
    const initinview = node.getAttribute('data-initinview')

    if (!src) {
      throw new Error('You must supply a data-src on the node')
    }

    const [, vendor, id, params] = src.match(findVendorIdAndQuery) || []
    const autoplay = settings.autoplay ? 1 : 0
    const query = params ? '&' + params : ''
    return {
      src,
      title,
      thumbnail,
      initinview,
      id,
      vendor,
      useApi: vendor && (!title || !thumbnail),
      query: `autoplay=${autoplay}${query}`,
    }
  }

  function api(lazyframe) {
    if (lazyframe.useApi) {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', `https://noembed.com/embed?url=${lazyframe.src}`)
      xhr.onload = function () {
        if (this.status === 200) {
          const json = JSON.parse(xhr.response)
          console.log(json)
          if (!lazyframe.title) {
            lazyframe.title = json.title
          }
          if (!lazyframe.thumbnail) {
            lazyframe.thumbnail = json.thumbnail_url
            lazyframe.onThumbnailLoad.call(this, json.thumbnail_url)
          }
          build(lazyframe, true)
        }
      }
      xhr.send()
    } else {
      build(lazyframe, true)
    }
  }

  function onLoad(lazyframe) {
    lazyframe.node.classList.add('lazyframe--loaded')
    if (lazyframe.initinview) {
      lazyframe.node.click()
    }
    lazyframe.onLoad.call(this, lazyframe)
  }

  function scroll(debounceMs) {
    const initElement = (lazyframe) => {
      lazyframe.initialized = true
      api(lazyframe)
      onLoad(lazyframe)
    }

    nodes
      .filter((lf) => lf.node.offsetTop < window.innerHeight)
      .forEach(initElement)

    let lastY = 0

    const onScroll = debounce(() => {
      const scrollDown = lastY < window.pageYOffset
      lastY = window.pageYOffset

      if (scrollDown) {
        nodes
          .filter((lf) => lf.initialized === false)
          .filter((lf) => lf.node.offsetTop < window.innerHeight + lastY)
          .forEach(initElement)
      }

      if (nodes.filter((lf) => !lf.initialized).length < 1) {
        window.removeEventListener('scroll', onScroll, false)
      }
    }, debounceMs)

    window.addEventListener('scroll', onScroll, false)
  }

  function debounce(func, wait) {
    let timeout
    return function () {
      let later = () => {
        timeout = null
        func.apply(this)
      }
      let callNow = !timeout
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(this)
    }
  }

  function build(lazyframe, loadImage) {
    lazyframe.iframe = getIframe(lazyframe)

    if (lazyframe.thumbnail && loadImage) {
      lazyframe.node.style.backgroundImage = `url(${lazyframe.thumbnail})`
    }

    if (lazyframe.title && lazyframe.node.children.length === 0) {
      const docfrag = document.createDocumentFragment()
      const titleNode = document.createElement('span')

      titleNode.className = 'lazyframe__title'
      titleNode.innerHTML = lazyframe.title
      docfrag.appendChild(titleNode)

      lazyframe.node.appendChild(docfrag)
    }

    if (!lazyframe.lazyload) {
      lazyframe.node.classList.add('lazyframe--loaded')
      lazyframe.onLoad.call(this, lazyframe)
      nodes.push(lazyframe)
    }

    if (!lazyframe.initialized) {
      nodes.push(lazyframe)
    }
  }

  function getIframe(lazyframe) {
    const docfrag = document.createDocumentFragment()
    const iframeNode = document.createElement('iframe')

    if (
      lazyframe.vendor === 'youtube' ||
      lazyframe.vendor === 'youtube-nocookie'
    ) {
      lazyframe.src = `https://www.${lazyframe.vendor}.com/embed/${lazyframe.id}/?${lazyframe.query}`
    } else if (lazyframe.vimeo) {
      lazyframe.src = `https://player.vimeo.com/video/${s.id}/?${lazyframe.query}`
    }

    iframeNode.setAttribute('id', `lazyframe-${lazyframe.id}`)
    iframeNode.setAttribute('src', lazyframe.src)
    iframeNode.setAttribute('frameborder', 0)
    iframeNode.setAttribute('allowfullscreen', '')

    if (lazyframe.autoplay) {
      iframeNode.allow =
        'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'
    }

    docfrag.appendChild(iframeNode)
    return docfrag
  }

  return init
}

const lf = Lazyframe()

export default lf
