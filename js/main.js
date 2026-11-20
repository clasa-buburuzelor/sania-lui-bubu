/*
 * main.js — game flow (start → play → end → play again), buttons and the
 * story book that the teacher opens with 📖 and reads on the board.
 */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);

  // ------------------------------------------------------------ story (read by the teacher)
  const PAGES = [
    {
      art: '<span class="a" style="top:8%;right:10%">🌙</span><span class="a" style="bottom:20%;left:10%">🏠</span><span class="a" style="bottom:20%;right:12%">🏠</span><span class="a wiggle" style="top:30%;left:30%">💨</span>',
      text: 'Era <b>noaptea de Ajun</b>. Moș Crăciun își pregătea sania cu daruri. Dar ce să vezi? Un vânt puternic suflase <b>toate stelele</b> de pe cer!'
    },
    {
      art: '<span class="a" style="top:14%;left:14%">🎅</span><span class="a" style="bottom:18%;left:12%">🦌</span><span class="a" style="bottom:18%;right:14%">🦌</span><span class="a float" style="top:20%;right:14%">❓</span>',
      text: 'Fără stele, renii nu mai găseau drumul spre casele copiilor. „Cine mă ajută să pun stelele la loc pe cer?”, a întrebat Moș Crăciun.'
    },
    {
      art: '<img class="float" src="assets/bubu.webp" alt=""><span class="a" style="bottom:8%;right:8%">🛷</span><span class="a" style="top:8%;left:10%">✨</span>',
      text: '„Eu!”, a strigat <b>Bubu</b>. Moș Crăciun i-a dat căciulița lui roșie și sania cea mică, trasă de doi reni. Unul dintre ei are <b>nasul roșu</b> și luminos!'
    },
    {
      art: '<span class="a float" style="top:12%;left:14%">⭐</span><span class="a float" style="top:30%;right:14%;animation-delay:-1s">⭐</span><span class="a float" style="top:52%;left:36%;animation-delay:-2s">⭐</span><span class="a" style="bottom:6%;right:8%">🖱️</span>',
      text: 'Copii, ajutați-o pe Bubu! <b>Mișcați mouse-ul</b>, iar sania zboară după el. Puneți stelele la loc pe cer, adunați cadourile, clopoțeii, globurile și beculețele, apoi duceți darurile la case. La sfârșit va apărea <b>Steaua cea mare de Crăciun</b>!'
    }
  ];

  // ------------------------------------------------------------ flow
  function showStart() {
    $('start').hidden = false;
    $('btnAgain').hidden = true;
    E.go(Game.start());
  }

  function play() {
    SFX.unlock();
    $('start').hidden = true;
    $('btnAgain').hidden = true;
    E.go(Game.play(() => {
      $('btnAgain').hidden = false;
    }));
  }

  $('btnPlay').addEventListener('click', play);
  $('btnAgain').addEventListener('click', play);

  const btnSound = $('btnSound');
  function paintSound() {
    const m = SFX.isMuted();
    btnSound.textContent = m ? '🔇' : '🔊';
    btnSound.setAttribute('aria-pressed', String(!m));
    btnSound.setAttribute('aria-label', m ? 'Sunet oprit' : 'Sunet pornit');
  }
  btnSound.addEventListener('click', () => { SFX.setMuted(!SFX.isMuted()); paintSound(); });
  paintSound();

  $('btnFullscreen').addEventListener('click', () => {
    const d = document;
    if (d.fullscreenElement || d.webkitFullscreenElement) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else {
      const el = d.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) req.call(el);
    }
  });

  // ------------------------------------------------------------ story book
  let page = 0;
  const book = $('book');
  const dots = $('bookDots');
  dots.innerHTML = PAGES.map(() => '<span></span>').join('');

  function renderPage() {
    const p = PAGES[page];
    $('bookArt').innerHTML = p.art;
    $('bookText').innerHTML = p.text;
    [...dots.children].forEach((d, i) => d.classList.toggle('on', i === page));
    $('bookPrev').disabled = page === 0;
    const last = page === PAGES.length - 1;
    $('bookNext').classList.toggle('is-start', last);
    $('bookNext').setAttribute('aria-label', last ? 'Începe jocul' : 'Pagina următoare');
  }
  function openBook() { page = 0; renderPage(); book.hidden = false; E.stop(); }
  function closeBook() { book.hidden = true; E.start(); }

  $('btnBook').addEventListener('click', openBook);
  $('bookPrev').addEventListener('click', () => { if (page > 0) { page--; renderPage(); } });
  $('bookNext').addEventListener('click', () => {
    if (page < PAGES.length - 1) { page++; renderPage(); }
    else { closeBook(); play(); }
  });
  $('bookClose').addEventListener('click', closeBook);
  // for the teacher: Shift+R on the start screen clears the sleigh pieces
  document.addEventListener('keydown', e => {
    if (!$('start').hidden && book.hidden && e.shiftKey && (e.key === 'R' || e.key === 'r')) {
      Game.resetRewards();
      E.go(Game.start());
    }
  });
  document.addEventListener('keydown', e => {
    if (book.hidden) return;
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); $('bookNext').click(); }
    else if (e.key === 'ArrowLeft') $('bookPrev').click();
    else if (e.key === 'Escape') closeBook();
  });

  showStart();
  E.start();
})();
