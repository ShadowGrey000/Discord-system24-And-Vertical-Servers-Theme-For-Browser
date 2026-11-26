# Third-party styles

This browser extension adapts the following MIT-licensed projects, downloaded on 2026-10-31:

- [system24](https://github.com/refact0r/system24), refact0r, theme version 2.1.0. Source: `https://refact0r.github.io/system24/build/system24.css`. License: `licenses/system24.txt`.
- [midnight](https://github.com/refact0r/midnight-discord), refact0r. Source: `https://refact0r.github.io/midnight-discord/build/midnight.css`. License: `licenses/midnight.txt`.
- [HorizontalServerList](https://github.com/DiscordStyles/HorizontalServerList), DiscordStyles / Gibbu, theme version 3.0.0, consulted during layout development. Its license is retained in `licenses/horizontal-server-list.txt`; this extension uses a separate horizontal adapter for the current native web grid.

Changes: bundled local CSS, removed all remote imports and font/image downloads, gated selectors behind an opt-in root attribute, namespaced registered properties and animation names, and added saved browser appearance controls. Uses locally installed monospace fonts. No Vencord or BetterDiscord is required.

Independent extension, unaffiliated with Discord or the original theme authors.
