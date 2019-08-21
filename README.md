history-block-async
====================

A wrapper for the [`history`](https://github.com/ReactTraining/history) library to allow for an unlimited amount of asynchronous listeners to prevent navigation.

### Installation

```
npm install --save history-block-async
```

### Usage
The module exports a wrapper function that accepts 2 arguments:
 - the [`history`](https://github.com/ReactTraining/history) instance
 - a name for the asynchronous blocking function (defaults to `block` but can be overriden).

```js
const history = patchBlockFn(createBrowserHistory(), 'block');
```

If you are using [`Prompt`](https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/Prompt.md) from React Router v4+, then you must leave the default naming. In this case the wrapper will replace the old `history.block` function with a new one. We will assume you are using the default naming in the rest of the documentation.

After the [`history`](https://github.com/ReactTraining/history) is patched the default `history.block` is replaced with a custom function that can be called as many times as you like. It accepts a string or a listener function and returns an unsubscribe function.

```js
// This is the same as in the default history library.
// Register a simple prompt message that will be shown the
// user before they navigate away from the current page.
const unblock = history.block('Are you sure you want to leave this page?');

// Or use a function that returns the message when it's needed.
history.block((location, action) => {
  // The location and action arguments indicate the location
  // we're transitioning to and how we're getting there.

  // A common use case is to prevent the user from leaving the
  // page if there's a form they haven't submitted yet.
  if (input.value !== '') return 'Are you sure you want to leave this page?';
});

// To stop blocking transitions, call the function returned from block().
unblock();

// This is added by the asynchronous wrapper. Note the 3rd argument
history.block((location, action, callback) => {
  // Simply return true to allow the transition to pass immediately. Actually, returning true or false
  // works with the history itself as well, but it only allows for one synchronous listener
  if (noNeedToBlock) return true;

  // You can simply prevent the transition from occuring
  if (justBlockThisRightNow) return false;

  // Allow the transition to pass or block it asynchronously
  // When the handler returns `undefined` the transitions will be blocked until the callback
  // is called with either `true` to allow navigation or `false` to block it.
  pinkyPromise.then(() => callback(true)).catch(() => callback(false))

  asynchronousAction(() => callback('Can also return a string to show the default browser prompt.'))
});
```

The transition will happen if no listeners are present or every listener allows the transition. The first blocking
listener with prevent the transition. If the listener was asynchronous we wait for the confirmation. If after that the
transition is confirmed, navigation will occur regardless of following listeners. The first blocking listener will always decide if the transition happens, asynchronous or otherwise.

#### Usage with React Router

```js
import { Router } from 'react-router-dom'
import { createBrowserHistory } from 'history'
import patchBlockFn from 'history-block-async';

const history = patchBlockFn(createBrowserHistory({ /* history configuration options */ }));

render((
  <Router history={history}>
    <App />
  </Router>
), document.getElementById('root'))
```
