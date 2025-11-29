---
layout: ../../layouts/ArticleLayout.astro
title: 'Introduction to RequireJS'
summary: 'This article gives an introduction to RequireJS, a popular AMD module loader for the Web.'
date: 2017-09-12
---

This article is going to be an introduction to loading JavaScript modules for
the Web using RequireJS, one of the major components in our frontend tech stack
at [ChannelFix](https://channelfix.com/).

## Introduction

As Web applications grow in size and complexity, so does the need to manage
that complexity in a maintainable way. Especially these days with all the new
modern tools and libraries that we use to build our applications, it's easy to
end up with code that looks like:

```html
<script src="vendor/jquery.min.js"></script>
<script src="vendor/bootstrap.min.js"></script>
<script src="vendor/another-dependency.js"></script>
<script src="index.js"></script>
<script src="posts.js"></script>
<script src="comments.js"></script>
<!-- many more <script> tags -->
```

This is how scripts are loaded in an HTML document, but it can get out of hand
pretty quickly. To name the potential downsides that I know of:

1. We need to make sure that the scripts are loaded in the correct order.
   Dependencies need to be loaded before the scripts that depend on them,
   otherwise bad things could happen.
1. It's difficult to identify which scripts are the dependencies of a specific
   script. Removing a script tag could affect one or more scripts that we
   didn't know depended on it.
1. When a script fails to load, it does not prevent the scripts that depend on
   it from executing, leaving them with errors due to a missing dependency.
1. Scripts pollute the global namespace, possibly causing name conflicts. We
   usually work around this by namespacing our modules.

There are several standards that address these concerns and and make loading
JavaScript modules more manageable. One such way is the **Asynchronous Module
Definition** or **AMD**.

## Asynchronous Module Definition

AMD is a standard for defining modules in JavaScript. Its main advantages are:

1. It is asynchronous. Imported modules can be loaded in parallel, and once
   everything has been successfully loaded then the importing module can be
   evaluated. This works great for the browser environment which needs to fetch
   the modules over the network.
1. Modules do not pollute the global namespace. AMD modules are wrapped in a
   function where variables and functions are scoped into. This means that we
   also don't need to namespace our modules anymore.

There are many libraries that support the AMD standard. One popular library is
[RequireJS](https://requirejs.org/).

When using RequireJS, our JavaScript modules can explicitly specify the modules
that they depend on. RequireJS will then take care of loading those modules,
and once everything is loaded that's when the module definition is evaluated.
Modules can also expose a public API which becomes available to other modules
that depend on them.

## Getting RequireJS

In order to use RequireJS, you have to [download it](https://requirejs.org/docs/download.html)
and load it in your HTML document. Let's say all our JavaScript files are saved
inside a scripts directory.

```html
<script src="scripts/require.js"></script>
```

Once it's loaded and executed, we get two globals: `require` and `define`.
We'll see more about them in a while.

## Configuring RequireJS

RequireJS can be configured before or after the `require.js` script is loaded.

### Configuring before the script is loaded

In this case, all we have to do is define a variable named `require` and store
our configurations in there.

```html
<script>
    const require = {
        // configuration goes here
    };
</script>
<script src="scripts/require.js"></script>
```

When RequireJS loads, it will check if this available is already defined, and
use its value as the configuration.

### Configuring after the script is loaded

In this case, we have to call `require.config` and pass in our configuration
object.

```html
<script src="scripts/require.js"></script>
<script>
    require.config({
        // configuration goes here
    });
</script>
```

Configurations can also be specified before and after the script has loaded.
The latest configurations are not going to fully replace the existing
configurations, but instead just extend it.

That means we can define a `require` variable, and then call `require.config()`
multiple times. The configurations are going to be combined.

### Configuration Options

RequireJS has [a lot of configuration options](https://requirejs.org/docs/api.html#config),
but for now, let's add just one option: `baseUrl`.

The `baseUrl` configuration lets RequireJS know where the root path for all our
modules is (i.e. where our JavaScript modules are located), and use it when
looking for those modules.

For example, if we have a module at `scripts/utils.js` and our `baseUrl` is set
to `'scripts'`, then in order to load that module we only need to specify
`'utils.js'`. RequireJS will automatically look for it relative to the
`baseUrl`.

## The Entry Point Script

The entry point script is the JavaScript module where RequireJS starts loading
other modules and executing your code from. If you think of your JavaScript
codebase as a tree where each node is a module and each node's children are its
dependencies, then the entry point script is the root node of that tree.

_Note: For the rest of this article, we will assume the following project
structure:_

```
scripts/
    components/
        dropdowns.js
        popups.js
    vendor/
        jquery.js
        mustache.js
        require.js
    index.js
index.html
```

### Loading the entry point script

You can load the entry point in two different ways. The first one is just
loading it normally with regular `<script>` tags:

```html
<script>
    const require = {
        baseUrl: 'scripts',
    };
</script>
<script src="scripts/vendor/require.js"></script>
<script src="scripts/index.js"></script>
```

This approach is useful when you have multiple entry point scripts that you
need to execute for that page (yes you can have multiple entry point scripts).

The second way of loading the entry point script is useful for when you only
need one entry point:

```html
<script>
    const require = {
        baseUrl: 'scripts',
    };
</script>
<script src="scripts/vendor/require.js" data-main="index.js"></script>
```

The entry point script is defined in the `data-main` attribute of the `<script>`
tag that loads RequireJS. Its path is already specified as relative to the
`baseUrl` configuration.

### Defining the entry point script

Now let's take a look at what the code inside our entry point script,
`index.js`, should be:

```js
require([], function () {
    // our code here...
});
```

Our entry point script contains a call to the `require()` function, which
accepts two arguments. The first argument is an array of paths to modules that
it depends on. The second argument is a function representing the module's
definition. The function only gets executed only when all the dependencies have
been loaded successfully.

For example, let's say in our entry point script we want to use jQuery and our
dropdowns component. We just specify those modules in the dependency array, and
RequireJS will make sure that they are loaded first before running our module.

```js
require(['vendor/jquery', 'components/dropdowns'], function ($, dropdowns) {
    // our code here...
});
```

You will notice that when specifying the paths to the modules we do not include
the `.js` extension. That is because putting the extension will treat the
module as a plain JavaScript file instead of a RequireJS module, and therefore
the `baseUrl` config will not be used in loading it.

You will also notice that our function now has two parameters, `$` and
`dropdowns`. These correspond to the API that are exposed by our dependencies
(we will see this in the next section), and it is very important to make sure
that the order of these parameters exactly matches the dependency order in the
dependency array.

## Defining Modules

A module in RequireJS is a JavaScript file that contains some functionality,
and then optionally exposes a public API which other modules can use. The
nature of these functionalities is up to us. It could be related to
manipulating UI elements (e.g. dropdowns and popups) or doing some clever
calculations.

Defining a module with RequireJS is simple and would look familiar to us by now:

```js
define([], function () {
    // our code here...
});
```

It looks exactly the same as defining the body of our entry points scripts,
with the only difference being that it's using `define()` instead of
`require()`. The arguments are also the same: the first argument being an array
of dependencies which RequireJS will make sure are properly loaded before
executing the module definition which is the second argument.

### `require()` vs. `define()`

One thing that we were confused about for a while when we were starting out
with RequireJS is when to use `require()` and when to use `define()`, since
they kinda look like they're doing the same thing.

Despite doing basically the same thing, an important difference between the two
is that `define()` only "defines" a module that other modules can depend on. It
does not run the module's definition unless it is `require()`-ed (or depended
on by another dependency module somewhere in a `require()` call). `require()`,
on the other hand, executes the module definition right away after all its
dependencies have loaded.

A good rule of thumb is that if the module is an entry point script (i.e. it is
going to be loaded in a `<script>` tag), use `require()`. Otherwise, use
`define()`.

### Exposing a public API

One benefit if using RequireJS is that modules don't pollute the global
namespace, because all their declarations are scoped inside their module
definition, effectively making them "private" to the module.

As an example, let's add some functionality to our `dropdowns.js` module:

```js
define([], function () {
    function openDropdown(dropdown) {
        // ...
    }

    function closeDropdown(dropdown) {
        // ...
    }
});
```

The `openDropdown` and `closeDropdown` functions are scoped inside the module
and therefore not accessible by outside code. If we want outside code to be
able to use these functionalities, we need to make our module expose them. This
is done by making the module return the things that we want to expose.

```js
define([], function () {
    // ...
    return {
        open: openDropdown,
        close: closeDropdown,
    };
});
```

Now whenever our `dropdowns.js` module is loaded as a dependency in some other
module, what they will get is the public API that the module exposes. They also
don't have to rely on some global variables because the API is passed to the
module definition function.

```js
require(['components/dropdowns'], function (dropdowns) {
    dropdowns.open('#my-dropdown');
    dropdowns.close('#my-dropdown');
});
```

## References

- [The power of the Asynchronous Module Definition](https://2ality.com/2011/10/amd.html)
- [RequireJS API Documentation](https://requirejs.org/docs/api.html)
