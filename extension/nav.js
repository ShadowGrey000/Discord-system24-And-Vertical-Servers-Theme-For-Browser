(() => {
  'use strict';
  const root = document.documentElement;
  let scheduled = false;
  let pendingHome = false;
  const bound = new WeakSet();
  const active = () => root.hasAttribute('data-d24') && root.hasAttribute('data-d24-horizontal');
  function sync() {
    scheduled = false;
    // Prefer native navigation so an active call does not need a page reload.
    if (pendingHome) {
      const friends = document.querySelector('.sidebarList__5e434 a[href="/channels/@me"]');
      if (friends) { pendingHome = false; friends.click(); }
    }
    const nav = document.querySelector('.guilds__5e434');
    if (!nav) return;
    const previous = nav.querySelector('[data-d24-home]');
    if (!active()) { previous?.remove(); return; }
    if (!previous) {
      // A real link guarantees Home navigation without relying on private React
      // internals or on Discord's remembered last DM. It also supports new tabs.
      const home = document.createElement('a');
      home.setAttribute('data-d24-home', '');
      home.setAttribute('href', '/channels/@me');
      home.setAttribute('aria-label', 'Discord Home — Friends');
      home.setAttribute('title', 'Discord Home — Friends');
      home.addEventListener('click', event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        const friends = document.querySelector('.sidebarList__5e434 a[href="/channels/@me"]');
        const nativeHome = nav.querySelector('[data-list-item-id="guildsnav___home"]');
        if (friends) { event.preventDefault(); friends.click(); }
        else if (nativeHome) {
          event.preventDefault(); pendingHome = true; nativeHome.click(); schedule();
          // Preserve the real link as a fallback if Discord changes its router.
          setTimeout(() => {
            if (!pendingHome) return;
            pendingHome = false;
            if (location.pathname !== '/channels/@me') location.assign('/channels/@me');
          }, 1500);
        }
      });
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515c-.211.375-.457.88-.626 1.28a18.4 18.4 0 0 0-5.42 0c-.17-.4-.42-.905-.633-1.28A19.74 19.74 0 0 0 3.865 4.37C.774 8.947-.065 13.41.354 17.81a19.9 19.9 0 0 0 5.993 3.03c.486-.66.916-1.36 1.287-2.097a12.8 12.8 0 0 1-2.026-.973c.17-.124.336-.254.496-.387 3.909 1.81 8.153 1.81 12.016 0 .163.133.33.263.497.387-.647.38-1.326.706-2.03.974.37.736.8 1.437 1.286 2.096a19.84 19.84 0 0 0 6.002-3.03c.492-5.1-.84-9.522-3.558-13.44ZM8.02 15.33c-1.174 0-2.136-1.077-2.136-2.398 0-1.32.942-2.398 2.136-2.398 1.195 0 2.157 1.087 2.136 2.398 0 1.32-.942 2.398-2.136 2.398Zm7.96 0c-1.174 0-2.136-1.077-2.136-2.398 0-1.32.942-2.398 2.136-2.398 1.195 0 2.157 1.087 2.136 2.398 0 1.32-.941 2.398-2.136 2.398Z');
      svg.append(path); home.append(svg); nav.prepend(home);
    }
    if (!bound.has(nav)) {
      bound.add(nav);
      nav.addEventListener('wheel', event => {
        if (!active() || event.ctrlKey) return;
        const scroller = nav.querySelector('.scroller_ef3116');
        if (!scroller || scroller.scrollHeight <= scroller.clientHeight) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        const scale = event.deltaMode === 1 ? 40 : event.deltaMode === 2 ? scroller.clientHeight : 1;
        scroller.scrollTop += delta * scale;
        event.preventDefault();
        event.stopPropagation();
      }, { passive: false });
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(sync);
  }
  // Observe structure only, not message text or account contents. Mount again
  // when Discord replaces the navigation during login, navigation, or reload.
  new MutationObserver(schedule).observe(root, { childList: true, subtree: true });
  new MutationObserver(schedule).observe(root, { attributes: true, attributeFilter: ['data-d24', 'data-d24-horizontal'] });
  sync();
})();
