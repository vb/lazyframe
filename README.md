# lazyframe

[![lazyframe on NPM](https://img.shields.io/npm/v/jump.js.svg?style=flat-square)](https://www.npmjs.com/package/lazyframe)

Dependency-free library for lazyloading iframes. [Demo](https://viktorbergehall.github.io/lazyframe/)

Statistics show that nearly half of web users expect a site to load in 2 seconds or less, and they tend to abandon a site that isn’t loaded within 3 seconds. In order to decrease the page load  developers minifies, concatenate and optimize their css, js and images. But if the site is loading external resources, for example a Youtube video, there is not much to do to decrease the time it takes to serve that resource. Lazyframe sets out to solve that problem by creating a placeholder for the resource and push the loading of the resource for when the user interacts with it. 

Lazyframe comes with brand-like themes for Youtube, Vimeo and Vine. 

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

Javascript ES6 imports

```es6
import lazyframe from 'lazyframe.js';
```

Include javascript in html

```html
<script src="dist/lazyframe.min.js"></script>
```
Sass import

```
@import 'src/scss/lazyframe'; 
```
Include css in html

```html
<link rel="stylesheet" type="text/css" href="dist/lazyframe.css">
```

### Initialize

```es6
// Passing a target
lazyframe('.lazyframe');

// Passing a nodelist
let elements = document.querySelectorAll('.lazyframe');
lazyframe(elements);

// Passing a jQuery object
let elements = $('.lazyframe');
lazyframe(elements);
```

## Options

You can pass general options to lazyframe on initialization. Element-specific options (mosts options) is set on data attributes on the element itself. 

General options and corresponding defaults 

```es6
lazyframe(elements, {
   apikey: undefined,
   debounce: 250,
   lazyload: true,
   
   // Callbacks
   onLoad: (lf) => console.log(lf)
})
```
### apikey
If you want to load a thumbnail and title for a Youtube video you'll have to have an apikey. Get it from [here](console.developers.google.com) 

_If you don't feel like getting a key, just use your own thumbnail and title in data-thumbnail and data-title attribute_

### debounce
Value (in milliseconds) for when the update function should run after the user has scrolled. [More here](https://css-tricks.com/the-difference-between-throttling-and-debouncing/)

### lazyload
Set this to true if you want all api calls and local images to be loaded on page load (instead of when the element is in view).

### onLoad
Callback function for when a element is initialized.

##Element-specific options

```html
<div 
	class="lazyframe"
	data-vendor=""
	data-title=""
	data-thumbnail=""
	data-src=""
	data-initinview="false">
</div>
```
### data-vendor
Attribute for theming lazyframe. Currently supported values are youtube, vimeo and vine.
### data-title
Attribute for custom title. Leave empty to get value from api.
### data-thumbnail
Attribute for custom thumbnail. Leave empty to get value from api.
### data-src
The source of what you want to lazyload.
### data-initinview
Set this to true if you want the resource to execute (for example video to play) when the element is in view.

## License

[MIT](https://opensource.org/licenses/MIT). © 2016 Viktor Bergehall
