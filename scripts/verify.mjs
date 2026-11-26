import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'extension');
const read = name => fs.readFileSync(path.join(dir, name), 'utf8');
const manifest = JSON.parse(read('manifest.json'));
assert.deepEqual(manifest.permissions, ['storage']);
assert.deepEqual(manifest.content_scripts[0].matches, ['https://discord.com/*']);
assert(!manifest.background && !manifest.host_permissions);
for (const name of [...manifest.content_scripts[0].js, ...manifest.content_scripts[0].css, manifest.action.default_popup, 'popup.js', 'popup.css']) assert(fs.existsSync(path.join(dir,name)), name);
for (const name of ['settings.js','theme.js','nav.js','popup.js']) {
  new vm.Script(read(name));
  assert(!/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(read(name)), 'No extension network requests');
}
const attrs = new Map(), properties = new Map();
let onChanged, resolveInitial, checkRoute;
const location = { pathname: '/channels/@me' };
const context = vm.createContext({
  location,
  document: { documentElement: {
    toggleAttribute: (key,value) => value ? attrs.set(key,'') : attrs.delete(key),
    setAttribute: (key,value) => attrs.set(key,value),
    style: { setProperty: (key,value) => properties.set(key,value) }
  } },
  chrome: { storage: {
    onChanged: { addListener: fn => { onChanged = fn; } },
    local: { get: () => new Promise(resolve => { resolveInitial = resolve; }) }
  } },
  setInterval: fn => { checkRoute = fn; }
});
vm.runInContext(read('settings.js'),context);
const normalized = context.D24.normalize({fontSize:99,spacing:'invalid',borderWidth:-5,accent:'invalid'});
assert.equal(normalized.fontSize,18);
assert.equal(normalized.spacing,12);
assert.equal(normalized.borderWidth,1);
assert.equal(normalized.accent,'purple');
assert.equal(context.D24.normalize(null).enabled,true);
vm.runInContext(read('theme.js'),context);
assert(attrs.has('data-d24') && attrs.has('data-d24-horizontal'));
onChanged({discordSystem24:{newValue:{enabled:false,accent:'cyan',fontSize:16}}},'local');
assert(!attrs.has('data-d24'));
assert.equal(attrs.get('data-d24-accent'),'cyan');
assert.equal(properties.get('--d24-font-size'),'16px');
resolveInitial({discordSystem24:{enabled:true}});
await new Promise(resolve => setImmediate(resolve));
assert(!attrs.has('data-d24'), 'Delayed initial read must not overwrite a newer preference');
onChanged({discordSystem24:{newValue:{enabled:true,horizontal:false,labels:false}}},'local');
assert(attrs.has('data-d24') && !attrs.has('data-d24-horizontal') && !attrs.has('data-d24-labels'));
onChanged({discordSystem24:{newValue:{enabled:false}}},'sync');
assert(attrs.has('data-d24'), 'Other storage areas must be ignored');
for (const pathname of ['/login','/register','/','/developers/applications']) {
  location.pathname=pathname; checkRoute(); assert(!attrs.has('data-d24'), pathname);
}
location.pathname='/channels/123/456'; checkRoute(); assert(attrs.has('data-d24'));
onChanged({discordSystem24:{newValue:undefined}},'local');
assert(attrs.has('data-d24-horizontal') && attrs.has('data-d24-labels'));
for (const name of manifest.content_scripts[0].css) {
  const css = read(name);
  assert(!/@import\b|url\(\s*['"]?https?:/i.test(css), name+' must not load remote resources');
  assert(!/@property\s+--(?!d24-)/.test(css), 'Registered properties must be namespaced');
}
const popup = read('popup.html');
for (const id of ['enabled','horizontal','labels','glow','accent',...Object.keys(context.D24.controls)]) assert(popup.includes(`id="${id}"`), id);
// Navigation regression: Home is outside the native scroll tree, survives rail
// replacement, and leaves native scrolling alone when the theme is disabled.
class Element {
  constructor(tag) { this.tag = tag; this.attrs = new Map(); this.children = []; this.listeners = {}; }
  setAttribute(key,value) { this.attrs.set(key,value); }
  append(child) { child.parent = this; this.children.push(child); }
  prepend(child) { child.parent = this; this.children.unshift(child); }
  remove() { this.parent.children = this.parent.children.filter(child => child !== this); }
  querySelector(selector) { return selector === '[data-d24-home]' ? this.children.find(child => child.attrs.has('data-d24-home')) : selector === '.scroller_ef3116' ? this.scroller : null; }
  addEventListener(name,fn) { this.listeners[name] = fn; }
}
let nav = new Element('nav'); nav.scroller = { scrollHeight:2000,clientHeight:800,scrollTop:0 };
let friendsLink = null;
const rootAttrs = new Set(['data-d24','data-d24-horizontal']), callbacks = [], frames = [];
const navContext = vm.createContext({
  document: { documentElement:{hasAttribute:key=>rootAttrs.has(key)}, querySelector:selector=>selector === '.guilds__5e434' ? nav : friendsLink,
    createElement:tag=>new Element(tag),createElementNS:(_,tag)=>new Element(tag) },
  MutationObserver:class { constructor(callback) { callbacks.push(callback); } observe() {} },
  requestAnimationFrame:fn=>frames.push(fn)
});
vm.runInContext(read('nav.js'),navContext);
const getHome = () => nav.querySelector('[data-d24-home]');
assert.equal(getHome().attrs.get('href'),'/channels/@me');
assert.equal(getHome().attrs.get('aria-label'),'Discord Home — Friends');
assert.equal(nav.children[0],getHome(), 'Pinned Home must not be inside the scrolling list');
let nativeNavigations = 0, homePrevented = 0;
friendsLink = { click:()=>nativeNavigations++ };
getHome().listeners.click({button:0,preventDefault:()=>homePrevented++});
assert.equal(nativeNavigations,1,'Use the native Friends router when available');
getHome().listeners.click({button:0,ctrlKey:true,preventDefault:()=>homePrevented++});
assert.equal(homePrevented,1,'Modified clicks must retain normal new-tab behavior');
friendsLink = null;
const refreshNav = () => { callbacks.forEach(fn=>fn()); while(frames.length) frames.shift()(); };
refreshNav(); assert.equal(nav.children.length,1,'Repeated updates must not duplicate Home');
let prevented = 0;
const wheel = values => nav.listeners.wheel({deltaX:0,deltaY:100,deltaMode:0,ctrlKey:false,preventDefault:()=>prevented++,stopPropagation:()=>{},...values});
wheel({}); assert.equal(nav.scroller.scrollTop,100);
wheel({deltaX:150,deltaY:0}); assert.equal(nav.scroller.scrollTop,250);
wheel({deltaY:2,deltaMode:1}); assert.equal(nav.scroller.scrollTop,330);
wheel({ctrlKey:true}); assert.equal(nav.scroller.scrollTop,330); assert.equal(prevented,3);
rootAttrs.delete('data-d24'); refreshNav(); assert(!getHome());
wheel({}); assert.equal(nav.scroller.scrollTop,330,'Disabled theme must preserve normal wheel handling');
rootAttrs.add('data-d24'); nav=new Element('nav'); nav.scroller={scrollHeight:50,clientHeight:80,scrollTop:0}; refreshNav();
assert(getHome(),'A replaced Discord rail must receive Home');
wheel({}); assert.equal(prevented,3,'Do not consume scrolling when all servers fit');
rootAttrs.delete('data-d24-horizontal'); refreshNav(); assert(!getHome(),'Vertical mode must use native Home');
console.log('PASS: resources, permissions, scripts, preferences, live updates, disable, startup race, route exclusions, offline assets, pinned Home lifecycle, and mouse/trackpad scrolling.');
