import './scss/lazyframe.scss'

const Lazyframe = () => {
  const findVendorIdAndQuery = new RegExp(
    /^(?:https?:\/\/)?(?:www\.)?(youtube-nocookie|youtube|vimeo)(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)(?:\&|\?|\/\?)?(.+)?$/
  )

  const classNames = {
    loaded: 'lazyframe--loaded',
    title: 'lazyframe__title',
  }

  const nodes = []

  let settings = {
    debounce: 250,
    lazyload: true,
    autoplay: true,
    onLoad: () => {},
    onAppend: () => {},
    onThumbnailLoad: () => {},
  }

  function init(initializer, config) {
    settings = { ...settings, ...config }

    const selection =
      typeof initializer === 'string'
        ? document.querySelectorAll(initializer)
        : typeof initializer.length === 'undefined'
        ? [initializer]
        : initializer

    for (const node of selection) {
      if (node instanceof HTMLElement) {
        create(node)
      }
    }

    if (settings.lazyload) {
      scroll()
    }

    return nodes
  }

  function create(node) {
    if (node.classList.contains(classNames.loaded)) {
      return
    }

    const lazyframe = {
      ...getSettingsFromNode(node),
      node,
    }

    const titleNode = createTitleNode(lazyframe)
    lazyframe.node.appendChild(titleNode)

    lazyframe.iframeNode = createIframeNode(lazyframe)

    lazyframe.node.addEventListener('click', onClick, { once: true })
    function onClick() {
      lazyframe.node.appendChild(lazyframe.iframeNode)
      settings.onAppend.call(this, node.querySelector('iframe'))
    }

    nodes.push(lazyframe)

    if (settings.lazyload) {
      return
    } else {
      createPlaceholder(lazyframe)
    }
  }

  function createTitleNode(lazyframe) {
    const fragment = document.createDocumentFragment()
    const titleNode = document.createElement('span')

    titleNode.className = classNames.title
    fragment.appendChild(titleNode)

    if (lazyframe.title) {
      titleNode.innerHTML = lazyframe.title
    }
    lazyframe.node.appendChild(fragment)
    return fragment
  }

  function getSettingsFromNode(node) {
    const src = node.getAttribute('data-src')
    const title = node.getAttribute('data-title')
    const thumbnail = node.getAttribute('data-thumbnail')
    const initinview = node.getAttribute('data-initinview')

    if (!src) {
      throw new Error('You must supply a data-src on the node')
    }

    const [, vendor, id, params] = src.match(findVendorIdAndQuery) || []
    if (vendor) {
      node.setAttribute('data-vendor', vendor)
    }

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
      initialized: false,
    }
  }

  function fetchFromApi(lazyframe) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', `https://noembed.com/embed?url=${lazyframe.src}`)
      xhr.onload = function () {
        if (this.status === 200) {
          const json = JSON.parse(xhr.response)
          if (json.title) {
            lazyframe.title = json.title
          }
          if (json.thumbnail_url) {
            lazyframe.thumbnail = json.thumbnail_url
          }
          resolve(lazyframe)
        } else {
          reject()
        }
      }
      xhr.send()
    })
  }

  function createPlaceholder(lazyframe) {
    if (lazyframe.useApi) {
      fetchFromApi(lazyframe).then(populatePlaceholder)
    } else {
      populatePlaceholder(lazyframe)
    }
  }

  function populatePlaceholder(lazyframe) {
    const titleNode = lazyframe.node.querySelector('.lazyframe__title')

    if (lazyframe.title && titleNode.innerHTML === '') {
      titleNode.innerHTML = lazyframe.title
    }
    if (lazyframe.thumbnail) {
      lazyframe.node.style.backgroundImage = `url(${lazyframe.thumbnail})`
    }
    onLoad(lazyframe)
  }

  function onLoad(lazyframe) {
    lazyframe.node.classList.add(classNames.loaded)
    lazyframe.initialized = true
    if (lazyframe.initinview) {
      lazyframe.node.click()
    }
    settings.onLoad.call(this, lazyframe.node)
  }

  function scroll() {
    nodes
      .filter(({ node }) => node.offsetTop < window.innerHeight)
      .forEach(createPlaceholder)

    let lastY = 0

    const onScroll = debounce(() => {
      const scrollDown = lastY < window.pageYOffset
      lastY = window.pageYOffset

      if (scrollDown) {
        nodes
          .filter(({ initialized }) => initialized === false)
          .filter(({ node }) => node.offsetTop < window.innerHeight + lastY)
          .forEach(createPlaceholder)
      }

      if (nodes.filter(({ initialized }) => initialized === false).length < 1) {
        window.removeEventListener('scroll', onScroll, false)
      }
    }, settings.debounce)

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

  function createIframeNode(lazyframe) {
    const docfrag = document.createDocumentFragment()
    const iframeNode = document.createElement('iframe')

    const vendor = lazyframe.vendor || ''

    if (vendor.indexOf('youtube') > -1) {
      lazyframe.embed = `https://www.${vendor}.com/embed/${lazyframe.id}/?${lazyframe.query}`
    } else if (vendor === 'vimeo') {
      lazyframe.embed = `https://player.vimeo.com/video/${lazyframe.id}/?${lazyframe.query}`
    } else {
      lazyframe.embed = lazyframe.src
    }

    if (lazyframe.id) {
      iframeNode.setAttribute('id', `lazyframe-${lazyframe.id}`)
    }
    iframeNode.setAttribute('src', lazyframe.embed)
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
