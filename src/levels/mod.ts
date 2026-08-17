/**
 * Mods — the Mizuki Slay-the-Spire mod, presented as an article entry.
 * Content mirrors the public mod (github.com/HimeragiYukina/mizuki-mod-sts,
 * published on the Steam Workshop); card art and screenshots are the mod's
 * real media — official Arknights / Slay the Spire content used in a
 * non-commercial fan mod, credited below.
 */
import { Router } from '../router';
import { makeArticleLevel } from './article';
// WebP encodes of the mod art (PNG originals kept alongside, unbundled)
import previewUrl from '../assets/mods/mizuki/gallery/preview.webp';
import artExaltation from '../assets/mods/mizuki/cards/Exaltation.webp';
import artCognitiveFilter from '../assets/mods/mizuki/cards/CognitiveFilter.webp';
import artDream from '../assets/mods/mizuki/cards/Dream.webp';
import artPriceOfPeace from '../assets/mods/mizuki/cards/PriceOfPeace.webp';
import artFeed from '../assets/mods/mizuki/cards/Feed.webp';
import artCRT from '../assets/mods/mizuki/cards/CRT.webp';
import relicMarionette from '../assets/mods/mizuki/relics/relic-Marionette.png';
import relicCaerulaHeart from '../assets/mods/mizuki/relics/relic-CaerulaHeart.png';
import relicCaerulaArbor from '../assets/mods/mizuki/relics/relic-CaerulaArbor.png';
// captured in-game screenshots (from the Steam Workshop listing)
import shotSelect from '../assets/mods/mizuki/gallery/screenshot-1.webp';
import shotCombat from '../assets/mods/mizuki/gallery/screenshot-2.webp';
import shotCards from '../assets/mods/mizuki/gallery/screenshot-3.webp';
import shotCardView from '../assets/mods/mizuki/gallery/screenshot-4.webp';

const STEAM_URL = 'https://steamcommunity.com/sharedfiles/filedetails/?id=3764504027';
const GITHUB_URL = 'https://github.com/HimeragiYukina/mizuki-mod-sts';

// hero slideshow: the Workshop preview, then the in-game captures
const SLIDES: { src: string; caption: string; cls?: string }[] = [
  { src: previewUrl, caption: 'Mizuki — official Arknights artwork © Hypergryph, the mod\'s Workshop preview', cls: 'slide-preview' },
  { src: shotSelect, caption: 'Character select — Mizuki · Slay the Spire © Mega Crit' },
  { src: shotCombat, caption: 'Combat — stacking Nervous Impairment toward a detonation · © Mega Crit' },
  { src: shotCards, caption: 'A spread of the rare cards · © Mega Crit / Hypergryph' },
  { src: shotCardView, caption: 'Single-card view — a card and its keyword tooltips · © Mega Crit / Hypergryph' },
];

interface FeaturedCard {
  name: string;
  zh: string;
  cost: string;
  type: string;
  rare: boolean;
  text: string;
  art: string;
}

// real cards from the mod, effects paraphrased without magic numbers —
// see the repo for exact tuning
const CARDS: FeaturedCard[] = [
  {
    name: 'Exaltation', zh: '升格', cost: '3', type: 'Power · Rare', rare: true, art: artExaltation,
    text: 'At the start of each turn, gain <b>Strength</b> — and <b>Nervous Impairment</b> with it. Power at a price.',
  },
  {
    name: 'Cognitive Filter', zh: '认知滤镜', cost: '2', type: 'Attack · Rare', rare: true, art: artCognitiveFilter,
    text: 'A finisher that hits harder for every stack of <b>Nervous Impairment</b> you carry. <b>Exhaust.</b>',
  },
  {
    name: 'Dream', zh: '梦境', cost: '0', type: 'Skill · Uncommon', rare: false, art: artDream,
    text: 'Gain <b>Block</b> — and <b>Nervous Impairment</b> with it. The sea shelters, and the sea takes. <b>Exhaust.</b>',
  },
  {
    name: 'Price of Peace', zh: '息潮的代价', cost: '1', type: 'Power · Rare', rare: true, art: artPriceOfPeace,
    text: 'Every card you play applies <b>Nervous Impairment</b> to ALL enemies — but the tide taxes your energy each turn. <b>Ethereal.</b>',
  },
  {
    name: 'Feed', zh: '进食', cost: '1', type: 'Skill · Basic', rare: false, art: artFeed,
    text: 'Convert your <b>Hope</b> into that much <b>Regen</b>. <b>Exhaust.</b>',
  },
  {
    name: 'CRT', zh: '老式显像器', cost: '1', type: 'Skill · Uncommon', rare: false, art: artCRT,
    text: 'Replay the last card you played. <b>Ethereal. Exhaust.</b> An old monitor remembers.',
  },
];

export function makeModLevel(router: Router) {
  return makeArticleLevel(router, 'mods', 'MODS', (inner) => {
    inner.innerHTML = `
      <h1>Mizuki Mod</h1>
      <p class="abstract"><b>Mizuki</b>, the operator from <em>Arknights</em>, joins <em>Slay the Spire</em> as a
        playable character — themed around the Integrated Strategies expedition <em>Mizuki &amp; Caerula Arbor</em>.</p>
      <div class="rule"></div>

      <figure class="mod-hero mod-slides">
        <div class="slide-frame">
          ${SLIDES.map((s, i) => `<img class="${s.cls ?? ''}${i === 0 ? ' active' : ''}" src="${s.src}" alt="${s.caption}" ${i > 0 ? 'loading="lazy"' : ''}>`).join('')}
          <button class="slide-nav slide-prev" type="button" aria-label="previous slide">‹</button>
          <button class="slide-nav slide-next" type="button" aria-label="next slide">›</button>
          <div class="slide-dots">
            ${SLIDES.map((_, i) => `<button class="slide-dot${i === 0 ? ' active' : ''}" type="button" data-slide="${i}" aria-label="slide ${i + 1}"></button>`).join('')}
          </div>
        </div>
        <figcaption class="credit" data-slide-caption>${SLIDES[0].caption}</figcaption>
      </figure>

      <div class="article-links mod-links">
        <a href="${STEAM_URL}" target="_blank" rel="noopener">STEAM WORKSHOP</a>
        <a href="${GITHUB_URL}" target="_blank" rel="noopener">SOURCE ON GITHUB</a>
      </div>

      <div class="stat-row" style="justify-content:center">
        <div class="stat"><b>78</b><span>CARDS</span></div>
        <div class="stat"><b>9</b><span>RELICS</span></div>
        <div class="stat"><b>5</b><span>POTIONS</span></div>
        <div class="stat"><b>2</b><span>LANGUAGES</span></div>
        <div class="stat"><b>Spine</b><span>ANIMATED SPRITE</span></div>
      </div>

      <section>
        <h2>NOW ON STEAM WORKSHOP</h2>
        <p>The mod is live — play it via the <a href="${STEAM_URL}" target="_blank" rel="noopener">Steam Workshop</a>
          (recommended — <b>ModTheSpire</b>, <b>BaseMod</b> and <b>StSLib</b> subscribe automatically as
          dependencies), or build from source on <a href="${GITHUB_URL}" target="_blank" rel="noopener">GitHub</a>.</p>
      </section>

      <section>
        <h2>THE MECHANIC — NERVOUS IMPAIRMENT</h2>
        <p>
          The whole character orbits one custom debuff: <b>Nervous Impairment</b> stacks quietly on enemies (and,
          if you are careless, on you). At <b>10 stacks it bursts and resets</b>, giving the bearer 1 <b>Frenzy</b> —
          and each Frenzy gained burns HP equal to <b>10× its current Frenzy stacks</b> (10, 20, 30…). A monster is
          stunned only the <em>first</em> time it gains Frenzy, a deliberate design choice so bosses can't be
          stun-locked. Because many of Mizuki's strongest cards inflict NI on <em>himself</em>, self-affliction
          builds (see <em>Reflection</em>) are a genuine risk-reward axis rather than a gimmick.
        </p>
        <p>
          Around it: <b>Hope</b>, an accumulating resource that cards convert into damage, Block, Regen or gold —
          hoard it or spend it; and <b>Regen</b>, healing that ticks down each turn, giving Mizuki a survival
          style distinct from pure Block.
        </p>
      </section>

      <section>
        <h2>FEATURED CARDS</h2>
        <div class="sts-cards"></div>
        <p class="credit">Card artwork from the mod — official <em>Arknights</em> content © Hypergryph;
          card frames and UI © Mega Crit (<em>Slay the Spire</em>).</p>
      </section>

      <section>
        <h2>THE CARD POOL</h2>
        <p>
          <b>78 cards</b> — 72 in the standard reward pool plus 6 special spawn-only cards generated by other
          cards. The pool is at full base-character size (a base Spire character ships ~73–75), with every
          archetype gap closed: X-cost AoE (<em>Noise</em>), an exhaust finisher (<em>Cognitive Filter</em>),
          block-scaling (<em>Crystal</em>), multi-hit, a growing attack, NI and Hope engine powers, and
          Strength ramp (<em>Exaltation</em>).
        </p>
        <table class="mod-table">
          <thead>
            <tr><th>Type</th><th>Basic</th><th>Common</th><th>Uncommon</th><th>Rare</th><th>Special</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr><td>Attack</td><td>1</td><td>10</td><td>11</td><td>4</td><td>0</td><td><b>26</b></td></tr>
            <tr><td>Skill</td><td>3</td><td>7</td><td>16</td><td>6</td><td>4</td><td><b>36</b></td></tr>
            <tr><td>Power</td><td>0</td><td>0</td><td>7</td><td>7</td><td>2</td><td><b>16</b></td></tr>
            <tr><td><b>Total</b></td><td><b>4</b></td><td><b>17</b></td><td><b>34</b></td><td><b>17</b></td><td><b>6</b></td><td><b>78</b></td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>NOTABLE RELICS</h2>
        <ul class="relic-list">
          <li><img class="relic-icon" src="${relicMarionette}" alt=""><span><b>Marionette</b> — enemies lose extra HP whenever their Nervous Impairment detonates.</span></li>
          <li><img class="relic-icon" src="${relicCaerulaHeart}" alt=""><span><b>Caerula Heart</b> — +1 energy every turn… but the sea taxes you with NI at the start of each combat.</span></li>
          <li><img class="relic-icon" src="${relicCaerulaArbor}" alt=""><span><b>Caerula Arbor</b> — finish a fight untouched and the tree rewards you with max HP and a vial of the affliction itself.</span></li>
        </ul>
        <p>All 9 relics are modeled on the biological curios of <em>Mizuki &amp; Caerula Arbor</em>.</p>
      </section>

      <section>
        <h2>COPYRIGHT</h2>
        <p class="mod-disclaimer">
          <em>Arknights</em> and the character Mizuki are the property of <b>Hypergryph</b>;
          <em>Slay the Spire</em> and its card frames are the property of <b>Mega Crit</b>.
          All artwork shown on this page is official Arknights / Slay the Spire content, used in a
          <b>non-commercial fan mod</b> that is unaffiliated with Hypergryph or Mega Crit.
          The mod's code is MIT-licensed (© Alchyr for the BasicMod template; © Yunhao Luo for the
          Mizuki mod) — the systems, mechanics and card design are mine; the art is theirs.
        </p>
      </section>
    `;

    // build the featured cards with the mod's real art
    const holder = inner.querySelector('.sts-cards')!;
    for (const cd of CARDS) {
      const el = document.createElement('div');
      el.className = 'sts-card' + (cd.rare ? ' rare' : '');
      el.innerHTML = `
        <div class="cost">${cd.cost}</div>
        <div class="c-name">${cd.name} · ${cd.zh}</div>
        <div class="c-type">${cd.type}</div>
        <img class="c-art" src="${cd.art}" alt="${cd.name} card art" loading="lazy" width="250" height="190">
        <div class="c-text">${cd.text}</div>
      `;
      holder.appendChild(el);
    }

    // hero slideshow: arrows / dots to navigate, auto-advance every 6s
    // (any manual step restarts the clock); the timer self-clears once the
    // page unmounts
    const hero = inner.querySelector<HTMLElement>('.mod-slides')!;
    const slides = [...hero.querySelectorAll<HTMLImageElement>('.slide-frame img')];
    const dots = [...hero.querySelectorAll<HTMLButtonElement>('.slide-dot')];
    const caption = hero.querySelector<HTMLElement>('[data-slide-caption]')!;
    let idx = 0;
    const show = (i: number) => {
      idx = (i + SLIDES.length) % SLIDES.length;
      slides.forEach((el, n) => el.classList.toggle('active', n === idx));
      dots.forEach((el, n) => el.classList.toggle('active', n === idx));
      caption.textContent = SLIDES[idx].caption;
    };
    let timer = 0;
    const restart = () => {
      clearInterval(timer);
      timer = window.setInterval(() => {
        if (!hero.isConnected) return clearInterval(timer);
        show(idx + 1);
      }, 6000);
    };
    hero.querySelector('.slide-prev')!.addEventListener('click', () => { show(idx - 1); restart(); });
    hero.querySelector('.slide-next')!.addEventListener('click', () => { show(idx + 1); restart(); });
    dots.forEach((d) => d.addEventListener('click', () => { show(Number(d.dataset.slide)); restart(); }));
    restart();
  });
}
