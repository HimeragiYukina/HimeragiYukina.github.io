/** About — professional profile of the site's author, and the WebMCP tools. */
import { Router } from '../router';
import { makeArticleLevel } from './article';
import { describeTools } from '../webmcp';
import { ABOUT_ME_HTML } from '../content/aboutMe';
// intrinsic sizes of the wall photos (regenerated with the WebP encodes) —
// lets each <img> declare width/height so the wall never layout-shifts
import PHOTO_DIMS from '../content/photo-dims.json';

/** Photography — the wall composes every photo in src/assets/pictures
 *  (any extension, any case); the filename becomes the caption. Drop a
 *  file into the folder and it joins the wall on the next build (the
 *  full-resolution originals live in src/assets/pictures-full, outside
 *  the bundle). */
const PHOTOS: { src: string; caption: string; w?: number; h?: number }[] = Object.entries(
  import.meta.glob<string>('../assets/pictures/*', { eager: true, import: 'default', query: '?url' }),
).map(([path, src]) => {
  const caption = path.split('/').pop()!.replace(/\.[^.]+$/, '');
  const dims = (PHOTO_DIMS as Record<string, { w: number; h: number }>)[caption];
  return { src, caption, w: dims?.w, h: dims?.h };
});

export function makeAboutLevel(router: Router) {
  return makeArticleLevel(router, 'about', 'ABOUT', (inner) => {
    const tools = describeTools();
    inner.innerHTML = `
      <h1>About</h1>
      <p class="abstract">A little bit about me and this page. Have fun playing on my website!</p>
      <div class="rule"></div>

      <section id="about-me">
        <h2>ABOUT ME</h2>
        ${ABOUT_ME_HTML.map((p) => `<p>${p}</p>`).join('')}
      </section>

      <section>
        <h2>INTERESTS</h2>
        <p>
          Video games (as a player and an indie developer), poetry, board games, and photography.

          Here's <a href="#/zine">a zine I made for my modern poetry class</a>.
          Also, enjoy some of my photography below:
        </p>
        <div class="photo-grid">
          ${PHOTOS.map((ph) => `
          <figure class="photo-card${ph.w && ph.h && ph.w > ph.h ? ' landscape' : ''}">
            <img src="${ph.src}" alt="${ph.caption}" loading="lazy"${ph.w && ph.h ? ` width="${ph.w}" height="${ph.h}"` : ''}>
            <figcaption>${ph.caption}<span class="credit">© Yunhao Luo</span></figcaption>
          </figure>`).join('')}
        </div>
      </section>

      <section>
        <h2>WEBMCP INTERFACE</h2>
        <p>
          This site registers <b>WebMCP tools</b> (<a href="https://github.com/webmachinelearning/webmcp" target="_blank" rel="noopener">the Web Machine Learning proposal</a>)
          via <code>document.modelContext</code>. A browser or agent that implements the protocol can
          operate the site's key functions programmatically — moving the character, resting at the
          bonfire, traveling between areas, and retrieving the publication data. In accordance with the
          <a href="https://developer.chrome.com/docs/ai/webmcp/best-practices" target="_blank" rel="noopener">WebMCP best practices</a>,
          each tool is small and single-purpose:
        </p>
        <ul>
          ${tools.map((t) => `<li><b>${t.name}</b> — ${t.summary}${t.readOnly ? ' <em>(read-only)</em>' : ''}</li>`).join('')}
        </ul>
        <p><em>The indicator in the bottom-right corner reports whether a model-context host was detected on this page.</em></p>
      </section>
    `;
    // landscape shots hang as wide frames (see .photo-card.landscape in CSS).
    // Photos in the dims map are classified at render time above; this runtime
    // fallback covers a freshly dropped-in photo that has no dims entry yet
    inner.querySelectorAll<HTMLImageElement>('.photo-card:not(.landscape) img:not([width])').forEach((img) => {
      const mark = () => {
        if (img.naturalWidth > img.naturalHeight) img.closest('.photo-card')?.classList.add('landscape');
      };
      if (img.complete && img.naturalWidth > 0) mark();
      else img.addEventListener('load', mark, { once: true });
    });
  });
}
