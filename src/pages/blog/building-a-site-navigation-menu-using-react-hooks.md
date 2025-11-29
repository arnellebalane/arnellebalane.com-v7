---
layout: ../../layouts/ArticleLayout.astro
title: 'Building a site navigation menu using React Hooks'
summary: 'This article describes how I used React Hooks to make a stateful navigation menu.'
cover_image: /images/blog/building-a-site-navigation-menu-using-react-hooks.jpg
date: 2019-01-20
---

I'm currently learning React, and since I learn better by building stuff, I
decided to rebuild my personal website with it. It's still a work in progress
but there is one component which I found interesting to build: the site's
navigation menu.

![Navigation menu preview](../../images/blog/building-a-site-navigation-menu-using-react-hooks/navigation-menu-preview.gif)

It's just a simple menu, and I only have two requirements for it:

1. The user needs to be able to toggle its state to open or close
1. It should close when the user navigates to a different page

## Initial setup

I initially built a static version of the site, composed of the top-level `App`
component, a `Header` component, and a `Menu` component. The `App` component
looks like this:

```js
// App.jsx

import Header from './Header.jsx';
function App(props) {
    const isMenuOpen = false;
    return (
        <div>
            <Header isMenuOpen={isMenuOpen} />
            {/* Other stuff */}
        </div>
    );
}
```

As shown in the code snippet, the `App` component has an `isMenuOpen` variable
which it passes to `Header` as the `isMenuOpen` prop. The `Header` in turn
passes the same `isMenuOpen` prop to `Menu`. The value of this variable
controls whether `Menu` should be shown or hidden.

## isMenuOpen component state

Initially, `isMenuOpen` is just a variable whose value I manually change to
update the UI. This is okay for the initial static version of the app, but I
don't really want that on the actual app. I want the component to keep track of
this variable, modify its value in response to a user action (e.g. a click on
the toggle menu button), and re-render the UI based on its new value.

To achieve that, I need to make `isMenuOpen` an actual state on the `App`
component. Normally this would be done by converting `App` from a functional
component into a class component. This is because functional components can't
have state while class components can. If I follow this approach, the `App`
component will become:

```js
// App.jsx

class App extends React.Components {
    constructor(props) {
        super(props);
        this.state = {
            isMenuOpen: false,
        };
        this.handleToggleMenu = this.handleToggleMenu.bind(this);
    }
    handleToggleMenu() {
        this.setState((state) => ({
            isMenuOpen: !state.isMenuOpen,
        }));
    }
    render() {
        return (
            <div>
                <Header isMenuOpen={this.state.isMenuOpen} onToggleMenu={this.handleToggleMenu} />
                {/* Other stuff */}
            </div>
        );
    }
}
```

I would have done it this way, but then it just happened that I just recently
read about [React Hooks](https://legacy.reactjs.org/docs/hooks-intro.html) from
the docs.

React Hooks gives us access to features such as states and lifecycle methods
without having to use class components (in fact, they should only be used in
functional components). It seemed like I had an opportunity to use React Hooks
for my navigation menu so I decided to try it out.

### Make sure to use the right React version

At the time of writing, React Hooks is still on preview, and is only available
in **React v16.8.0-alpha.0**. I had to update the corresponding packages to use
the right versions:

```bash
npm install react@16.8.0-alpha.0 react-dom@16.8.0-alpha.0
```

### Using the useState hook

With the correct versions of `react` and `react-dom` installed, I can now start
using React Hooks. Since I want to use states in my functional `App` component,
I used React's built-in [`useState`](https://legacy.reactjs.org/docs/hooks-state.html)
hook.

```js
import {useState} from react;
```

Then used it to initialize the `isMenuOpen` state:

```js
function App(props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
}
```

The `useState` hook accepts one argument which is the initial value to set the
state to, and returns an array of two things: the current state value and a
function used to update the state value.

And just like that, I now have a reactive `isMenuOpen` state with just very
minimal changes in the code. I was able to use state in my component while
keeping it as a functional component. In fact, to me it still kinda looks like
I'm just declaring the `isMenuOpen` variable from the static version of the
component. The complete `App` component now looks like:

```js
// App.jsx

function App(props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <div className={style.wrapper}>
            <Header isMenuOpen={isMenuOpen} onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
            {/* Other stuff */}
        </div>
    );
}
```

## Detecting page navigations

At this point the navigation menu already opens and closes when clicking on the
menu button inside the `Header` component. The next thing that I needed to do
was to make sure to close it when a menu item gets clicked. Otherwise, the
menu will continue covering the page even after navigating to the next page.

I am using React Router to route URLs to specific page components. To detect
page navigations, I first needed access to the `history` object being used by
React Router from the `App` component. This was achieved by wrapping `App`
inside the `withRouter` higher-order component, which passed history as one of
`App`'s props.

```js
// App.jsx

import { withRouter } from 'react-router-dom';
function App(props) {
    const history = props.history;
    // Other stuff
}
export default withRouter(App);
```

The `history` object has a `.listen()` method which accepts a callback function
that it will call every time the current location changes. Subscribing to these
changes is usually done in the component's `componentDidMount` lifecycle method
(and unsubscribing in `componentWillUnmount`), which requires a class component
and will make `App` look like this:

```js
class App extends React.Component {
    // constructor(props)
    // handleToggleMenu()
    componentDidMount() {
        this.unlisten = this.props.history.listen(() => {
            this.setState({
                isMenuOpen: false,
            });
        });
    }
    componentWillUnmount() {
        this.unlisten();
    }
    // render()
}
```

But again, I didn't want to convert my `App` component into a class component.
And also I just read that there is a built-in React Hook for doing exactly this
pattern, so I decided to use it instead.

### Using the useEffect hook

The pattern of registering something in a component's `componentDidMount` and
unregistering it in `componentWillUnmount` is apparently very common that it
got abstracted into its own React Hook, the
[`useEffect`](https://legacy.reactjs.org/docs/hooks-effect.html) hook.

```js
import { useEffect } from 'react';
```

The `useEffect` hook accepts a function containing code that will normally run
inside the `componentDidMount` (and `componentDidUpdate`) lifecycle method; in
my case, that would be code to listen to changes to the current history
location and closing the menu when it does.

```js
function App(props) {
    useEffect(() => {
        props.history.listen(() => {
            setIsMenuOpen(false);
        });
    });
    // Other stuff
}
```

We can also return a function containing code that will normally run inside the
`componentWillUnmount` lifecycle method; in my case, stop listening for changes
to the current history location. Calling `history.listen()` already returns
such function so I can just return it right away.

```js
function App(props) {
    useEffect(() => {
        return props.history.listen(() => {
            setIsMenuOpen(false);
        });
    });
    // Other stuff
}
```

And these are all the changes needed to make the `App` component close the
navigation menu on page navigations. No need to convert it to a class component
and setup lifecycle methods. All the related code are located in close
proximity to each other instead of being separated in different places in the
component code.

## Final App component

After applying all these changes, the `App` component, complete with the
stateful navigation menu which closes on page navigation, now looks like this:

```js
import { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import Header from './Header.jsx';
function App(props) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    useEffect(() =>
        props.history.listen(() => {
            setIsMenuOpen(false);
        }),
    );
    return (
        <div>
            <Header isMenuOpen={isMenuOpen} onToggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
            {/* Other stuff */}
        </div>
    );
}
export default withRouter(App);
```

I could have gone even further by making a generic React Hook for such
functionality, in case I need to use it again somewhere else. We can use these
built-in React Hooks to build more hooks. But I guess I'll just reserve that
for another day when I actually need to.

## Summary

In this article I walked through how I made my site's navigation menu using
React Hooks. We used the built-in `useState` hook to keep track of the menu's
open/close state, and the built-in `useEffect` hook to listen to changes in the
current location (and cleanup after when the component is going to be removed).
After applying the changes, we end up with a functional component that has its
own state.

This is the first time that I've used React Hooks on something and so far I
totally enjoyed the experience. I think the code is more readable and easier to
figure out compared to using class components with lots of lifecycle methods,
since I didn't need to look in multiple separate places to understand a
component's functionality. Instead, all the related functionality are defined
in one place. Also, we are able to build custom, more complex hooks out of the
built-in ones if we want to, and reuse these functionalities all over our
application. I'm really looking forward to using React Hooks more in the future.

## Resources

- [Introducing Hooks](https://legacy.reactjs.org/docs/hooks-intro.html)
- Toptal's [React Tutorial: Components, Hooks, and Performance](https://www.toptal.com/react/react-tutorial-pt2)
