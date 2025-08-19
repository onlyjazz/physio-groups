import { mount } from 'svelte'
import App from './App.svelte'
if (!location.hash) location.hash = '#/groups';
const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
