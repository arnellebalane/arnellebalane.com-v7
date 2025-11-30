---
layout: ../../layouts/ArticleLayout.astro
title: 'Sending data across different browser tabs'
summary: 'This article describes three different ways to send data across browser tabs using different Web Platform APIs.'
date: 2017-12-01
---

Some time ago I explored different ways of sending data across different
browser tabs or windows. My challenge is for it to be a purely client-side
solution, so [WebSockets](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
cannot be used. This was inspired by the need for such a solution in a project
that we're working on, as well as the release of the new
[BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
which made me wonder how it could be done before it became available.

## BroadcastChannel API

As mentioned, there is a new Web API called the
[BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel)
which has been available since Chrome 54 and
[recent versions of several other browsers](https://caniuse.com/broadcastchannel).
Its purpose is to allow simple communication between different browsing
contexts (i.e. windows, tabs, workers, etc.) from the same origin. Here is an
example of how to use it:

```js
const channel = new BroadcastChannel('channel-name');
```

We create a new channel using the `BroadcastChannel` constructor which accepts
a name for the channel as an argument. The channel name is important because
channels that are listening on the same channel name will be able to broadcast
messages to each other. Channels can be instantiated from different tabs,
workers, and other browsing contexts, but as long as they are listening on the
same channel name, they will be able to communicate with each other.

To make a channel broadcast a message, we would call the channel's
`postMessage()` method which accepts any kind of object:

```js
channel.postMessage('some message');
channel.postMessage({ key: 'value' });
```

This will fire a `message` event to all the other channels that are listening
on the same channel name. Channels can then add an event handler for this event
in order to obtain the broadcasted message:

```js
channel.onmessage = function (e) {
    const message = e.data;
};
```

We can also make a channel stop receiving messages by closing it:

```js
channel.close();
```

Ideally, the BroadcastChannel API is the way to go when talking about
communication across multiple tabs as it was designed to solve that specific
problem. It not only broadcasts data across tabs but other browsing contexts as
well, including workers, iframes, etc. However, this API is relatively new and
at the time of writing is only supported by the latest versions of major
browsers. So what are the alternatives?

## SharedWorker API

A Web Worker is a Javascript file that is run by the browser in the background,
separate from our applications' main thread. A
[Shared Worker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker)
behaves in a similar way as regular Web Workers except that different browsing
contexts from the same origin will have shared access to the worker. In other
words, if you have five tabs running the same Shared Worker script, the browser
will only run one instance of that script in the background, and the five tabs
will have shared access to the context and state of that single running Shared
Worker.

We can make use of Shared Workers and their behavior to create a messaging
channel for all connected tabs. First thing we need to do is create the Shared
Worker script. Let's name it `shared-worker.js` and leave it empty for now.

Let's say we have two browser tabs, and each of these tabs want to use the the
Shared Worker script to perform some operations, each of them would run some
JavaScript code containing this:

```js
const worker = new SharedWorker('shared-worker.js');
```

This creates a new `SharedWorker` object, executing the script located at the
path passed in to the constructor. Each tab can communicate with the
`SharedWorker` object via a `MessagePort` which can be accessed from
`worker.port`. The Shared Worker script also has access to their ports, because
every time a tab connects to the Shared Worker a `connect` event is fired
within the Shared Worker script.

```js
// shared-worker.js
const connections = [];

onconnect = function (e) {
    const port = e.ports[0];
    connections.push(port);
};
```

`MessagePort` objects here only allow communication between the tab and the
Shared Worker script, so if we want the tab to broadcast data to other tabs,
we'd make the Shared Worker remember the MessagePorts to other tabs.

To send data from a tab to the Shared Worker, we would call the MessagePort's
`postMessage` method:

```js
worker.port.postMessage('some message');
```

This will fire a message event in the port in the Shared Worker, which we can
attach an event handler for and forward the data to the other tabs by still
using the `postMessage` method:

```js
// shared-worker.js
const port = e.ports[0];

port.onmessage = function (e) {
    connections.forEach(function (connection) {
        if (connection !== port) {
            connection.postMessage(e.data);
        }
    });
};
```

Finally, tabs can receive data from the Shared Worker script by similarly
adding an event handler for the `message` event on the `MessagePort` object:

```js
worker.port.onmessage = function (e) {
    const message = e.data;
};
```

And that's how we use Shared Workers to make a messaging channel across
multiple tabs! It does require a separate file for the Shared Worker script,
but I guess that's just a small price to pay to achieve inter-tab
communications.

## Local Storage

One last alternative is to use `localStorage`, part of the
[Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API).
This API provides a mechanism for storing key-value pairs in the browser. One
nice thing about this is that every time a stored item changes (e.g. gets
added, removed, or modified), an event is fired in other tabs letting them know
about that change. We can make use of this behavior to make a messaging channel
across multiple tabs as well.

The `localStorage` object is directly available from the window object, so we
can use it right away from there. Storing key-value pairs into localStorage can
be done as:

```js
localStorage.setItem('key', 'value');
```

Keys and values are always stored as strings, so we have to serialize complex
objects before storing them. This will fire a `storage` event in the other
tabs' `window` objects, which they can add an event handler for:

```js
window.onstorage = function (e) {
    const message = e.newValue; // previous value at e.oldValue
};
```

There are other complexities involved with using localStorage for this purpose.
One is that adding the exact same key-value pair values will not fire the
`storage` event. This can be taken care of by always deleting the stored
key-value pair right away. Another is that writing key-value pairs is prone to
race conditions. We'd also have to add our own mechanism to handle that
properly.

This approach is definitely not the most elegant, but it gets the job done.

---

I made a library called [hermes](https://github.com/arnellebalane/hermes) which
aims to provide a consistent API for a client-side messaging channel. Under the
hood, it only abstracts the different solutions described in the previous
sections of this article.

After we've loaded the library, we can use it to easily send data to other tabs:

```js
hermes.send('key', 'value');
```

Other tabs can listen for messages using the `.on()`/`.off()` methods:

```js
hermes.on('key', function(data) { ... });

// stop listening for messages
hermes.off('key');
```

I hope you find this helpful in your projects. You can also submit issues or
contributions through the [Github repository](https://github.com/arnellebalane/hermes).
