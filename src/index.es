let instance;
let listeners = [];
let isTransitioning = false;
let preventedAction = null;

const isServerEnv = () => (
  typeof process !== 'undefined' && process && process.versions && process.versions.node
);

const getReplay = (location, action) => {
  // attempting to replay `POP` with goBack simply returns to the same state as before.
  const key = action === 'POP' ? 'replace' : action.toLowerCase();
  return () => instance[key](location);
};

const handleResponse = (confirmed) => {
  const reference = preventedAction;
  preventedAction = null;

  if (!confirmed || typeof reference !== 'function') return;
  isTransitioning = true;
  reference();
  isTransitioning = false;
};

const handleNavigate = (location, action) => {
  // Let internal transitions pass
  if (isTransitioning) return true;

  preventedAction = getReplay(location, action);

  for (const callback of listeners) {
    const result = callback(location, action, handleResponse);

    // Proceed to the next listener, this one clears the action
    if (result === true) continue;

    // Listener waits for an asynchronous confirmation
    if (typeof result === 'undefined') return false;

    // Listener is synchronous, no need to keep the action in memory
    preventedAction = null;

    // This result needs to be passed to the original method as is (value is a string or false)
    return result;
  }

  // Every registered listener cleared this transition
  preventedAction = null;
  return true;
};

// ========================================================================================
// Public api
// ========================================================================================
const addListener = (arg) => {
  // Allow for default Router Prompt to function, simply pass a string through.
  const callback = typeof arg === 'string' ? (() => arg) : arg;
  if (typeof callback !== 'function') throw new Error('A string or a listener function is required');

  listeners.push(callback);
  return () => { listeners = listeners.filter((fn) => (fn !== callback)); };
};

const noop = () => console.error('history.block is unavailable, please use the replacer method');

const patchHistory = (history, methodName = 'block') => {
  if (isServerEnv()) throw new Error('This can only work in a browser environment.');

  instance = history;
  history.block(handleNavigate);
  if (methodName !== 'block') history.block = noop;
  history[methodName] = addListener;

  return history;
};

export default patchHistory;
