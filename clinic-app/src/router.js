import { readable } from 'svelte/store';
function parse() {
    let h = location.hash || '#/groupsList';
    if (h.startsWith('#/'))
        h = h.slice(2);
    else if (h.startsWith('#'))
        h = h.slice(1);
    const [name, ...segments] = h.split('/').filter(Boolean);
    return { name: name || 'groupsList', segments };
}
export const route = readable(parse(), (set) => {
    const on = () => set(parse());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
});
export function goto(path) {
    location.hash = path.startsWith('/') ? `#${path}` : `#/${path}`;
}
//# sourceMappingURL=router.js.map