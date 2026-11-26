(() => {
  'use strict';
  const root = document.documentElement;
  let settings = { ...D24.defaults };
  let revision = 0;
  const isApp = () => /^\/channels(?:\/|$)/.test(location.pathname);
  function apply() {
    root.toggleAttribute('data-d24', settings.enabled && isApp());
    root.toggleAttribute('data-d24-horizontal', settings.horizontal);
    root.toggleAttribute('data-d24-labels', settings.labels);
    root.toggleAttribute('data-d24-glow', settings.glow);
    root.setAttribute('data-d24-accent', settings.accent);
    for (const [key, spec] of Object.entries(D24.controls)) root.style.setProperty(spec.css, settings[key] + spec.unit);
  }
  apply();
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.discordSystem24) return;
    revision++;
    settings = D24.normalize(changes.discordSystem24.newValue);
    apply();
  });
  const initialRevision = revision;
  chrome.storage.local.get('discordSystem24').then(value => {
    if (revision !== initialRevision) return;
    settings = D24.normalize(value.discordSystem24);
    apply();
  }).catch(() => { /* Defaults remain usable if extension storage is unavailable. */ });
  // Isolated-world history cannot reliably intercept Discord's router. Check only
  // the URL, never messages or account data; this also covers login -> app routing.
  let lastPath = location.pathname;
  setInterval(() => {
    if (location.pathname === lastPath) return;
    lastPath = location.pathname;
    apply();
  }, 500);
})();
