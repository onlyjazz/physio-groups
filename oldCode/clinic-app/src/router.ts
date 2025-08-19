import { readable } from 'svelte/store';

type RouteInfo = { name: string; segments: string[] };

function parse(): RouteInfo {
  // "#/groups" -> "groups"
  // "#/group-editor/123" -> name="group-editor", segments=["123"]
  const raw = (globalThis.location.hash || '#/groups').slice(2); // remove "#/"
  const [name, ...segments] = raw.split('/').filter(Boolean);
  return { name: name || 'groups', segments };
}

export const route = readable<RouteInfo>(parse(), (set) => {
  const onChange = () => set(parse());
  globalThis.addEventListener('hashchange', onChange);
  return () => globalThis.removeEventListener('hashchange', onChange);
});