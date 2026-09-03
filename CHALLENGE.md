# OpenAI WebMCP Challenge — Change Record

This repository contains a personal website that existed before the OpenAI WebMCP Challenge. This document separates that earlier foundation from the WebMCP work completed during the challenge submission period.

## Pre-challenge baseline

The latest commit before the submission period is [`5acdbc7`](https://github.com/HimeragiYukina/HimeragiYukina.github.io/commit/5acdbc7), dated August 17, 2026. At that point the project already included:

- the explorable HD-2D home world and five content areas;
- global navigation, biography, and language WebMCP tools;
- Home tools that let an agent walk the hero and inspect its position; and
- Research tools that return publication data and a BibTeX citation.

Those features are project context, not claimed as challenge-period work.

## Built during the challenge

All commits after `5acdbc7` are timestamped challenge-period work. Inspect them with:

```sh
git log --reverse 5acdbc7..main
git diff --stat 5acdbc7..main
git diff 5acdbc7..main
```

The extension turns the earlier tool collection into a fuller page-aware interface:

- **Dynamic content-page tools.** `get-page-overview` and `focus-page-section` keep stable names, but are unregistered and re-registered on every content-page transition. Their descriptions, allowed section enum, returned information, and visible behavior match the page currently mounted.
- **Page-exclusive structured tools.** Projects exposes `get-fluid-simulation`; Mods exposes `get-mod-details`; The Zine exposes `read-zine-piece`; and About exposes `get-photography-captions`. The existing Research tools remain exclusive to Research, with citation reading and clipboard copying split into separate tools.
- **A Mods action.** `goto_workshop_page` exists only on Mods and navigates to the public Steam Workshop listing.
- **Human-agent collaboration.** `focus-page-section` scrolls and briefly highlights the requested section so the agent can guide a human through the visual site instead of only returning text off-screen.
- **A shared portfolio tour.** The global `create-portfolio-tour` tool turns a visitor goal into a visible route panel. Its human-operated stops use the site's real router and section focus behavior, so the visitor and agent remain in the same page state.
- **One shared application state.** Agent actions use the site's live router and DOM rather than a detached content API. Navigation keeps the visible page, URL fragment, page metadata, focused content, and registered tool surface synchronized for the visitor and agent.
- **Safer lifecycle handling.** Every content-page tool shares a route-owned `AbortController`, and late asynchronous registrations are ignored after their route signal is aborted. This prevents stale tools from leaking across rapid navigation.
- **Secure-tool hardening.** Each definition now has a human-readable title, a strict JSON schema, explicit read/trust annotations, and an execution cancellation signal. Parameter descriptions and individual results are kept within Chrome's recommended character budgets.
- **Discoverability.** Homepage metadata describes the portfolio as playable by keyboard, mouse, touch controls, or WebMCP. Each mounted area updates its browser, Open Graph, and link-preview metadata, while the About page, README, and `/llms.txt` explain the context-dependent tool surface. The public identity exposes only GitHub and LinkedIn profiles.
- **Rights documentation.** The repository separates MIT-licensed code, CC BY-NC-ND original content, and third-party material. It records that this is a non-commercial personal website, documents QuAn_'s permission for anyone to use the Mizuki avatar artwork, and separately attributes the underlying *Arknights* character to Hypergryph. The non-commercial, open-source Mizuki fan mod carries character and game ownership notices on its site page, Steam Workshop listing, and GitHub repository.

## Verification

The challenge extension is checked in two WebMCP-capable clients:

- ChatGPT's in-app browser; and
- Google Chrome 151 with WebMCP testing enabled.

Route tests verify both sides of the lifecycle: a page's exclusive tools appear after navigation and disappear after leaving. Browser checks also verify that route-specific metadata follows the active page. `npm run build` type-checks the complete registration layer before producing the deployable site.
