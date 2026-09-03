# Yunhao Luo's Personal Website

A non-commercial, playable personal portfolio presented as an HD-2D, Souls-inspired JRPG hub world. Visitors can explore it using keyboard, mouse, or touch controls, while a WebMCP-capable agent can collaborate through the same page UI. Each landmark provides access to a distinct section of the site.

It is designed for recruiters, research collaborators, and technical reviewers who need to understand a multidisciplinary portfolio without first knowing which pages or projects are relevant to them. WebMCP lets an agent turn that intent into a visible route the visitor can inspect and follow.

## Site Areas

| Landmark | Area | Content |
| --- | --- | --- |
| Bonfire | **Fast Travel** | Navigation to all site areas |
| The Pit | **Projects** | Technical overview and recorded demonstrations of the real-time GPU fluid simulator developed at Ubisoft Montreal |
| The Mansion | **Research** | First-author publication: *Catching and Throwing Control of a Physically Simulated Hand* (MIG '21, Best Presentation Award) |
| The Smithy | **Mods** | Mizuki Mod, a complete custom character for *Slay the Spire* with 78 cards and custom mechanics |
| The Easel | **Zine** | A modern poetry zine presented page by page |
| The Monument | **About** | Biography, interests, photography, and the site's WebMCP tools |

## Technical Overview

- **Application architecture:** Vite and TypeScript without a frontend framework. The application keeps one scene animation loop active at a time and builds for Chrome 149+, the challenge's minimum supported Chrome version.
- **HD-2D rendering:** The hub world is rendered with Canvas 2D at an internal pixel-art resolution of approximately 270p, then scaled with nearest-neighbor interpolation. The rendering pipeline includes emissive bloom, tilt-shift depth blur, dynamic multiply-blend lighting, ember, ash, and fog particle systems, and color grading.
- **Procedural artwork:** Sprites, tiles, the moon, and the distant castle are generated at startup by deterministic procedural rendering functions in [src/engine/sprites.ts](src/engine/sprites.ts). Photographs, mod artwork, and the publication preview are distributed as display-resolution WebP assets; full-resolution source files are excluded from the application bundle.
- **Internationalization:** The interface supports English and Simplified Chinese through [src/i18n.ts](src/i18n.ts). The language selector updates interface text without reloading the page. Chinese text uses the reader's system serif font when available, with a 17 KB subset of Noto Serif SC as a glyph fallback. The subset is restricted by `unicode-range` and loaded only when required. After modifying Chinese interface strings, regenerate the subset with `npm run subset-cjk`.
- **WebMCP integration:** [src/webmcp.ts](src/webmcp.ts) registers tools on `document.modelContext` when a compatible model-context host is available. The surface follows the active page: global tools stay available; page tools register only where their actions and data make sense; and `AbortController` removes them on departure. The same `get-page-overview` and `focus-page-section` names are re-registered with page-specific descriptions, input enums, results, and visible effects. Definitions include human-readable titles, strict schemas, read-only and trust annotations, cancellation-aware execution, and descriptions/results kept within Chrome's recommended character budgets.
- **Collaborative portfolio tour:** `create-portfolio-tour` converts a recruiting, research, technical, creative, or complete-portfolio goal into a visible route panel. Agent and visitor see the same stops; selecting one uses the real router and focuses the relevant introduction or section in the shared page.
- **Shared page state:** WebMCP tools act on the mounted application rather than a detached content API. Agent and visitor navigation uses the same router and DOM, so the visible area, URL fragment, route-specific metadata, focused section, and registered tool surface remain synchronized.
- **Page and agent metadata:** [src/metadata.ts](src/metadata.ts) gives every mounted area its own browser title, description, Open Graph data, and link-preview data. The static homepage metadata and JSON-LD identify the site as a playable WebMCP portfolio, while [public/llms.txt](public/llms.txt) documents its areas and tools for agents. Because the application uses hash routes, the root URL remains the single canonical and sitemap entry. GitHub and LinkedIn are the only public profile links.

## WebMCP Tools by Page

| Scope | Tools |
| --- | --- |
| Every page | `list-site-pages`, `get-about-me`, `goto-site-page`, `set-language`, `create-portfolio-tour` |
| Home | `walk-hero-to-landmark`, `get-hero-status` |
| Every content page | `get-page-overview`, `focus-page-section` — redefined for the current page |
| Projects | `get-fluid-simulation` |
| Research | `get-publications`, `get-citation`, `copy-citation` |
| Mods | `get-mod-details`, `goto_workshop_page` |
| The Zine | `read-zine-piece` |
| About | `get-photography-captions` |

## WebMCP Challenge Additions — August 25–September 3, 2026

This site predates the OpenAI WebMCP Challenge. The latest pre-challenge baseline is commit [`5acdbc7`](https://github.com/HimeragiYukina/HimeragiYukina.github.io/commit/5acdbc7). Challenge-period work is documented separately in [CHALLENGE.md](CHALLENGE.md), with the Git range `5acdbc7..main` providing timestamped evidence of the new implementation.

| Before the challenge | Added during the challenge |
| --- | --- |
| Global tools plus Home and Research tools | A page-aware registry whose tools, schemas, data, and effects follow the mounted page |
| Agent results were mostly returned out of view | Visible collaboration through section focus/highlighting and a goal-specific portfolio-tour panel |
| Citation reading and clipboard writing shared one tool | Separate `get-citation` and `copy-citation` responsibilities with paste-ready BibTeX |
| Basic schemas and lifecycle cleanup | Titles, strict schemas, trust/read annotations, execution cancellation, route cancellation, and Chrome character budgets |
| Build optimized for Chrome 150 | Build and test coverage extended to the challenge minimum, Chrome 149 |
| Generic researcher metadata on every hash route | Playable WebMCP positioning plus route-specific title, description, Open Graph, and link-preview metadata |

### Suggested WebMCP tests

1. From any page, ask the agent to call `create-portfolio-tour` for a recruiter, research collaborator, technical reviewer, creative explorer, or complete tour. A visible route appears in the same page; select a stop to navigate and focus the relevant section.
2. Move between Projects, Research, Mods, The Zine, and About, and inspect the registered tools. `get-page-overview` and `focus-page-section` retain their names while their descriptions and schemas change; exclusive tools appear only where they can succeed.
3. On Research, compare `get-citation` with `copy-citation`: the former leaves the UI and clipboard unchanged, while the latter copies a complete BibTeX entry suitable for Overleaf.
4. Navigate with either the UI or `goto-site-page`, then inspect the browser title and description. The page, URL fragment, metadata, and page-scoped tools should all describe the same active area.

## Local Development

### Requirements

- Node.js and npm
- Google Chrome for Lighthouse performance audits

### Commands

```sh
npm install
npm run dev        # Start the development server at http://localhost:5173
npm run build      # Type-check the project and create a production build in dist/
npm run test:webmcp # Exercise tool scopes, effects, budgets, and route cleanup
npm run perf       # Build, serve, and audit every page with Lighthouse
```

Lighthouse reports generated by `npm run perf` are stored in `tmp/`.

## Controls

- Move with `W`, `A`, `S`, and `D`, or select a destination with the pointer.
- Press `E` to interact with a landmark.
- Press `Esc` to close menus and content pages.

`npm run test:webmcp` runs a repeatable end-to-end smoke test in headless Chrome. It verifies all six page-specific tool surfaces, route cleanup, visible tour and focus effects, read-only biography behavior, citation structure, and Chrome's recommended character budgets.

To test WebMCP interactively without a model-context host, append `?mockmcp` to the site URL. This installs a recording mock that can invoke tools from the browser console:

```js
window.__mcp.call('goto-site-page', { page: 'projects' });
```

## WebMCP Auditing

The `npm run perf` command cannot audit WebMCP tools because headless Chrome does not expose `document.modelContext`. Consequently, Lighthouse reports the `webmcp-*` audits as not applicable. To audit the WebMCP integration, open the site in a WebMCP-enabled version of Chrome and run Lighthouse from Chrome DevTools.

## License

This project uses separate licenses for source code and creative content:

- **Source code:** Licensed under the [MIT License](LICENSE).
- **Creative content:** Photographs, the poetry zine, and original environment and effects artwork are copyright © 2026 Yunhao Luo and licensed under [CC BY-NC-ND 4.0](https://creativecommons.org/licenses/by-nc-nd/4.0/). See [LICENSE-CONTENT](LICENSE-CONTENT) for details.

Third-party assets and character rights are excluded from both licenses. Mizuki is an *Arknights* character © Hypergryph. The Mizuki avatar artwork is by [QuAn_](https://www.pixiv.net/en/users/6657532), who has expressly allowed anyone to use that avatar artwork freely; this artwork permission does not transfer the underlying character rights. Mizuki Mod is a non-commercial, [open-source fan mod](https://github.com/HimeragiYukina/mizuki-mod-sts), and its character and game ownership notices appear both in that repository and on its [Steam Workshop listing](https://steamcommunity.com/sharedfiles/filedetails/?id=3764504027). Other third-party material includes the MIG '21 publication figure published by ACM and adapted ASCII artwork attributed in the zine's Works Cited section. Fluid-simulation videos are included with Ubisoft's permission. See [LICENSE-CONTENT](LICENSE-CONTENT) for complete licensing and attribution information.
