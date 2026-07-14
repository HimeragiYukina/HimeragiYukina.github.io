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
 *      · research only: get-publications, get-citation
 */
import type { Router } from './router';
import type { HomeLevel } from './levels/home';
import { PUBLICATIONS, BIBTEX } from './levels/papers';
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

let ctxRef: { router: Router; home: HomeLevel } | null = null;
let mc: ModelContext | null = null;
let homeAbort: AbortController | null = null;
let researchAbort: AbortController | null = null;
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
    { name: 'get-publications', summary: 'returns first-author publications as structured JSON (only on the research page)', readOnly: true },
    { name: 'get-citation', summary: 'returns the BibTeX citation for the publication, also copying it to the clipboard (only on the research page)', readOnly: false },
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
    registeredNames.push(tool.name);
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
      'List every page of this personal website (a souls-like home world) with what it contains and the landmark that leads to it. Use this first to orient yourself.',
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

  if (area === 'research' && !researchAbort) {
    researchAbort = new AbortController();
    void register(
      {
        name: 'get-publications',
        description: 'Return the publications shown on this page as structured JSON (title, authors, venue, year, DOI, links, award).',
        inputSchema: { type: 'object', properties: {} },
        annotations: { readOnlyHint: true },
        execute: () => JSON.stringify(PUBLICATIONS),
      },
      researchAbort.signal,
    );
    void register(
      {
        name: 'get-citation',
        description:
          "Return the publication's BibTeX citation, also copying it to the clipboard (mirrors the Copy button on the research page).",
        inputSchema: { type: 'object', properties: {} },
        execute: async () => {
          let copied = false;
          try {
            await navigator.clipboard.writeText(BIBTEX);
            copied = true;
          } catch { /* clipboard may be blocked without a user gesture */ }
          return `${copied ? 'Copied the BibTeX citation to the clipboard.' : 'Could not access the clipboard here; the BibTeX citation is below.'}\n\n${BIBTEX}`;
        },
      },
      researchAbort.signal,
    );
  } else if (area !== 'research' && researchAbort) {
    researchAbort.abort();
    researchAbort = null;
    registeredNames = registeredNames.filter((n) => n !== 'get-publications' && n !== 'get-citation');
  }

  updateChip();
}
