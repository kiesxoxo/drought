import '~helpers/warmup';
import './styles/app.css';
import { mount } from 'svelte';
import App from '~components/App';
import { registerServiceWorker } from '~helpers/serviceWorker';

if (__ENV__ === 'production' && 'serviceWorker' in navigator) {
  registerServiceWorker().catch(console.error);
}

mount(App, {
  target: document.body,
});
