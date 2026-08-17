/** Research — first-author publications, presented as an article. */
import { Router } from '../router';
import { makeArticleLevel } from './article';
import teaserCatchThrow from '../assets/research/catching-and-throwing/teaser.webp';

// Resolve the downloadable paper without importing it as a module. Vite still
// fingerprints and copies the file for production, but the browser does not
// request the PDF (or a development ?import wrapper) until the link is opened.
const preprintCatchThrow = new URL(
  '../assets/research/catching-and-throwing/preprint.pdf',
  import.meta.url,
).href;

export const BIBTEX = `@inproceedings{10.1145/3487983.3488300,
    author = {Luo, Yunhao and Xie, Kaixiang and Andrews, Sheldon and Kry, Paul},
    title = {Catching and Throwing Control of a Physically Simulated Hand},
    year = {2021},
    isbn = {9781450391313},
    publisher = {Association for Computing Machinery},
    address = {New York, NY, USA},
    url = {https://doi.org/10.1145/3487983.3488300},
    doi = {10.1145/3487983.3488300},
    abstract = {We design a nominal controller for animating an articulated physics-based human arm model, including the hands and fingers, to catch and throw objects. The controller is based on a finite state machine that defines the target poses for proportional-derivative control of the hand, as well as the orientation and position of the center of the palm using the solution of an inverse kinematics solver. We then use reinforcement learning to train agents to improve the robustness of the nominal controller for achieving many different goals. Imitation learning based on trajectories output by a numerical optimization is used to accelerate the training process. The success of our controllers is demonstrated by a variety of throwing and catching tasks, including flipping objects, hitting targets, and throwing objects to a desired height, and for several different objects, such as cans, spheres, and rods. We also discuss ways to extend our approach so that more challenging tasks, such as juggling, may be accomplished.},
    booktitle = {Proceedings of the 14th ACM SIGGRAPH Conference on Motion, Interaction and Games},
    articleno = {15},
    numpages = {7},
    keywords = {throwing, physics-based animation, hand simulation, grasping, catching},
    location = {Virtual Event, Switzerland},
    series = {MIG '21}
}`;

export interface Publication {
  title: string;
  authors: string[];
  venue: string;
  year: number;
  doi: string;
  pdf: string;
  video: string;
  award?: string;
  awardUrl?: string;
  abstract: string;
  page?: string;
  teaser?: string;
}

export const PUBLICATIONS: Publication[] = [
  {
    title: 'Catching and Throwing Control of a Physically Simulated Hand',
    authors: ['Yunhao Luo', 'Kaixiang Xie', 'Sheldon Andrews', 'Paul G. Kry'],
    venue: 'Proceedings of the 14th ACM SIGGRAPH Conference on Motion, Interaction and Games',
    year: 2021,
    doi: '10.1145/3487983.3488300',
    pdf: preprintCatchThrow,
    video: 'https://drive.google.com/file/d/1o-CJK0HzPpar9M6bjOkYZdYaqjIbYGoz/view?usp=sharing',
    award: "Best Presentation Award — MIG '21",
    awardUrl: 'https://mig2021.inria.fr/awards/',
    abstract:
      'We design a nominal controller for animating an articulated physics-based human arm model, including the hands and fingers, to catch and throw objects. The controller is based on a finite state machine that defines the target poses for proportional-derivative control of the hand, as well as the orientation and position of the center of the palm using the solution of an inverse kinematics solver. We then use reinforcement learning to train agents to improve the robustness of the nominal controller for achieving many different goals. Imitation learning based on trajectories output by a numerical optimization is used to accelerate the training process. The success of our controllers is demonstrated by a variety of throwing and catching tasks, including flipping objects, hitting targets, and throwing objects to a desired height, and for several different objects, such as cans, spheres, and rods. We also discuss ways to extend our approach so that more challenging tasks, such as juggling, may be accomplished.',
    page: 'https://profs.etsmtl.ca/sandrews/publication/catchthrow_mig2021/',
    teaser: teaserCatchThrow,
  },
];

export function makePapersLevel(router: Router) {
  return makeArticleLevel(router, 'research', 'RESEARCH', (inner) => {
    const p = PUBLICATIONS[0];
    inner.innerHTML = `
      <h1>Research</h1>
      <p class="abstract">Research on character animation — teaching simulated bodies to move with intent using high-level control policies assisted by reinforcement learning.</p>
      <div class="rule"></div>

      <div class="item-card">
        <div class="ic-title">${p.title}</div>
        <p><em>${p.authors.join(', ')}</em></p>
        <div class="ic-type">${p.venue}, ${p.year}</div>
        ${p.award ? (p.awardUrl
          ? `<a class="badge" href="${p.awardUrl}" target="_blank" rel="noopener">🏆 ${p.award}</a>`
          : `<span class="badge">🏆 ${p.award}</span>`) : ''}
        ${p.teaser ? `<figure class="ic-teaser-fig"><img class="ic-teaser" src="${p.teaser}" alt="Teaser — the simulated arm and hand catching and throwing a cylinder" width="1250" height="247"><figcaption class="credit">Figure © the authors · published by ACM (MIG '21)</figcaption></figure>` : ''}
        <p style="margin-top:10px; margin-bottom: 20px;">${p.abstract}</p>
        <div class="article-links">
          <a href="${p.pdf}" target="_blank" rel="noopener">READ THE PREPRINT</a>
          <a href="${p.page}" target="_blank" rel="noopener">PROJECT PAGE</a>
          <a href="https://doi.org/${p.doi}" target="_blank" rel="noopener">DOI ${
            // break hints after / and . so the pill wraps on narrow screens;
            // <wbr> adds no character, so the copied DOI stays intact
            p.doi.replace(/([/.])/g, '$1<wbr>')
          }</a>
        </div>
      </div>

      <section>
        <h2>CITE</h2>
        <div class="bibtex">
          <button class="bibtex-copy" type="button">Copy</button>
          <pre><code>${BIBTEX.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</code></pre>
        </div>
      </section>

      <section>
        <h2>COLLABORATION</h2>
        <ul>
          <li>This work was conducted with Kaixiang Xie, Sheldon Andrews (ÉTS Montréal), and Paul G. Kry (McGill University).</li>
        </ul>
      </section>
    `;

    // wire the BibTeX copy button
    const copyBtn = inner.querySelector<HTMLButtonElement>('.bibtex-copy');
    copyBtn?.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(BIBTEX);
        copyBtn.textContent = 'Copied';
      } catch {
        copyBtn.textContent = 'Copy failed';
      }
      setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
    });
  });
}
