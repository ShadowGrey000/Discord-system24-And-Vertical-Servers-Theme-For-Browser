(() => {
  'use strict';
  const controls = {
    fontSize: { min: 12, max: 18, value: 14, unit: 'px', css: '--d24-font-size' },
    spacing: { min: 8, max: 24, value: 12, unit: 'px', css: '--d24-spacing' },
    borderWidth: { min: 1, max: 3, value: 2, unit: 'px', css: '--d24-border-width' }
  };
  const defaults = { enabled: true, horizontal: true, labels: true, glow: false, accent: 'purple',
    ...Object.fromEntries(Object.entries(controls).map(([key, spec]) => [key, spec.value])) };
  function normalize(value) {
    const values = value && typeof value === 'object' ? value : {};
    const result = { enabled: values.enabled !== false, horizontal: values.horizontal !== false,
      labels: values.labels !== false, glow: values.glow === true,
      accent: ['purple', 'green', 'cyan', 'red'].includes(values.accent) ? values.accent : 'purple' };
    for (const [key, spec] of Object.entries(controls)) {
      const number = Number(values[key] ?? spec.value);
      result[key] = Number.isFinite(number) ? Math.max(spec.min, Math.min(spec.max, Math.round(number))) : spec.value;
    }
    return result;
  }
  globalThis.D24 = { defaults, controls, normalize };
})();
