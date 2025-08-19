import { readable } from 'svelte/store'

export type Route = { name: string; segments: string[] }

function parse(): Route {
  let h = location.hash || '#/therapists'
  if (h.startsWith('#/')) h = h.slice(2)
  else if (h.startsWith('#')) h = h.slice(1)
  const [name, ...segments] = h.split('/').filter(Boolean)
  return { name: name || 'therapists', segments }
}

export const route = readable<Route>(parse(), (set) => {
  const on = () => set(parse())
  addEventListener('hashchange', on)
  return () => removeEventListener('hashchange', on)
})

export function goto(path: string) {
  location.hash = path.startsWith('/') ? `#${path}` : `#/${path}`
}

