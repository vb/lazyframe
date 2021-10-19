import './lazyframe.css'

interface LazyframeObject extends LazyframeSettings {
  node: HTMLElement
}

interface LazyframeOptions {
  debounce: number
  lazyload: boolean
  autoplay: boolean
  youtubeThumbnailQuality: '' | 'sd' | 'mq' | 'hq' | 'maxres'
  youtubeThumbnailImage: 'default' | '1' | '2' | '3'
  onLoad: (node: HTMLElement) => void
  onAppend: (node: HTMLElement | null) => void
  onThumbnailLoad: (url: string) => void
}

type OverrideAbleSettings = Pick<
  LazyframeOptions,
  'youtubeThumbnailImage' | 'youtubeThumbnailQuality'
>
interface LazyframeSettings extends OverrideAbleSettings {
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

const Lazyframe = () => {
  const findVendorIdAndQuery = new RegExp(
    /^(?:https?:\/\/)?(?:www\.)?(youtube-nocookie|youtube|vimeo)(?:\.com)?\/?.*(?:watch|embed)?(?:.*v=|v\/|\/)([\w-_]+)(?:\&|\?|\/\?)?(.+)?$/
  )

  const youtube = {
    quality: {
      values: ['', 'sd', 'mq', 'hq', 'maxres'],
      default: 'hq' as LazyframeSettings['youtubeThumbnailQuality'],
    },
    image: {
      values: ['default', '1', '2', '3'],
      default: 'default' as LazyframeSettings['youtubeThumbnailImage'],
    },
    isYoutube: (vendor: LazyframeSettings['vendor']) =>
      vendor && vendor.indexOf('youtube') > -1,
  }

  enum Classes {
    LOADED = 'lazyframe--loaded',
    TITLE = 'lazyframe__title',
  }

  const nodes: LazyframeObject[] = []

  let settings: LazyframeOptions = {
    debounce: 100,
    lazyload: true,
    autoplay: true,
    youtubeThumbnailQuality: youtube.quality.default,
    youtubeThumbnailImage: youtube.image.default,
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
    if (node.classList.contains(Classes.LOADED)) {
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

    titleNode.className = Classes.TITLE
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

    const youtube = getYoutubeSettings(node)

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
      youtubeThumbnailQuality: youtube.quality,
      youtubeThumbnailImage: youtube.image,
    }
  }

  function getYoutubeSettings(node: HTMLElement) {
    let quality = node.getAttribute('data-youtube-thumbnail-quality')
    if (!quality || !youtube.quality.values.includes(quality)) {
      quality = settings.youtubeThumbnailQuality
    }
    let image = node.getAttribute('data-youtube-thumbnail-image')
    if (!image || !youtube.image.values.includes(image)) {
      image = settings.youtubeThumbnailImage
    }
    return {
      image: image as LazyframeSettings['youtubeThumbnailImage'],
      quality: quality as LazyframeSettings['youtubeThumbnailQuality'],
    }
  }

  function fetchFromApi(lazyframe: LazyframeObject): Promise<LazyframeObject> {
    return fetch(`https://noembed.com/embed?url=${lazyframe.src}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.title) {
          lazyframe.title = json.title
        }
        if (json.thumbnail_url) {
          if (youtube.isYoutube(lazyframe.vendor)) {
            if (
              lazyframe.youtubeThumbnailImage === youtube.image.default &&
              lazyframe.youtubeThumbnailQuality === youtube.quality.default
            ) {
              lazyframe.thumbnail = json.thumbnail_url
            }
            lazyframe.thumbnail = json.thumbnail_url.replace(
              new RegExp(youtube.quality.default + youtube.image.default),
              lazyframe.youtubeThumbnailQuality +
                lazyframe.youtubeThumbnailImage
            )
          } else {
            lazyframe.thumbnail = json.thumbnail_url
          }
        }
        return lazyframe
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
    const titleNode = lazyframe.node.querySelector(`.${Classes.TITLE}`)

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
    lazyframe.node.classList.add(Classes.LOADED)
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
    vendor: LazyframeSettings['vendor'],
    query: string,
    src: string,
    id: string
  ) {
    const docfrag = document.createDocumentFragment()
    const iframeNode = document.createElement('iframe')

    let embed = src
    if (youtube.isYoutube(vendor)) {
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
