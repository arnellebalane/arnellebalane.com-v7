---
layout: ../../layouts/ArticleLayout.astro
title: 'Updating my website to use JavaScript Modules'
summary: 'JavaScript Modules has landed in Chrome 61, and this article describes how I started using it on my website.'
date: 2017-09-20
---

JavaScript Modules has [landed in Chrome 61](https://chromestatus.com/feature/5365692190687232)!
Excited to try out the Web platform's native way of defining and loading
modules, I started updating my website to use this new feature. This post is
going to be about the things that I did as well as the things that I still need
to figure out.

> JavaScript modules allow a program to be divided into multiple sequences of
> statements and declarations. Each module explicitly identifies declarations it
> uses that need to be provided by other modules and which of its declarations
> are available for use by other modules.

## Loading JavaScript modules

JavaScript modules are loaded with a `<script type="module">` element. Note the
`type="module"` attribute, which is required in order for the script to be
treated as a module by browsers that support it. Those that don't will just
ignore it.

Browsers that support JavaScript modules also ignore script tags that have the
`nomodule` attribute. This behavior is useful in specifying fallbacks to
browsers that don't support JavaScript modules yet, while the ones that do can
get the modules version.

With that , this is now what my code for loading my JavaScript files look like:

```html
<script type="module" src="modules/main.js"></script>
<script nomodule src="regular/lib/idb-fetch-mirror.js"></script>
<script nomodule src="regular/lib/utils.js"></script>
<script nomodule src="regular/main.js"></script>
```

## The module scope

With JavaScript modules, any top-level declarations are scoped within that
module only. This means that these declarations can be used from anywhere in
the module, but not by other modules. This is different from the regular
behavior where declarations gets into the global scope and is accessible by all
other scripts.

One of my JavaScript files, `idb-fetch-mirror.js`, uses the Revealing Module
Pattern in order to contain its functionality without polluting the global
scope and just returning the things that it wants other scripts to use:

```js
const ifm = (() => {
    function get(key) { ... }
    function put(key, value) { ... }
    function mirror(request) { ... }

    return mirror;
})();
```

With the module scope of JavaScript modules, I don't have to do this anymore,
and my declarations can be placed directly at the top-level of the module's
body:

```js
function get(key) { ... }
function put(key, value) { ... }
function mirror(request) { ... }
```

## Exporting functionality

The module scope makes sure that declarations in the module are scoped within
that module. If a module wants to expose some of its declarations for other
modules to use, it can do so by exporting them. Exporting is done by prefixing
the declaration with the `export` keyword.

I have a `utils.js` file which contains a bunch of utility functions. When
loaded as a module, those functions gets scoped within the module. Since I want
those functions to be usable by other modules, I make the `utils.js` module
export them:

```js
export function $(selector) { ... }
export function template(tmpl, context} { ... }
export function element(tmpl) { ... }
```

### Default exports

Modules can also declare default exports. This is usually done when the module
only wants to export a single value. To use default exports, the declaration to
be exported is prefixed with the `export default` keywords.

My `idb-fetch-mirror.js` module only exports a single function, `mirror()`, so
I exported it as a default export:

```js
function get(key) { ... }
function put(key, value) { ... }
export default function mirror(request) { ... }
```

## Importing dependencies

When loading my modules I am only loading `modules/main.js`, compared to the
fallbacks where each dependency is also loaded. This is because JavaScript
modules can explicitly identify from within their code the declarations in
other modules that it depends on. It does this by importing those declarations.

My `main.js` module depends on the utility functions inside `utils.js`, so it
imports them. The cool thing about this is that it can import only the things
that it needs.

```js
import { $, template, element } from './lib/utils.js';
```

`main.js` also uses the `idb-fetch-mirror.js` module, so it also needs to
import that. Since `idb-fetch-mirror.js` uses a default export to export its
functionality, importing it is more straightforward:

```js
import ifm from './idb-fetch-mirror.js';
```

There are many ways of importing a module depending on what you need. You can
check out this [MDN reference for import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import).

## Things I still have to fix and figure out

Despite the changes being minimal in converting my codebase to use JavaScript
modules, I've also encountered several difficulties. These are definitely not
issues with JavaScript modules but more with how I built my website. Any tips
on how to address these are appreciated.

### Duplicate code

In order to support both browsers that do and don't support JavaScript modules,
I had to make two versions of my code. Now my codebase is currently tiny, but
as more modules are added, maintaining two versions might not be desirable.

One thing I tried (you know, just in case it works haha) is to do something
like the UMD pattern but for modules. The problem is that I don't know how to
detect if a browser supports modules. Browsers that don't support modules also
throw a `SyntaxError`, which we can't `try…catch` for feature detection. So I
guess for now I'm stuck with my duplicate code.

### Preloading: which ones to preload?

My website also preloads the resources that it needs, including the JavaScript
files. This is so that these resources are fetched as early as possible and are
already available when the page needs them. This is currently done by sending
the `Link` header together with the response:

```
Link: <regular/main.js>; rel=preload; as=script,
      <regular/lib/idb-fetch-mirror.js>; rel=preload; as=script,
      <regular/lib/utils.js>; rel=preload; as=script
```

But now that I have two versions of my code, preloading both versions wouldn't
make sense. It would actually make things worse because the client would have
to download both versions of the code and then end up using just one of the
versions, thus wasting the user's precious bandwidth. Chrome even warns us when
preloaded resources are not used, saying to _"Please make sure it wasn't
preloaded for nothing."_

Ideally I would want to preload just the version of the code that the browser
supports, but I currently do not know how to determine that or if that's even
possible, so for now I just didn't preload any of JavaScripts yet. Might as
well wait a little longer for them to be available than waste bandwidth
preloading resources that are not going to be used anyway.

### Service worker caching: which ones to cache?

My website works offline by caching the resources that it needs and
intercepting network requests with a service worker. Since it needs the
JavaScript files to work offline, I can't just leave them out like what I did
with preloading. So I just ended up caching both versions of the code. They're
only going to be downloaded once, during the service worker's install step. I
guess that's a small price to pay to get it to work offline. It could be better
though.

> While writing this section I might have thought of a better way to do this. I
> could perform the caching of the JavaScript files from within the JavaScript
> files instead (instead of in the service worker) since they also have access
> to the Cache API. The modules version of my JavaScript can add only the URLs
> to the JavaScript modules into the cache, while the regular version can also
> only add the URLs to themselves. I'll update this once I've tested it out.

### Build system problems

I am using Gulp to build my website's assets and get them ready for production.
For building JavaScript specifically, I pipe them through Babel (`gulp-babel`)
to transpile ES6 code to ES5, then pipe the results to UglifyJS (`gulp-uglify`)
for minification.

My problem is that Babel treats the `import` calls as NodeJS module imports, and
thus transpiles them into `require()` calls. This doesn't work for the Web and
will result to errors. Babel has an option called `sourceType` which can be
used to indicate how the code should be parsed (I suppose setting it to
`'script'` will parse it as for the browser environment), but it doesn't
recognize the `import` and `export` keywords yet, saying that they are only
available with the `sourceType: 'module'`. So for now I currently do not
transpile the module versions of my code.

## Conclusion

I still have a lot to learn about other people's patterns regarding how they
use JavaScript modules so that I could address my issues which I just mentioned.
Nonetheless, it's really exciting to have a native way of defining and loading
modules on the Web, and it has finally arrived! Also, I guess it won't take
long already for modules to be natively supported and enabled by default in
NodeJS!

## Additional Resources

- [ECMAScript modules in browsers](https://jakearchibald.com/2017/es-modules-in-browsers/)
  by Jake Archibald, talks about browser-specific behavior of JavaScript modules.
- [ES6 Modules in Depth](https://ponyfoo.com/articles/es6-modules-in-depth)
  by Nicolás Bevacqua
