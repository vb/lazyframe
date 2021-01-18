# LazyframeAdvanced

[comment]: <> ([![npm version]&#40;https://badge.fury.io/js/lazyframeAdvanced.svg&#41;]&#40;https://badge.fury.io/js/lazyframeAdvanced&#41;)

Dependency-free library for lazyloading iframes and embeds like YouTube, Vimeo, Twitter, Google Maps, Codepen etc.

Watch some examples here: [https://jmartsch.github.io/lazyframeAdvanced](https://jmartsch.github.io/lazyframeAdvanced)

## Why?

Because the JavaScript loaded from the external providers is big and takes much time to load. This slows down your site, even if your visitors don't want to see your beautiful videos.

For example here are the number of requests and filesizes of some well-known services.

* **YouTube** – 11 requests ≈ 580kb
* **Google maps** – 52 requests ≈ 580kb
* **Vimeo** – 8 requests ≈ 145kb

LazyframeAdvanced creates a responsive placeholder for embedded content and requests it when the user interacts with it. This decreases the page load and idle time.

LazyframeAdvanced comes with brand-like themes for YouTube and other services.

### Why Advanced?

The original Lazyframe library seems abandoned and the original author does not respond to questions or pull requests anymore. As there are some services missing and we wanted to make some improvements, we created our own version.

## Installation Instructions
1. [Install](#install)
2. [Import](#import)
3. [Initialize](#Initialize)
4. [Options](#options)
5. [Changelog](#changelog)
5. [Compile from Source](#compile-from-source)

### Install

NPM

```bash
$ npm install git+https://github.com/jmartsch/lazyframeAdvanced.git
```

### Import

JavaScript ES6 imports

```js
import lazyframe from 'lazyframeAdvanced';
```

Include JavaScript in html

```html
<script src="dist/lazyframe.min.js"></script>
```

Sass import

```sass
@import 'src/scss/lazyframe';
```

Include css in html

```html
<link rel="stylesheet" href="dist/lazyframe.css">
```

### Initialize

```js
// Passing a selector
lazyframe('.lazyframe');

// Passing a nodelist
let elements = document.querySelectorAll('.lazyframe');
lazyframe(elements);

// Passing a jQuery object
let elements = $('.lazyframe');
lazyframe(elements);
```

## Options

You can pass general options to lazyframe on initialization. Element-specific options (most options) are set on data attributes on the element itself.

General options and corresponding defaults

```js
lazyframe(elements, {
   apikey: undefined,
   debounce: 250,
   lazyload: true,

   // Callbacks
   onLoad: (lazyframe) => console.log(lazyframe),
   onAppend: (iframe) => console.log(iframe),
   onThumbnailLoad: (img) => console.log(img)
})
```

### `apikey`

If you want to load a thumbnail and title for a YouTube video you'll have to have an API key with the YouTube data API library enabled. Get it from [here](https://console.developers.google.com/)

_If you don't feel like getting a key, just use your own thumbnail and title in data-thumbnail and data-title attribute_

### `debounce`

Value (in milliseconds) for when the update function should run after the user has scrolled. [More here](https://css-tricks.com/the-difference-between-throttling-and-debouncing/)

### `lazyload`

Set this to `false` if you want all API calls and local images to be loaded on page load (instead of when the element is in view).

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
    data-initinview="false">
</div>
```

### `data-vendor`

Attribute for theming lazyframe. Currently supported values are `youtube`, `vimeo` and `vine`.

### `data-title`

Attribute for custom title. Leave empty to get value from API.

### `data-thumbnail`

Attribute for custom thumbnail. Leave empty to get value from API.

### `data-src`

The source of what you want to lazyload.

### `data-ratio`

The ratio of the lazyframe. Possible values: 16:9, 4:3, 1:1

### `data-initinview`

Set this to true if you want the resource to execute (for example video to play) when the element is in view.

## Changelog
* v1.1.901 betterify example page
* v1.1.9 remove gulp and rollup and use webpack instead
    * use Babel 7
    * add changelog to README
    * add Compile from source instructions
* v1.1.8 add rel=0 parameter to YouTube videos

## Compile from source
* clone the github repo
* cd into the cloned directory
* make your changes in the script or the scss file
* run `npx webpack`
* copy scripts from dist folder

## License

[MIT](https://opensource.org/licenses/MIT). © 2021 Jens Martsch
[MIT](https://opensource.org/licenses/MIT). © 2016 Viktor Bergehall
