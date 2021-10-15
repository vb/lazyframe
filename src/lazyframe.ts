import './lazyframe.css'

interface LazyframeObject extends LazyframeSettings {
  node: HTMLElement
}

interface LazyframeSettings {
  src: string
  embed: string
  title: string | null
  thumbnail: string | null
  initinview: boolean | null
  id: string | null
  vendor: 'youtube' | 'youtube-nocookie' | 'vimeo' | null
  useApi: boolean
  query: string
  initialized: boolean
  iframeNode: DocumentFragment
}

interface LazyframeOptions {
  debounce: number
  lazyload: boolean
  autoplay: boolean
  onLoad: (node: HTMLElement) => void
  onAppend: (node: HTMLElement | null) => void
  onThumbnailLoad: (url: string) => void
}

const Lazyframe = () => {
  const findVendorIdAndQuery = new RegExp(
    /^(?:https?:\/\/)?(?:www\.)?(youtube-nocookie|youtube|vimeo)(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)(?:\&|\?|\/\?)?(.+)?$/
  )

  const classNames = {
    loaded: 'lazyframe--loaded',
    title: 'lazyframe__title',
  }

  const nodes: LazyframeObject[] = []

  let settings: LazyframeOptions = {
    debounce: 100,
    lazyload: true,
    autoplay: true,
    onLoad: () => {},
    onAppend: () => {},
    onThumbnailLoad: () => {},
  }

  function init(
    initializer: string | HTMLElement | NodeList,
    config: Partial<LazyframeOptions>
  ) {
    settings = { ...settings, ...config }

    const selection =
      typeof initializer === 'string'
        ? document.querySelectorAll(initializer)
        : initializer instanceof NodeList
        ? initializer
        : [initializer]

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

  function create(node: HTMLElement) {
    if (node.classList.contains(classNames.loaded)) {
      return
    }

    const lazyframe: LazyframeObject = {
      ...getSettingsFromNode(node),
      node,
    }

    const titleNode = createTitleNode(lazyframe)
    lazyframe.node.appendChild(titleNode)

    lazyframe.node.addEventListener('click', onClick, { once: true })
    function onClick() {
      lazyframe.node.appendChild(lazyframe.iframeNode)
      settings.onAppend.call(null, node.querySelector('iframe'))
    }

    nodes.push(lazyframe)

    if (settings.lazyload) {
      return
    } else {
      createPlaceholder(lazyframe)
    }
  }

  function createTitleNode(lazyframe: LazyframeObject) {
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

  function getSettingsFromNode(node: HTMLElement): LazyframeSettings {
    const src = node.getAttribute('data-src')
    const title = node.getAttribute('data-title')
    const thumbnail = node.getAttribute('data-thumbnail')
    const initinview = node.getAttribute('data-initinview') === 'true'

    if (!src) {
      throw new Error('You must supply a data-src on the node')
    }

    const [, vendorObj, id, params] = src.match(findVendorIdAndQuery) || []
    const vendor = vendorObj ? (vendorObj as LazyframeSettings['vendor']) : null
    if (vendor) {
      if (vendor === 'youtube-nocookie') {
        node.setAttribute('data-vendor', 'youtube')
      } else {
        node.setAttribute('data-vendor', vendor)
      }
    }

    const query = `autoplay=${settings.autoplay ? 1 : 0}${
      params ? '&' + params : ''
    }`

    return {
      src,
      title,
      thumbnail,
      initinview,
      id,
      vendor,
      embed: src,
      useApi: !!vendor && (!title || !thumbnail),
      query,
      initialized: false,
      iframeNode: createIframeNode(vendor, query, src, id),
    }
  }

  function fetchFromApi(lazyframe: LazyframeObject): Promise<LazyframeObject> {
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

  function createPlaceholder(lazyframe: LazyframeObject) {
    if (lazyframe.useApi) {
      fetchFromApi(lazyframe).then(populatePlaceholder)
    } else {
      populatePlaceholder(lazyframe)
    }
  }

  function populatePlaceholder(lazyframe: LazyframeObject) {
    const titleNode = lazyframe.node.querySelector('.lazyframe__title')

    if (lazyframe.title && titleNode && titleNode.innerHTML === '') {
      titleNode.innerHTML = lazyframe.title
    }
    if (lazyframe.thumbnail) {
      lazyframe.node.style.backgroundImage = `url(${lazyframe.thumbnail})`
      settings.onThumbnailLoad.call(null, lazyframe.thumbnail)
    }
    onLoad(lazyframe)
  }

  function onLoad(lazyframe: LazyframeObject) {
    lazyframe.node.classList.add(classNames.loaded)
    lazyframe.initialized = true
    if (lazyframe.initinview) {
      lazyframe.node.click()
    }
    settings.onLoad.call(null, lazyframe.node)
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

  function debounce(func: () => void, wait: number) {
    let timeout: null | NodeJS.Timeout
    return function () {
      let later = () => {
        timeout = null
        func.apply(null)
      }
      let callNow = !timeout
      if (timeout) {
        clearTimeout(timeout)
      }
      timeout = setTimeout(later, wait)
      if (callNow) func.apply(null)
    }
  }

  function createIframeNode(
    vendor: LazyframeObject['vendor'] | '' = '',
    query: string,
    src: string,
    id: string
  ) {
    const docfrag = document.createDocumentFragment()
    const iframeNode = document.createElement('iframe')

    let embed = src
    if (vendor && vendor.indexOf('youtube') > -1) {
      embed = `https://www.${vendor}.com/embed/${id}/?${query}`
    } else if (vendor === 'vimeo') {
      embed = `https://player.vimeo.com/video/${id}/?${query}`
    }

    if (id) {
      iframeNode.setAttribute('id', `lazyframe-${id}`)
    }
    iframeNode.setAttribute('src', embed)
    iframeNode.setAttribute('frameborder', '0')
    iframeNode.setAttribute('allowfullscreen', '')

    if (settings.autoplay) {
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
