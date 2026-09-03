/**
 * WebMCP integration — https://github.com/webmachinelearning/webmcp
 *
 * Registers well-scoped tools on `document.modelContext` (with the deprecated
 * `navigator.modelContext` as fallback) so agents can operate the key elements
 * of this site: travel between areas, walk the hero, rest at the bonfire, and
 * read the publications.
 *
 * Following the WebMCP tool-authoring core contract:
 *  - each tool does exactly one thing, named with precise verbs
 *  - enums and ranges are declared in the schema; code still validates strictly
 *  - read-only tools carry `annotations.readOnlyHint`
 *  - tools register only in page states where they can succeed, and
 *    unregister (AbortController) when the state changes:
 *      · global: list-site-pages, get-about-me, goto-site-page, set-language
 *      · home only: walk-hero-to-landmark, get-hero-status
 *      · every article page: get-page-overview, focus-page-section (the same
 *        names are re-registered with page-specific descriptions and schemas)
 *      · projects only: get-fluid-simulation
 *      · research only: get-publications, get-citation
 *      · mods only: get-mod-details, goto_workshop_page
 *      · zine only: read-zine-piece
 *      · about only: get-photography-captions
 */
import type { Router } from './router';
import type { HomeLevel } from './levels/home';
import { PUBLICATIONS, BIBTEX } from './levels/papers';
import { STEAM_URL } from './levels/mod';
import { POIS } from './engine/world';
import { ABOUT_ME_TEXT, revealAboutMe } from './content/aboutMe';
import { LANGS, getLang, setLang, type Lang } from './i18n';

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (params: any) => Promise<string | null> | string | null;
  annotations?: { readOnlyHint?: boolean };
}
interface ModelContext {
  registerTool(tool: ToolDefinition, options?: { signal?: AbortSignal }): void | Promise<void>;
}

function getModelContext(): ModelContext | null {
  // prefer the modern surface; return before ever touching the deprecated one
  const d = document as unknown as { modelContext?: ModelContext };
  if (d.modelContext) return d.modelContext;
  // navigator.modelContext is a deprecated alias whose GETTER logs a console
  // deprecation on any read (Lighthouse flags it) — so probe with `in` first
  // and only read it when it is genuinely the sole surface available
  if ('modelContext' in navigator) {
    const n = navigator as unknown as { modelContext?: ModelContext };
    return n.modelContext ?? null;
  }
  return null;
}

// area and landmark vocabularies derive from the home POIs — the same data the
// page renders (labels, subtitles, travel menu) — so the tool surface can
// never drift from what the user sees
const AREAS = ['home', ...POIS.filter((p) => p.action !== 'menu').map((p) => p.action)];
const LANDMARKS = POIS.map((p) => p.id);

type ArticleArea = 'projects' | 'research' | 'mods' | 'zine' | 'about';
interface PageSection {
  id: string;
  heading: string;
  description: string;
}
interface PageContext {
  label: string;
  sections: readonly PageSection[];
}

const PAGE_CONTEXTS: Record<ArticleArea, PageContext> = {
  projects: {
    label: 'Projects / Fluid Simulation',
    sections: [
      { id: 'overview', heading: 'Fluid Simulation', description: 'project summary' },
      { id: 'test-scenes', heading: 'TEST SCENES', description: 'six recorded simulation scenarios' },
      { id: 'system-capabilities', heading: 'SYSTEM CAPABILITIES', description: 'solver, rendering, boundaries, and platform support' },
      { id: 'experiment-setup', heading: 'EXPERIMENT SETUP', description: 'hardware used for the captured tests' },
      { id: 'references', heading: 'REFERENCES', description: 'technical references' },
    ],
  },
  research: {
    label: 'Research',
    sections: [
      { id: 'overview', heading: 'Research', description: 'publication overview and links' },
      { id: 'cite', heading: 'CITE', description: 'BibTeX citation' },
      { id: 'collaboration', heading: 'COLLABORATION', description: 'collaboration statement' },
    ],
  },
  mods: {
    label: 'Mods / Mizuki Mod',
    sections: [
      { id: 'overview', heading: 'Mizuki Mod', description: 'mod overview, gallery, and links' },
      { id: 'workshop', heading: 'NOW ON STEAM WORKSHOP', description: 'installation and source links' },
      { id: 'mechanic', heading: 'THE MECHANIC — NERVOUS IMPAIRMENT', description: 'the core risk-reward mechanic' },
      { id: 'featured-cards', heading: 'FEATURED CARDS', description: 'six representative cards' },
      { id: 'card-pool', heading: 'THE CARD POOL', description: 'card-pool composition' },
      { id: 'relics', heading: 'NOTABLE RELICS', description: 'three representative relics' },
      { id: 'copyright', heading: 'COPYRIGHT', description: 'fan-work rights and attribution' },
    ],
  },
  zine: {
    label: 'The Zine / experimental Poetry',
    sections: [
      { id: 'overview', heading: 'experimental Poetry', description: 'zine cover and introduction' },
      { id: 'intro', heading: 'Intro', description: 'welcome to the zine' },
      { id: 'sweet-dreamer', heading: 'Sweet Dreamer', description: 'poem' },
      { id: 'compress-the-world', heading: 'Compress the World!', description: 'poem' },
      { id: 'stars', heading: 'Stars', description: 'poem' },
      { id: 'behavior-tree', heading: 'Behavior Tree During the COVID-19 Pandemic', description: 'interactive-structure poem' },
      { id: 'postscript', heading: 'Postscript', description: 'author reflection' },
      { id: 'works-cited', heading: 'Works Cited', description: 'sources and attributions' },
    ],
  },
  about: {
    label: 'About',
    sections: [
      { id: 'overview', heading: 'About', description: 'page introduction' },
      { id: 'about-me', heading: 'ABOUT ME', description: 'professional biography' },
      { id: 'interests', heading: 'INTERESTS', description: 'interests and photography' },
      { id: 'webmcp-interface', heading: 'WEBMCP INTERFACE', description: 'the site’s agent-facing tools' },
    ],
  },
};

const PAGE_SCOPED_NAMES = new Set([
  'get-page-overview',
  'focus-page-section',
  'get-fluid-simulation',
  'get-publications',
  'get-citation',
  'get-mod-details',
  'goto_workshop_page',
  'read-zine-piece',
  'get-photography-captions',
]);

let ctxRef: { router: Router; home: HomeLevel } | null = null;
let mc: ModelContext | null = null;
let homeAbort: AbortController | null = null;
let articleAbort: AbortController | null = null;
let articleArea: ArticleArea | null = null;
let registeredNames: string[] = [];

/** Static tool metadata for the About page (kept in sync with registration below). */
export function describeTools(): { name: string; summary: string; readOnly: boolean }[] {
  return [
    { name: 'list-site-pages', summary: 'lists every page of the site and how to reach it', readOnly: true },
    { name: 'get-about-me', summary: "returns the author's bio (the About page's “About Me”)", readOnly: true },
    { name: 'goto-site-page', summary: `jumps to a page (${AREAS.join(', ')}) — like resting at the bonfire`, readOnly: false },
    { name: 'set-language', summary: `switches the UI language (${LANGS.map((l) => l.id).join(', ')})`, readOnly: false },
    { name: 'walk-hero-to-landmark', summary: 'walks the pixel hero to a landmark, optionally interacting (only while exploring the home world)', readOnly: false },
    { name: 'get-hero-status', summary: 'reports where the hero stands and what is nearby (only while exploring the home world)', readOnly: true },
    { name: 'get-page-overview', summary: 'returns the current content page as structured JSON; its result changes with the page', readOnly: true },
    { name: 'focus-page-section', summary: 'scrolls to and highlights a section; its allowed sections change with the page', readOnly: false },
    { name: 'get-fluid-simulation', summary: 'returns the project’s test scenes and technical capabilities (only on Projects)', readOnly: true },
    { name: 'get-publications', summary: 'returns first-author publications as structured JSON (only on the research page)', readOnly: true },
    { name: 'get-citation', summary: 'returns the BibTeX citation and attempts to copy it to the clipboard (only on the research page)', readOnly: false },
    { name: 'get-mod-details', summary: 'returns mod statistics, mechanics, and featured cards (only on Mods)', readOnly: true },
    { name: 'goto_workshop_page', summary: 'opens the Mizuki Mod Steam Workshop listing (only on the Mods page)', readOnly: false },
    { name: 'read-zine-piece', summary: 'returns one poem or section by id (only in The Zine)', readOnly: true },
    { name: 'get-photography-captions', summary: 'lists the photographs on the About page (only on About)', readOnly: true },
  ];
}

function updateChip(): void {
  const chip = document.getElementById('mcp-chip');
  if (!chip) return;
  if (mc) {
    chip.classList.add('live');
    chip.textContent = `✦ WebMCP · ${registeredNames.length} tools`;
    chip.title = `Model-context host detected. Registered tools:\n${registeredNames.join('\n')}`;
  } else {
    chip.classList.remove('live');
    chip.textContent = '✦ WebMCP · N/A';
    chip.title =
      'No model-context host detected (document.modelContext is absent).\n' +
      'In a WebMCP-capable browser or agent, this site exposes tools to travel, walk the hero, and read the research.\n' +
      `Would-be tools:\n${describeTools().map((t) => t.name).join('\n')}`;
  }
}

async function register(tool: ToolDefinition, signal?: AbortSignal): Promise<void> {
  if (!mc) return;
  try {
    await mc.registerTool(tool, signal ? { signal } : undefined);
    // A route can change while an asynchronous host is still registering the
    // previous page's tools. Never let a late completion revive a stale name.
    if (signal?.aborted) return;
    if (!registeredNames.includes(tool.name)) registeredNames.push(tool.name);
    updateChip();
  } catch (e) {
    console.warn(`WebMCP: failed to register ${tool.name}`, e);
  }
}

export function initWebMCP(router: Router, home: HomeLevel): void {
  ctxRef = { router, home };
  mc = getModelContext();
  updateChip();
  if (!mc) return;

  void register({
    name: 'list-site-pages',
    description:
      'List every page of this personal website (a Souls-inspired home world) with what it contains and the landmark that leads to it. Use this first to orient yourself.',
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: () =>
      JSON.stringify({
        currentPage: router.current?.id ?? 'home',
        // extracted from the POIs at call time — the exact names and
        // subtitles the page shows on its floating labels and travel menu
        pages: [
          { id: 'home', name: 'Crepusculum Dream', content: 'the explorable HD-2D home world; all landmarks live here' },
          ...POIS.filter((p) => p.action !== 'menu').map((p) => ({ id: p.action, name: p.label, content: p.sub, landmark: p.id })),
        ],
      }),
  });

  // universal: the author's bio is readable from any page; if the visitor
  // isn't on the About page, the result nudges them to travel there
  void register({
    name: 'get-about-me',
    description:
      "Return the author's short biography — the “About Me” section of the About page. Available from anywhere on the site. Read-only.",
    inputSchema: { type: 'object', properties: {} },
    annotations: { readOnlyHint: true },
    execute: () => {
      const onAbout = (router.current?.id ?? 'home') === 'about';
      if (onAbout) {
        // already here — center the “About Me” section and flash a highlight
        revealAboutMe();
        return `${ABOUT_ME_TEXT}\n\n(Scrolled to the “About Me” section on this page.)`;
      }
      return `${ABOUT_ME_TEXT}\n\n(You are not on the About page. To see this in context — alongside interests and the WebMCP tools — go there with goto-site-page({ page: "about" }).)`;
    },
  });

  void register({
    name: 'goto-site-page',
    description:
      'Immediately jump to a page of the site, as if resting at the bonfire and warping. For the scenic route through the home world, use walk-hero-to-landmark instead.',
    inputSchema: {
      type: 'object',
      properties: {
        page: { type: 'string', enum: [...AREAS], description: 'Destination page id' },
      },
      required: ['page'],
    },
    execute: async (p: { page?: string }) => {
      const page = String(p?.page ?? '');
      if (!(AREAS as readonly string[]).includes(page)) {
        return `Unknown page "${page}". Valid pages: ${AREAS.join(', ')}.`;
      }
      if (router.current?.id === page) return `Already on page "${page}".`;
      const ok = await router.go(page);
      return ok ? `Navigated to "${page}".` : `Could not go to "${page}" right now (a transition may already be in progress). Try again in a moment.`;
    },
  });

  // universal: switch the UI language; available languages are the enum below
  void register({
    name: 'set-language',
    description:
      `Switch the interface language. Available languages: ${LANGS.map((l) => `${l.id} (${l.label})`).join(', ')}. The whole UI retranslates in place.`,
    inputSchema: {
      type: 'object',
      properties: {
        language: { type: 'string', enum: LANGS.map((l) => l.id), description: 'Target language code' },
      },
      required: ['language'],
    },
    execute: (p: { language?: string }) => {
      const lang = String(p?.language ?? '');
      if (!LANGS.some((l) => l.id === lang)) {
        return `Unknown language "${lang}". Available: ${LANGS.map((l) => l.id).join(', ')}.`;
      }
      if (getLang() === lang) return `The interface is already in "${lang}".`;
      setLang(lang as Lang);
      return `Interface language switched to "${lang}".`;
    },
  });

  // context-scoped tools follow the active area: registered when their page
  // state can satisfy them, aborted the moment it changes
  router.onChange((area) => syncContextTools(area));

  updateChip();
}

function isArticleArea(area: string): area is ArticleArea {
  return area in PAGE_CONTEXTS;
}

function cleanText(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function articleRoot(area: ArticleArea): HTMLElement | null {
  return document.querySelector<HTMLElement>(`.article.${area} .article-body`);
}

function articleHeading(area: ArticleArea, heading: string): HTMLElement | null {
  const root = articleRoot(area);
  if (!root) return null;
  return [...root.querySelectorAll<HTMLElement>('h1, h2')]
    .find((el) => cleanText(el.textContent).toLocaleLowerCase() === heading.toLocaleLowerCase()) ?? null;
}

function sectionText(area: ArticleArea, heading: string): string {
  const target = articleHeading(area, heading);
  if (!target) return '';
  return cleanText((target.closest('section, .zine-paper') ?? target.parentElement)?.textContent);
}

function pageOverview(area: ArticleArea): string {
  const root = articleRoot(area);
  const config = PAGE_CONTEXTS[area];
  if (!root) return `The ${config.label} page is not mounted.`;

  const summary = cleanText(root.querySelector('.abstract')?.textContent);
  const seenLinks = new Set<string>();
  const links = [...root.querySelectorAll<HTMLAnchorElement>('a[href]')]
    .filter((link) => !link.closest('.site-footer'))
    .map((link) => ({ label: cleanText(link.textContent), url: link.href }))
    .filter((link) => link.label && !seenLinks.has(link.url) && seenLinks.add(link.url));
  const sections = config.sections.map((section) => {
    const text = section.id === 'overview' ? summary : sectionText(area, section.heading);
    return {
      id: section.id,
      heading: section.heading,
      description: section.description,
      preview: text.length > 360 ? `${text.slice(0, 357)}...` : text,
    };
  });

  return JSON.stringify({
    page: area,
    label: config.label,
    title: cleanText(root.querySelector('h1')?.textContent),
    summary,
    sections,
    links,
  }, null, 2);
}

function focusPageSection(area: ArticleArea, sectionId: string): string {
  const config = PAGE_CONTEXTS[area];
  const section = config.sections.find((candidate) => candidate.id === sectionId);
  if (!section) {
    return `Unknown section "${sectionId}" on ${config.label}. Valid sections: ${config.sections.map((candidate) => candidate.id).join(', ')}.`;
  }
  const heading = articleHeading(area, section.heading);
  if (!heading) return `The "${section.heading}" section is not available right now.`;

  const target = (heading.closest('section, .zine-paper') ?? heading) as HTMLElement;
  document.querySelectorAll('.webmcp-focus').forEach((el) => el.classList.remove('webmcp-focus'));
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  target.classList.add('webmcp-focus');
  window.setTimeout(() => target.classList.remove('webmcp-focus'), 1800);
  return `Focused "${section.heading}" on ${config.label}.`;
}

function registerArticleTools(area: ArticleArea, signal: AbortSignal): void {
  const config = PAGE_CONTEXTS[area];
  const sectionIds = config.sections.map((section) => section.id);
  const sectionDescription = config.sections.map((section) => `${section.id}: ${section.description}`).join('; ');

  // These two names intentionally stay stable while their page-specific
  // descriptions, enums, returned content, and visible effects are replaced.
  void register(
    {
      name: 'get-page-overview',
      description: `Return a structured overview of the currently mounted ${config.label} page, including its sections and links. Read-only.`,
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: true },
      execute: () => pageOverview(area),
    },
    signal,
  );
  void register(
    {
      name: 'focus-page-section',
      description: `Scroll to and briefly highlight a section of the currently mounted ${config.label} page.`,
      inputSchema: {
        type: 'object',
        properties: {
          section: { type: 'string', enum: sectionIds, description: sectionDescription },
        },
        required: ['section'],
        additionalProperties: false,
      },
      execute: (p: { section?: string }) => focusPageSection(area, String(p?.section ?? '')),
    },
    signal,
  );

  if (area === 'projects') {
    void register(
      {
        name: 'get-fluid-simulation',
        description: 'Return structured details for the real-time GPU fluid-simulation project shown on this page: recorded test scenes, capabilities, and test hardware. Read-only.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: () => {
          const root = articleRoot('projects');
          if (!root) return 'The Projects page is not mounted.';
          const scenes = [...root.querySelectorAll<HTMLElement>('.video-card')].map((card) => ({
            title: cleanText(card.querySelector('b')?.textContent),
            description: cleanText(card.querySelector('figcaption span:not(.credit)')?.textContent),
          }));
          return JSON.stringify({
            project: 'Real-time GPU fluid simulation',
            summary: cleanText(root.querySelector('.abstract')?.textContent),
            scenes,
            capabilities: sectionText('projects', 'SYSTEM CAPABILITIES'),
            testHardware: sectionText('projects', 'EXPERIMENT SETUP'),
          }, null, 2);
        },
      },
      signal,
    );
  }

  if (area === 'research') {
    void register(
      {
        name: 'get-publications',
        description: 'Return the publications shown on this page as structured JSON (title, authors, venue, year, DOI, links, award).',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: () => JSON.stringify(PUBLICATIONS),
      },
      signal,
    );
    void register(
      {
        name: 'get-citation',
        description: "Return the publication's BibTeX citation and attempt to copy it to the clipboard (mirrors the Copy button on the research page).",
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: async () => {
          let copied = false;
          try {
            await navigator.clipboard.writeText(BIBTEX);
            copied = true;
          } catch { /* clipboard may be blocked without a user gesture */ }
          return `${copied ? 'Copied the BibTeX citation to the clipboard.' : 'Could not access the clipboard here; the BibTeX citation is below.'}\n\n${BIBTEX}`;
        },
      },
      signal,
    );
  }

  if (area === 'mods') {
    void register(
      {
        name: 'get-mod-details',
        description: 'Return structured details for Mizuki Mod: headline statistics, its core mechanic, and the featured cards shown on this page. Read-only.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: () => {
          const root = articleRoot('mods');
          if (!root) return 'The Mods page is not mounted.';
          const stats = [...root.querySelectorAll<HTMLElement>('.stat')].map((stat) => ({
            value: cleanText(stat.querySelector('b')?.textContent),
            label: cleanText(stat.querySelector('span')?.textContent),
          }));
          const featuredCards = [...root.querySelectorAll<HTMLElement>('.sts-card')].map((card) => ({
            name: cleanText(card.querySelector('.c-name')?.textContent),
            cost: cleanText(card.querySelector('.cost')?.textContent),
            type: cleanText(card.querySelector('.c-type')?.textContent),
            description: cleanText(card.querySelector('.c-text')?.textContent),
          }));
          return JSON.stringify({
            mod: 'Mizuki Mod for Slay the Spire',
            summary: cleanText(root.querySelector('.abstract')?.textContent),
            stats,
            coreMechanic: sectionText('mods', 'THE MECHANIC — NERVOUS IMPAIRMENT'),
            featuredCards,
            workshopUrl: STEAM_URL,
          }, null, 2);
        },
      },
      signal,
    );
    void register(
      {
        name: 'goto_workshop_page',
        description: 'Navigate from the Mods page to the public Steam Workshop listing for Mizuki Mod.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        execute: () => {
          window.location.assign(STEAM_URL);
          return 'Navigating to the Mizuki Mod page on Steam Workshop.';
        },
      },
      signal,
    );
  }

  if (area === 'zine') {
    const pieces = config.sections.filter((section) => section.id !== 'overview');
    void register(
      {
        name: 'read-zine-piece',
        description: 'Return the plain-text content of one poem or editorial section from experimental Poetry. Read-only.',
        inputSchema: {
          type: 'object',
          properties: {
            piece: {
              type: 'string',
              enum: pieces.map((piece) => piece.id),
              description: pieces.map((piece) => `${piece.id}: ${piece.heading}`).join('; '),
            },
          },
          required: ['piece'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true },
        execute: (p: { piece?: string }) => {
          const pieceId = String(p?.piece ?? '');
          const piece = pieces.find((candidate) => candidate.id === pieceId);
          if (!piece) return `Unknown piece "${pieceId}". Valid pieces: ${pieces.map((candidate) => candidate.id).join(', ')}.`;
          const heading = articleHeading('zine', piece.heading);
          const paper = heading?.closest<HTMLElement>('.zine-paper');
          return paper ? paper.innerText.trim() : `The "${piece.heading}" piece is not available right now.`;
        },
      },
      signal,
    );
  }

  if (area === 'about') {
    void register(
      {
        name: 'get-photography-captions',
        description: "List the titles of Yunhao Luo's photographs displayed on the About page. Read-only.",
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: () => {
          const root = articleRoot('about');
          if (!root) return 'The About page is not mounted.';
          return JSON.stringify([...root.querySelectorAll<HTMLImageElement>('.photo-card img')]
            .map((photo) => photo.alt)
            .filter(Boolean));
        },
      },
      signal,
    );
  }
}

/** Register/unregister area-scoped tools to match the current area. */
function syncContextTools(area: string): void {
  if (!mc || !ctxRef) return;
  const { home } = ctxRef;

  if (area === 'home' && !homeAbort) {
    homeAbort = new AbortController();
    void register(
      {
        name: 'walk-hero-to-landmark',
        description:
          'Walk the pixel hero across the home world to a named landmark. Set interact=true to also use the landmark on arrival (the bonfire opens the travel menu; other landmarks travel to their area).',
        inputSchema: {
          type: 'object',
          properties: {
            landmark: {
              type: 'string',
              enum: [...LANDMARKS],
              description: POIS.map((p) => `${p.id}: ${p.sub}`).join('; '),
            },
            interact: { type: 'boolean', description: 'Interact with the landmark after arriving (default false)' },
          },
          required: ['landmark'],
        },
        execute: (p: { landmark?: string; interact?: boolean }) => {
          const lm = String(p?.landmark ?? '');
          if (!(LANDMARKS as readonly string[]).includes(lm)) {
            return `Unknown landmark "${lm}". Valid landmarks: ${LANDMARKS.join(', ')}.`;
          }
          return home.mcpWalkTo(lm, !!p?.interact);
        },
      },
      homeAbort.signal,
    );
    void register(
      {
        name: 'get-hero-status',
        description: 'Report the hero’s current area, tile position, and the nearest landmark.',
        inputSchema: { type: 'object', properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => home.mcpStatus(),
      },
      homeAbort.signal,
    );
  } else if (area !== 'home' && homeAbort) {
    homeAbort.abort();
    homeAbort = null;
    registeredNames = registeredNames.filter((n) => n !== 'walk-hero-to-landmark' && n !== 'get-hero-status');
  }

  const nextArticleArea = isArticleArea(area) ? area : null;
  if (articleAbort && articleArea !== nextArticleArea) {
    articleAbort.abort();
    articleAbort = null;
    articleArea = null;
    registeredNames = registeredNames.filter((name) => !PAGE_SCOPED_NAMES.has(name));
  }
  if (nextArticleArea && !articleAbort) {
    articleArea = nextArticleArea;
    articleAbort = new AbortController();
    registerArticleTools(nextArticleArea, articleAbort.signal);
  }

  updateChip();
}
