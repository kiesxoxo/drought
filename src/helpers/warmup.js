import Transmission from '~helpers/Transmission';

// The app's modules wait for config.json (a top-level await in configHelper)
// before any of them runs. The RPC session handshake doesn't depend on it, so
// start it now; the first real call then finds the token ready.
// main.js imports this before the app, so it runs before that wait.
new Transmission().fetchToken().catch(() => {
  // The first real call retries the handshake and reports any error
});
