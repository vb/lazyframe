# Lazyframe

[![Node.js Package](https://github.com/vb/lazyframe/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/vb/lazyframe/actions/workflows/npm-publish.yml)
[![npm version](https://badge.fury.io/js/lazyframe.svg)](https://badge.fury.io/js/lazyframe)

Dependency-free library for lazyloading iframes. [Demo](https://vb.github.io/lazyframe/)

## Why?

Because embedded content takes time to load.

- **Youtube** – 11 requests ≈ 580kb
- **Google maps** – 52 requests ≈ 580kb
- **Vimeo** – 8 requests ≈ 145kb

Lazyframe creates a responsive placeholder for embedded content and requests it when the user interacts with it. This decreases the page load and idle time.

Lazyframe comes with brand-like themes for Youtube and Vimeo.

1. [Install](#install)
2. [Import](#import)
3. [Initialize](#Initialize)
4. [Options](#options)

### Install

NPM

```bash
$ npm install lazyframe --save
```

Bower

```bash
$ bower install lazyframe
```

### Import

JavaScript ES6 imports

```js
import lazyframe from 'lazyframe'
```

Include JavaScript and css in html

```html
<script src="dist/lazyframe.min.js"></script>
```

CSS import

```css
@import 'src/lazyframe.css';
```

Include css in html

```html
<link rel="stylesheet" href="dist/lazyframe.css" />
```

### Initialize

```js
// Passing a selector
lazyframe('.lazyframe')

// Passing a nodelist
let elements = document.querySelectorAll('.lazyframe')
lazyframe(elements)

// Passing a jQuery object
let elements = $('.lazyframe')
lazyframe(elements)
```

## Options

You can pass general options to lazyframe on initialization. Element-specific options (most options) are set on data attributes on the element itself.

General options and corresponding defaults

```js
lazyframe(elements, {
  debounce: 100,
  lazyload: true,
  autoplay: true,
  youtubeThumbnailQuality: 'hq',
  youtubeThumbnailImage: 'default',
  // Callbacks
  onLoad: (lazyframe) => console.log(lazyframe),
  onAppend: (iframe) => console.log(iframe),
  onThumbnailLoad: (img) => console.log(img),
})
```

### `debounce`

Value (in milliseconds) for when the update function should run after the user has scrolled. [More here](https://css-tricks.com/the-difference-between-throttling-and-debouncing/)

### `lazyload`

Set this to `false` if you want all API calls and local images to be loaded on page load (instead of when the element is in view).

### `autoplay`

Set this to `false` to remove autoplay from the `allow` attribute on the iframe tag i.e if set this to `false` if you want don't want your Youtube video to automatically start playing once the user clicks on the play icon.

### youtubeThumbnailQuality

Defines the thumbnail quality to use from Youtubes thumbnail service. Possible values are '', 'sd', 'mq', 'hq' and 'maxres'

### youtubeThumbnailImage

Defines the thumbnail image to use from Youtubes thumbnail service. Possible values are 'default', '1', '2' and '3'

### `onLoad`

Callback function for when a element is initialized.

### `onAppend`

Callback function for when the iframe is appended to DOM.

### `onThumbnailLoad`

Callback function with the thumbnail URL

## Element-specific options

```html
<div
  class="lazyframe"
  data-vendor=""
  data-title=""
  data-thumbnail=""
  data-src=""
  data-ratio="1:1"
  data-initinview="false"
  data-youtube-thumbnail-image="default"
  data-youtube-thumbnail-quality="hq"
></div>
```

### `data-vendor`

Attribute for theming lazyframe. Currently supported values are `youtube`, `youtube_nocookie` and `vimeo`.

### `data-title`

Attribute for custom title. Leave empty to get value from noembed.com.

### `data-thumbnail`

Attribute for custom thumbnail. Leave empty to get value from noembed.com.

### `data-src`

The source of what you want to lazyload.

### `data-ratio`

The ratio of the lazyframe. Possible values: 16:9, 4:3, 1:1

### `data-initinview`

Set this to true if you want the resource to execute (for example video to play) when the element is in view.

### data-youtube-thumbnail-image

Defines the thumbnail image to use from Youtubes thumbnail service. Possible values are 'default', '1', '2' and '3'.

### data-youtube-thumbnail-quality

Defines the thumbnail quality to use from Youtubes thumbnail service. Possible values are '', 'sd', 'mq', 'hq' and 'maxres'

## License

[MIT](https://opensource.org/licenses/MIT). © 2016 Viktor Bergehall
