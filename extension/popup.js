(() => {
  'use strict';
  let settings;
  let saving = Promise.resolve();
  const ids = ['enabled', 'horizontal', 'labels', 'glow', 'accent', ...Object.keys(D24.controls)];
  const status = document.getElementById('status');
  function render() {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (input.type === 'checkbox') input.checked = settings[id];
      else input.value = settings[id];
    }
    for (const [key, spec] of Object.entries(D24.controls)) document.getElementById(key + 'Value').value = settings[key] + spec.unit;
  }
  function save() {
    const snapshot = { ...settings };
    saving = saving.catch(() => {}).then(() => chrome.storage.local.set({ discordSystem24: snapshot }));
    saving.then(() => { status.textContent = 'Saved · applied to Discord tabs'; }, () => { status.textContent = 'Could not save. Reopen settings to retry.'; });
  }
  chrome.storage.local.get('discordSystem24').then(value => {
    settings = D24.normalize(value.discordSystem24);
    render();
    for (const id of ids) document.getElementById(id).addEventListener('input', event => {
      settings[id] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
      settings = D24.normalize(settings);
      render(); save();
    });
    document.getElementById('reset').addEventListener('click', () => { settings = { ...D24.defaults }; render(); save(); });
  }).catch(() => { status.textContent = 'Could not read preferences. Reopen settings to retry.'; });
})();
