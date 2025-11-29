---
layout: ../../layouts/ArticleLayout.astro
title: 'Negative indexes in JavaScript arrays using Proxies'
summary: 'This article shows how we can utilize Proxies in order to use negative indexes in JavaScript arrays.'
cover_image: /images/blog/javascript-array-negative-index-using-proxies.webp
date: 2019-02-08
---

JavaScript arrays are collections of items, where each item is accessible
through an index. These indexes are non-negative integers, and accessing a
negative index will just return `undefined`.

```js
// JavaScript:

const letters = ['a', 'b', 'c', 'd', 'e'];
letters[0]; // => 'a'
letters[2]; // => 'c'
letters[-1]; // => undefined
```

In other programming languages, Python for instance, we can use negative
indexes to access items from the end of an array:

```python
# Python:

letters = ['a', 'b', 'c', 'd', 'e'];
letters[0]; // => 'a'
letters[-1]; // => 'e'
```

This behavior is not available is JavaScript by default. Instead, we have to
write some verbose code to get the last item of the array, for example:

```js
// JavaScript:

const letters = ['a', 'b', 'c', 'd', 'e'];
letters[letters.length - 1]; // => 'e'
```

Fortunately, using **Proxies**, we can support accessing our array items
starting from the end using negative indexes.

## What are Proxies?

A **Proxy** is an object that essentially wraps any other object (called the
**target**). Any interactions performed on the proxy are by default forwarded
to the target, as if we’re still interacting directly with the target.

The power of proxies, however, lies in the ability to define traps. Traps are
methods that capture operations on the proxy object (such as setting/getting
properties values, deleting a property, etc.) and allow us to define custom
behaviors for those operations.

## Creating a Proxy

We can create a proxy object using the Proxy constructor:

```js
const proxy = new Proxy(letters, {});
```

It accepts the target object to wrap, and an object defining the traps whose
behaviors we want to customize. In the example above, we are not defining any
traps yet, so any operations on the proxy will just be forwarded to the target
object.

## Defining our first trap

When accessing an array item using a negative index, like `proxy[-1]`, we are
trying to "get" a property named "`-1`" in our target array. By default, that
will simply return `undefined`. But since we have already wrapped that array in
a proxy object, we can now define a `get` trap to customize the "get property"
behavior.

```js
const proxy = new Proxy(letters, {
    get(target, prop) {
        return target[prop];
    },
});
```

The [`get` trap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/Proxy/get)
method is passed the target object and the property that we’re trying to access.
Whatever value we return from this method becomes the value returned to whoever
tried to access it.

## Handling negative array indexes

With our proxy object and the `get` trap in place, we can now proceed with
returning items from the end of the target array when accessing negative indexes.

```js
const proxy = new Proxy(letters, {
    get(target, prop) {
        if (!isNaN(prop)) {
            prop = parseInt(prop, 10);
            if (prop < 0) {
                prop += target.length;
            }
        }
        return target[prop];
    },
});
```

Here we’re checking if the property we’re trying to access is a number (btw,
numeric property names such as array indexes get converted to strings when
passed to the `get` trap) and if it is negative. If yes, we convert it to a
valid array index value, and return the array item at that computed index.
After that, we can now use negative indexes on proxied arrays:

```js
const letters = ['a', 'b', 'c', 'd', 'e'];
const proxy = new Proxy(letters, {
    get(target, prop) {
        if (!isNaN(prop)) {
            prop = parseInt(prop, 10);
            if (prop < 0) {
                prop += target.length;
            }
        }
        return target[prop];
    },
});
proxy[0]; // => 'a'
proxy[-1]; // => 'e'
proxy[-2]; // => 'd'
```

## What’s next?

In this article we’ve barely scratched the surface of what JavaScript Proxies
can do. We’ve looked at the `get` trap, which allows us to customize the
behavior of getting a property from the proxied object.

Proxies support many more traps, such as setting or deleting a property,
checking if a property exists, calling the target as a constructor, etc.
Check out its [documentation at MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
to learn more about them.

Proxies is a really powerful feature that enables us to write code that would
previously be impossible or very difficult to do. I’m looking forward to other
use cases for this feature.
