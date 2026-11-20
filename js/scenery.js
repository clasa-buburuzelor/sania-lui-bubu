/*
 * scenery.js — the landscape behind the sleigh.
 *
 * Two things change it:
 *   - the NIGHT (one per round played): the sky
 *       clasic, aurora, amurg, ninsoare, galaxie, zori
 *   - the PLACE (one per level): what the sleigh flies over. 12 places:
 *       munti, padure, sat, brazi, oras, tara          (first round)
 *       polnord, atelier, castel, targ, patinoar, far  (second round)
 *     and a mix of all of them from the third round on.
 * When the place changes, the new landscape fades in over the old one.
 *
 * Performance (old school computers): the sky is drawn once per window size;
 * every scrolling layer is drawn once into a 1600-wide tile that repeats, so
 * each frame only copies a few images. Only a few twinkling stars (and the
 * extra snow of the snowy night) are drawn every frame. At most 8 tiles are
 * kept in memory.
 *
 * Tiles: anything that may cross the left/right edge of a tile is drawn with
 * wrap() (a second time, shifted by the tile width), so nothing looks cut
 * where two tiles meet. Each layer is tall enough for its highest shape.
 */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const TW = 1600;                 // width of one repeating tile

  const BASE = {
    far: '#34497f', farSnow: '#d9e4ff', hill: '#7e9ed4', hillTop: '#a9c2ea', pine: '#1f5a4a',
    snow: '#eef5ff', snowShade: '#c9d9f2', glow: '#ffd27a', city: '#22305e', sea: '#2d5687'
  };
  const NIGHTS = [
    Object.assign({}, BASE, { sky: ['#050b2c', '#16306e', '#4a6fb5'], stars: 120, moon: { x: -230, y: 150, r: 62, color: '#fff4cf' } }),
    Object.assign({}, BASE, {
      sky: ['#020a18', '#0a2742', '#1f5468'], stars: 150,
      aurora: [['rgba(90,255,180,0.30)', 210, 0], ['rgba(140,120,255,0.24)', 290, 2.1], ['rgba(70,220,255,0.18)', 160, 4.2]],
      moon: { x: -300, y: 120, r: 38, color: '#eafcff' },
      far: '#1c3b56', farSnow: '#cfeef5', hill: '#5c8eac', hillTop: '#8fbcd2', pine: '#174a45',
      snow: '#ecfaff', snowShade: '#bfdbe6', glow: '#fff0a8', city: '#152c40', sea: '#1d4a63'
    }),
    Object.assign({}, BASE, {
      sky: ['#1a0d3d', '#5b2c80', '#f08aa0'], stars: 70,
      moon: { x: -260, y: 190, r: 90, color: '#ffe3ef' },
      far: '#4b2d70', farSnow: '#f6dcf0', hill: '#a78bd0', hillTop: '#cdb6ea', pine: '#3b2f63',
      snow: '#fff2fa', snowShade: '#e2cdeb', glow: '#ffcf8a', city: '#3a2560', sea: '#5a3f8c'
    }),
    Object.assign({}, BASE, {
      // snowy night: grey-blue clouds, thick snow
      sky: ['#1c2740', '#3c4f72', '#8095b8'], stars: 15, snowing: true,
      moon: { x: -380, y: 140, r: 46, color: 'rgba(255,250,235,0.55)' },
      far: '#4a5c80', farSnow: '#eef3fb', hill: '#94a9c9', hillTop: '#c3d1e6', pine: '#2b5751',
      snow: '#f5f8fc', snowShade: '#d3dcea', glow: '#ffe0a0', city: '#34425f', sea: '#4b648d'
    }),
    Object.assign({}, BASE, {
      // the Milky Way: lots of stars
      sky: ['#02030f', '#0d1240', '#2a3478'], stars: 300, milky: true,
      moon: { x: -200, y: 110, r: 34, color: '#fffbe8' },
      far: '#1f2658', farSnow: '#dfe3ff', hill: '#5f6cb0', hillTop: '#8d98d6', pine: '#1b3f4a', city: '#1a1f4a'
    }),
    Object.assign({}, BASE, {
      // early morning: pink and orange at the bottom of the sky
      sky: ['#1a2456', '#8a4f8f', '#f6a87a'], stars: 40,
      moon: { x: 0, y: 120, r: 40, color: '#fff3e6', left: 260 },
      far: '#5c4a86', farSnow: '#ffe6dc', hill: '#b39ad0', hillTop: '#e0c8e8', pine: '#41466e',
      snow: '#fff6f2', snowShade: '#ecd6e0', glow: '#ffd38a', city: '#4a3a70', sea: '#6a5a9a'
    })
  ];

  // seeded random: the landscape looks the same every time
  function seeded(seed) {
    return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  }

  // ------------------------------------------------------------ sky (whole width, static)
  function drawSky(o, th) {
    const W = E.W;
    const g = o.createLinearGradient(0, 0, 0, 900);
    g.addColorStop(0, th.sky[0]);
    g.addColorStop(0.55, th.sky[1]);
    g.addColorStop(1, th.sky[2]);
    o.fillStyle = g;
    o.fillRect(0, 0, W, 900);
    if (th.aurora) {
      for (const [color, y0, ph] of th.aurora) {
        for (let x = 0; x < W; x += 6) {
          const y = y0 + Math.sin(x / 260 + ph) * 60 + Math.sin(x / 97 + ph * 2) * 18;
          const h = 120 + Math.sin(x / 140 + ph) * 50;
          const gr = o.createLinearGradient(0, y - h, 0, y + 20);
          gr.addColorStop(0, 'rgba(0,0,0,0)');
          gr.addColorStop(0.75, color);
          gr.addColorStop(1, 'rgba(0,0,0,0)');
          o.fillStyle = gr;
          o.fillRect(x, y - h, 7, h + 20);
        }
      }
    }
    const rnd = seeded(11);
    if (th.milky) {
      // a soft band across the sky, full of tiny stars
      o.save();
      o.translate(W / 2, 260); o.rotate(-0.22);
      for (let i = 0; i < 3; i++) {
        o.fillStyle = `rgba(190,200,255,${0.06 + i * 0.03})`;
        o.beginPath(); o.ellipse(0, 0, W * 0.75, 90 - i * 25, 0, 0, TAU); o.fill();
      }
      o.fillStyle = 'rgba(255,255,255,0.8)';
      for (let i = 0; i < 260; i++) {
        o.beginPath(); o.arc((rnd() - 0.5) * W * 1.4, (rnd() - 0.5) * (rnd() * 150), rnd() * 1.2 + 0.3, 0, TAU); o.fill();
      }
      o.restore();
    }
    o.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < th.stars * W / 1600; i++) {
      o.beginPath(); o.arc(rnd() * W, rnd() * 560, rnd() * 1.7 + 0.5, 0, TAU); o.fill();
    }
    const m = th.moon, mx = m.left || W + m.x;
    for (let i = 3; i >= 1; i--) {
      o.fillStyle = `rgba(255,245,230,${0.05 * i})`;
      o.beginPath(); o.arc(mx, m.y, m.r * (1 + i * 0.45), 0, TAU); o.fill();
    }
    o.fillStyle = m.color;
    o.beginPath(); o.arc(mx, m.y, m.r, 0, TAU); o.fill();
    o.fillStyle = 'rgba(120,100,140,0.12)';
    o.beginPath(); o.arc(mx - m.r * 0.32, m.y - m.r * 0.18, m.r * 0.2, 0, TAU); o.arc(mx + m.r * 0.28, m.y + m.r * 0.3, m.r * 0.13, 0, TAU); o.fill();
  }

  // ------------------------------------------------------------ helpers for tiles
  function wrap(fn, x, pad) {
    fn(x);
    if (x < pad) fn(x + TW);
    if (x > TW - pad) fn(x - TW);
  }
  const hillY = x => 640 + Math.sin(x / TW * TAU * 2) * 34 + Math.sin(x / TW * TAU * 5 + 1) * 14;
  const groundY = x => 846 + Math.sin(x / TW * TAU * 3) * 6;
  const mod = x => ((x % TW) + TW) % TW;

  function snowFront(o, th) {
    o.fillStyle = th.snowShade;
    o.beginPath(); o.moveTo(0, 900);
    for (let x = 0; x <= TW; x += 20) o.lineTo(x, groundY(x) - 4);
    o.lineTo(TW, 900); o.closePath(); o.fill();
    o.fillStyle = th.snow;
    o.beginPath(); o.moveTo(0, 900);
    for (let x = 0; x <= TW; x += 20) o.lineTo(x, groundY(x) + 4);
    o.lineTo(TW, 900); o.closePath(); o.fill();
  }
  function glow(o, th, x, y, r, a) {
    o.fillStyle = th.glow + (a || '38');
    o.beginPath(); o.arc(x, y, r, 0, TAU); o.fill();
  }
  function lamp(o, th, x) {
    wrap(xx => {
      glow(o, th, xx, 776, 26, '40');
      o.fillStyle = '#3a3a52';
      o.fillRect(xx - 3, 780, 6, 80);
      o.fillStyle = th.glow;
      o.beginPath(); o.arc(xx, 776, 8, 0, TAU); o.fill();
    }, mod(x), 40);
  }
  function pine(o, th, x, h, color) {
    wrap(xx => Art.pine(o, xx, groundY(mod(xx)) + 8, h, color || th.pine, true), mod(x), h * 0.4);
  }
  function fence(o, x0, x1) {
    o.strokeStyle = '#8d6e63'; o.lineWidth = 4;
    for (let x = x0; x < x1; x += 28) { o.beginPath(); o.moveTo(x, groundY(x) + 6); o.lineTo(x, groundY(x) - 24); o.stroke(); }
    o.beginPath(); o.moveTo(x0, groundY(x0) - 14); o.lineTo(x1, groundY(x1) - 14); o.stroke();
  }
  function haystack(o, x, y, s) {
    o.fillStyle = '#d9a441';
    o.beginPath(); o.moveTo(x - s * 0.5, y); o.quadraticCurveTo(x - s * 0.45, y - s * 1.1, x, y - s * 1.15); o.quadraticCurveTo(x + s * 0.45, y - s * 1.1, x + s * 0.5, y); o.fill();
    o.fillStyle = '#fff';
    o.beginPath(); o.moveTo(x - s * 0.3, y - s * 0.8); o.quadraticCurveTo(x, y - s * 1.35, x + s * 0.3, y - s * 0.8); o.quadraticCurveTo(x, y - s * 0.9, x - s * 0.3, y - s * 0.8); o.fill();
    o.strokeStyle = '#6d4c41'; o.lineWidth = 3;
    o.beginPath(); o.moveTo(x, y - s * 1.15); o.lineTo(x, y - s * 1.35); o.stroke();
  }
  function candyCane(o, x, y, h) {
    o.lineCap = 'round';
    o.lineWidth = 10; o.strokeStyle = '#fff';
    o.beginPath(); o.moveTo(x, y); o.lineTo(x, y - h); o.arc(x + 16, y - h, 16, Math.PI, 0); o.stroke();
    o.strokeStyle = '#e53935';
    o.setLineDash([10, 12]);
    o.beginPath(); o.moveTo(x, y); o.lineTo(x, y - h); o.arc(x + 16, y - h, 16, Math.PI, 0); o.stroke();
    o.setLineDash([]);
    o.lineCap = 'butt';
  }
  function lightString(o, x0, y0, x1, y1, sag, seed) {
    const rnd = seeded(seed + 1);
    const COLS = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#ff80ab'];
    o.strokeStyle = '#2b2b3a'; o.lineWidth = 2;
    o.beginPath(); o.moveTo(x0, y0); o.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); o.stroke();
    for (let k = 1; k < 8; k++) {
      const t = k / 8, x = E.lerp(x0, x1, t), y = E.lerp(y0, y1, t) + 4 * t * (1 - t) * sag;
      const col = COLS[Math.floor(rnd() * COLS.length)];
      o.fillStyle = col + '55'; o.beginPath(); o.arc(x, y + 5, 9, 0, TAU); o.fill();
      o.fillStyle = col; o.beginPath(); o.arc(x, y + 5, 4, 0, TAU); o.fill();
    }
  }

  // ------------------------------------------------------------ far layer: mountains or hills
  function drawFar(o, th, p) {       // tile y: 100..900
    const rnd = seeded(p.seed);
    const n = p.peaks || 9;
    const body = p.ice ? '#9fc3e6' : th.far;
    for (let i = 0; i < n; i++) {
      const px = i * TW / n + rnd() * 80, h = p.h[0] + rnd() * (p.h[1] - p.h[0]), w = (p.w || 300) + rnd() * 160;
      wrap(x => {
        const tp = 520 - h;
        o.fillStyle = body;
        o.beginPath(); o.moveTo(x - w / 2, 522);
        if (p.round) o.quadraticCurveTo(x, tp - h * 0.6, x + w / 2, 522);
        else { o.quadraticCurveTo(x - w * 0.12, tp + 10, x, tp); o.quadraticCurveTo(x + w * 0.12, tp + 10, x + w / 2, 522); }
        o.fill();
        if (p.round) return;
        o.fillStyle = p.ice ? '#eef7ff' : th.farSnow;
        const k = p.ice ? 0.5 : 0.28, sw = p.ice ? 0.25 : 0.15;
        o.beginPath();
        o.moveTo(x - w * sw, tp + h * k);
        o.quadraticCurveTo(x - w * 0.05, tp + 4, x, tp);
        o.quadraticCurveTo(x + w * 0.05, tp + 4, x + w * sw, tp + h * k);
        o.lineTo(x + w * 0.07, tp + h * k * 0.75);
        o.lineTo(x, tp + h * k * 1.05);
        o.lineTo(x - w * 0.09, tp + h * k * 0.7);
        o.closePath(); o.fill();
      }, px, w);
    }
    o.fillStyle = body;
    o.fillRect(0, 520, TW, 400);
  }

  // ------------------------------------------------------------ middle layer
  function drawMid(o, th, p) {       // tile y: 380..900
    if (p.city) {
      // town silhouette with lit windows; the last building ends exactly at the tile edge
      const rnd = seeded(p.seed + 1);
      for (let x = 0; x < TW;) {
        let w = 60 + rnd() * 70;
        if (TW - x - w < 60) w = TW - x;
        const h = 90 + rnd() * 150, top = 760 - h;
        o.fillStyle = th.city;
        o.fillRect(x, top, w - 4, h + 140);
        if (rnd() < 0.3) { o.beginPath(); o.moveTo(x, top); o.lineTo(x + w / 2 - 2, top - 40); o.lineTo(x + w - 4, top); o.fill(); }
        for (let wy = top + 14; wy < 740; wy += 26) {
          for (let wx = x + 10; wx < x + w - 18; wx += 20) {
            if (rnd() < 0.55) { o.fillStyle = rnd() < 0.8 ? th.glow : '#9fd8ff'; o.fillRect(wx, wy, 9, 13); }
          }
        }
        o.fillStyle = th.snow;
        o.fillRect(x, top - 4, w - 4, 7);
        x += w;
      }
      o.fillStyle = th.hill;
      o.fillRect(0, 755, TW, 200);
      return;
    }
    if (p.sea) {
      // frozen sea with shiny lines and a few ice floes
      o.fillStyle = th.sea;
      o.fillRect(0, 640, TW, 300);
      o.strokeStyle = 'rgba(255,255,255,0.35)'; o.lineWidth = 3;
      const rnd = seeded(p.seed);
      for (let i = 0; i < 24; i++) { const x = rnd() * (TW - 120), y = 660 + rnd() * 200, w = 30 + rnd() * 80; o.beginPath(); o.moveTo(x, y); o.lineTo(x + w, y); o.stroke(); }
      o.fillStyle = '#eaf4ff';
      for (let i = 0; i < 7; i++) { const x = 100 + i * 210 + rnd() * 60, y = 700 + rnd() * 120; o.beginPath(); o.ellipse(x, y, 40 + rnd() * 30, 9, 0, 0, TAU); o.fill(); }
      return;
    }
    o.fillStyle = p.ice ? '#cfe3f7' : th.hill;
    o.beginPath(); o.moveTo(0, 900);
    for (let x = 0; x <= TW; x += 20) o.lineTo(x, hillY(x));
    o.lineTo(TW, 900); o.closePath(); o.fill();
    o.strokeStyle = p.ice ? '#ffffff' : th.hillTop; o.lineWidth = 8;
    o.beginPath();
    for (let x = 0; x <= TW; x += 20) o.lineTo(x, hillY(x) + 3);
    o.stroke();
    const rnd = seeded(p.seed + 2);
    for (let i = 0; i < (p.pines || 0); i++) {
      const px = rnd() * TW, h = p.pineH[0] + rnd() * (p.pineH[1] - p.pineH[0]);
      wrap(x => Art.pine(o, x, hillY(mod(x)) + 14, h, th.pine, true), px, h * 0.4);
    }
    if (p.stacks) for (let i = 0; i < 6; i++) { const px = 120 + i * 260; wrap(x => haystack(o, x, hillY(mod(x)) + 10, 34), px, 30); }
    if (p.castle) drawCastle(o, th, 900, hillY(900) + 12);
  }

  function drawCastle(o, th, x, y) {
    const stone = '#8c8fb0', dark = '#6b6e93';
    o.fillStyle = stone;
    o.fillRect(x - 110, y - 120, 220, 120);
    for (let i = 0; i < 6; i++) o.fillRect(x - 110 + i * 40, y - 136, 22, 18);   // battlements
    const towers = [[-130, 170, 46], [130, 150, 42], [0, 200, 56]];
    for (const [dx, h, w] of towers) {
      o.fillStyle = dx === 0 ? stone : dark;
      o.fillRect(x + dx - w / 2, y - h, w, h);
      const tip = y - h - w * 1.3;
      o.fillStyle = '#b23b3b';
      o.beginPath(); o.moveTo(x + dx - w / 2 - 8, y - h); o.lineTo(x + dx, tip); o.lineTo(x + dx + w / 2 + 8, y - h); o.fill();
      o.fillStyle = th.snow;
      o.beginPath(); o.moveTo(x + dx - w * 0.2, y - h - w * 0.85); o.lineTo(x + dx, tip); o.lineTo(x + dx + w * 0.2, y - h - w * 0.85); o.fill();
      o.strokeStyle = '#4e342e'; o.lineWidth = 3;
      o.beginPath(); o.moveTo(x + dx, tip); o.lineTo(x + dx, tip - 30); o.stroke();
      o.fillStyle = '#ffd54f';
      o.beginPath(); o.moveTo(x + dx, tip - 30); o.lineTo(x + dx + 24, tip - 23); o.lineTo(x + dx, tip - 16); o.fill();
      o.fillStyle = th.glow;
      o.fillRect(x + dx - 7, y - h + 30, 14, 20);
    }
    o.fillStyle = th.glow;
    for (const dx of [-70, 50]) o.fillRect(x + dx, y - 90, 16, 22);
    o.fillStyle = '#4e342e';
    o.beginPath(); o.moveTo(x - 22, y); o.lineTo(x - 22, y - 40); o.arc(x, y - 40, 22, Math.PI, 0); o.lineTo(x + 22, y); o.fill();
  }

  // ------------------------------------------------------------ near layer: a different one in every place
  const WALLS = ['#c0605a', '#5f7fbf', '#8a6bb0', '#d39a4f', '#5f9e7a', '#b86f8f'];

  function nearMountains(o, th) {
    const rnd = seeded(31);
    snowFront(o, th);
    for (let i = 0; i < 14; i++) { const x = rnd() * TW, h = 70 + rnd() * 50; pine(o, th, x, h); }
    glow(o, th, 745, 820, 70);
    Art.house(o, 700, groundY(700) + 6, 90, 60, '#7b5235', '#4e342e');
    for (const x of [300, 1200, 1450]) {
      o.fillStyle = '#6b7a99'; o.beginPath(); o.ellipse(x, groundY(x) + 2, 40, 22, 0, Math.PI, 0); o.fill();
      o.fillStyle = th.snow; o.beginPath(); o.ellipse(x, groundY(x) - 14, 26, 8, 0, Math.PI, 0); o.fill();
    }
  }

  function nearForest(o, th) {
    snowFront(o, th);
    o.fillStyle = '#a9d6f5';
    o.beginPath(); o.ellipse(800, 880, 360, 34, 0, 0, TAU); o.fill();
    o.strokeStyle = 'rgba(255,255,255,0.8)'; o.lineWidth = 4;
    for (const [x, w] of [[640, 80], [820, 120], [960, 60]]) { o.beginPath(); o.moveTo(x, 874); o.lineTo(x + w, 868); o.stroke(); }
    const rnd = seeded(41);
    for (let i = 0; i < 18; i++) {
      let x = rnd() * TW;
      if (x > 420 && x < 1180) x = (x < 800 ? 420 - rnd() * 300 : 1180 + rnd() * 300);
      pine(o, th, x, 80 + rnd() * 70);
    }
    Art.snowman(o, 1260, groundY(1260) + 4, 70);
  }

  function nearVillage(o, th) {
    const rnd = seeded(51);
    snowFront(o, th);
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 320 + rnd() * 40, w = 72 + rnd() * 26, h = 54 + rnd() * 18;
      if (i === 2) continue;   // the church stands here
      wrap(xx => { glow(o, th, xx + w / 2, 820, w * 0.9); Art.house(o, xx, groundY(mod(xx)) + 6, w, h, WALLS[i], '#7a2f3a'); }, x, 140);
      lamp(o, th, x - 30);
    }
    // church with a bell tower
    const cx = 740, base = groundY(cx) + 6;
    glow(o, th, cx + 70, 780, 120, '30');
    o.fillStyle = '#f3ead8';
    o.fillRect(cx, base - 80, 150, 80);
    o.fillStyle = '#8b3a3a';
    o.beginPath(); o.moveTo(cx - 12, base - 80); o.lineTo(cx + 75, base - 125); o.lineTo(cx + 162, base - 80); o.fill();
    o.fillStyle = '#f3ead8';
    o.fillRect(cx + 105, base - 170, 46, 100);
    o.fillStyle = '#8b3a3a';
    o.beginPath(); o.moveTo(cx + 98, base - 170); o.lineTo(cx + 128, base - 235); o.lineTo(cx + 158, base - 170); o.fill();
    o.fillStyle = '#4e342e';
    o.beginPath(); o.arc(cx + 128, base - 140, 14, Math.PI, 0); o.lineTo(cx + 142, base - 120); o.lineTo(cx + 114, base - 120); o.fill();
    Art.deco(o, 'bell', cx + 128, base - 134, 22);
    o.strokeStyle = '#ffd54f'; o.lineWidth = 4;
    o.beginPath(); o.moveTo(cx + 128, base - 235); o.lineTo(cx + 128, base - 262); o.moveTo(cx + 118, base - 252); o.lineTo(cx + 138, base - 252); o.stroke();
    o.fillStyle = th.glow;
    o.beginPath(); o.arc(cx + 40, base - 45, 13, Math.PI, 0); o.lineTo(cx + 53, base - 22); o.lineTo(cx + 27, base - 22); o.fill();
    o.fillStyle = '#5d4037';
    o.fillRect(cx + 66, base - 42, 22, 42);
  }

  function nearTreeFarm(o, th) {
    snowFront(o, th);
    const rnd = seeded(61);
    const COLS = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#ff80ab'];
    for (let i = 0; i < 11; i++) {
      const x = 60 + i * 145 + rnd() * 30, h = 110 + rnd() * 40;
      const jit = [...Array(7)].map(() => rnd() - 0.5);
      wrap(xx => {
        const by = groundY(mod(xx)) + 8;
        Art.pine(o, xx, by, h, '#1f6b45', true);
        for (let k = 0; k < 7; k++) {
          const t = (k + 0.5) / 7;
          o.fillStyle = COLS[(k + i) % COLS.length];
          o.beginPath(); o.arc(xx + jit[k] * h * 0.42 * (1 - t), by - h * 0.12 - t * h * 0.7, 4, 0, TAU); o.fill();
        }
        o.fillStyle = '#ffd54f';
        Art.star(o, xx, by - h * 0.93, 9, 4);
      }, x, h * 0.4);
    }
  }

  function nearCity(o, th) {
    const rnd = seeded(71);
    for (let x = 0; x < TW;) {
      let w = 90 + rnd() * 60;
      if (TW - x - w < 90) w = TW - x;
      const h = 70 + rnd() * 50, base = 860;
      o.fillStyle = WALLS[Math.floor(rnd() * WALLS.length)];
      o.fillRect(x, base - h, w - 8, h);
      o.fillStyle = th.snow;
      o.fillRect(x, base - h - 6, w - 8, 9);
      for (let wy = base - h + 14; wy < base - 24; wy += 26) {
        for (let wx = x + 10; wx < x + w - 26; wx += 22) { o.fillStyle = rnd() < 0.75 ? '#ffe082' : '#37474f'; o.fillRect(wx, wy, 12, 14); }
      }
      x += w;
    }
    snowFront(o, th);
    for (let x = 100; x < TW; x += 300) lamp(o, th, x);
  }

  function nearCountry(o, th) {
    snowFront(o, th);
    fence(o, 0, 560);
    fence(o, 1180, TW);
    const bx = 1240, by = groundY(bx) + 6;
    o.fillStyle = '#b23b3b'; o.fillRect(bx, by - 80, 120, 80);
    o.fillStyle = '#5d2a2a'; o.beginPath(); o.moveTo(bx - 10, by - 80); o.lineTo(bx + 60, by - 125); o.lineTo(bx + 130, by - 80); o.fill();
    o.fillStyle = th.snow; o.beginPath(); o.moveTo(bx - 10, by - 80); o.lineTo(bx + 60, by - 125); o.lineTo(bx + 130, by - 80); o.lineTo(bx + 120, by - 74); o.lineTo(bx + 60, by - 112); o.lineTo(bx, by - 74); o.fill();
    o.strokeStyle = '#fff'; o.lineWidth = 4; o.strokeRect(bx + 38, by - 50, 44, 50);
    o.beginPath(); o.moveTo(bx + 38, by - 50); o.lineTo(bx + 82, by); o.moveTo(bx + 82, by - 50); o.lineTo(bx + 38, by); o.stroke();
    haystack(o, 1420, groundY(1420) + 6, 60);
    haystack(o, 1500, groundY(1500) + 6, 46);
    // well with a sweep (fântână cu cumpănă)
    const wx = 260, wy = groundY(wx) + 4;
    o.fillStyle = '#8d6e63'; o.fillRect(wx - 26, wy - 36, 52, 36);
    o.fillStyle = th.snow; o.fillRect(wx - 30, wy - 42, 60, 8);
    o.strokeStyle = '#5d4037'; o.lineWidth = 7;
    o.beginPath(); o.moveTo(wx + 60, wy); o.lineTo(wx + 60, wy - 120); o.stroke();
    o.lineWidth = 5;
    o.beginPath(); o.moveTo(wx + 150, wy - 70); o.lineTo(wx - 10, wy - 150); o.stroke();
    o.lineWidth = 2;
    o.beginPath(); o.moveTo(wx - 10, wy - 150); o.lineTo(wx - 10, wy - 60); o.stroke();
    o.fillStyle = '#6d4c41'; o.fillRect(wx - 20, wy - 64, 20, 16);
  }

  // ---- places of the second round
  function nearPole(o, th) {
    // water, ice, igloos and a little polar bear
    o.fillStyle = th.sea;
    o.fillRect(0, 860, TW, 40);
    o.fillStyle = '#f2f8ff';
    o.beginPath(); o.moveTo(0, 900);
    for (let x = 0; x <= TW; x += 20) o.lineTo(x, groundY(x) + 2);
    o.lineTo(TW, 900); o.fill();
    for (const [x, s] of [[260, 70], [420, 50], [1100, 64]]) {
      const y = groundY(x) + 6;
      o.fillStyle = th.glow + '33'; o.beginPath(); o.arc(x, y - s * 0.4, s * 1.2, 0, TAU); o.fill();
      o.fillStyle = '#ffffff'; o.beginPath(); o.arc(x, y, s, Math.PI, 0); o.fill();
      o.strokeStyle = '#b9d3ee'; o.lineWidth = 2;
      o.beginPath(); o.arc(x, y, s, Math.PI, 0); o.stroke();
      for (let k = 1; k < 3; k++) {
        const yy = y - s * k / 3, half = Math.sqrt(s * s - (s * k / 3) ** 2);
        o.beginPath(); o.moveTo(x - half, yy); o.lineTo(x + half, yy); o.stroke();
      }
      o.fillStyle = th.glow; o.beginPath(); o.arc(x + s * 0.5, y, s * 0.28, Math.PI, 0); o.fill();
    }
    const bx = 760, by = groundY(bx) + 4;
    o.fillStyle = '#fbfbff';
    o.beginPath(); o.ellipse(bx, by - 30, 50, 30, 0, 0, TAU); o.fill();
    o.beginPath(); o.arc(bx + 50, by - 44, 22, 0, TAU); o.fill();
    o.beginPath(); o.arc(bx + 40, by - 64, 8, 0, TAU); o.arc(bx + 60, by - 64, 8, 0, TAU); o.fill();
    for (const lx of [-34, -14, 18, 36]) o.fillRect(bx + lx, by - 12, 14, 16);
    o.fillStyle = '#222';
    o.beginPath(); o.arc(bx + 70, by - 42, 4, 0, TAU); o.arc(bx + 54, by - 50, 3, 0, TAU); o.fill();
    o.fillStyle = '#d4e8fb';
    for (const [x, up] of [[560, 0], [600, 0], [580, 26], [1360, 0], [1400, 0]]) o.fillRect(x, groundY(x) - 26 - up, 38, 26);
  }

  function nearWorkshop(o, th) {
    snowFront(o, th);
    // Santa's workshop
    const x = 620, y = groundY(x) + 6;
    glow(o, th, x + 150, y - 70, 190, '2a');
    o.fillStyle = '#8d5a3b'; o.fillRect(x, y - 130, 300, 130);
    o.fillStyle = '#c62828';
    o.beginPath(); o.moveTo(x - 24, y - 130); o.lineTo(x + 150, y - 215); o.lineTo(x + 324, y - 130); o.fill();
    o.fillStyle = th.snow;
    o.beginPath(); o.moveTo(x - 24, y - 130); o.lineTo(x + 150, y - 215); o.lineTo(x + 324, y - 130); o.lineTo(x + 304, y - 120); o.lineTo(x + 150, y - 196); o.lineTo(x - 4, y - 120); o.fill();
    o.fillStyle = th.glow;
    o.beginPath(); o.arc(x + 150, y - 160, 20, 0, TAU); o.fill();
    o.fillRect(x + 30, y - 100, 50, 44); o.fillRect(x + 220, y - 100, 50, 44);
    o.fillStyle = '#5d4037'; o.fillRect(x + 120, y - 76, 60, 76);
    o.fillStyle = '#ffd54f'; Art.star(o, x + 150, y - 232, 18, 8);
    for (const cx of [140, 470, 1010, 1520]) candyCane(o, cx, groundY(cx) + 6, 70);
    const G = Object.values(Art.COLORS);
    [[960, 3], [1100, 2], [300, 3]].forEach(([gx, n], i) => {
      for (let k = 0; k < n; k++) Art.gift(o, gx + k * 34, groundY(gx) - 10, 30, G[(i * 3 + k) % G.length]);
      if (n === 3) Art.gift(o, gx + 34, groundY(gx) - 40, 28, G[(i + 5) % G.length]);
    });
    // a toy train
    const tx = 1200, ty = groundY(tx) + 4;
    o.fillStyle = '#c62828'; o.fillRect(tx, ty - 44, 60, 36); o.fillRect(tx + 36, ty - 70, 22, 26);
    o.fillStyle = '#263238'; o.fillRect(tx + 6, ty - 64, 14, 22);
    o.fillStyle = '#1e88e5'; o.fillRect(tx + 70, ty - 36, 50, 28);
    o.fillStyle = '#43a047'; o.fillRect(tx + 130, ty - 36, 50, 28);
    o.fillStyle = '#263238';
    for (const wx of [12, 48, 84, 106, 144, 166]) { o.beginPath(); o.arc(tx + wx, ty - 6, 9, 0, TAU); o.fill(); }
  }

  function nearMarket(o, th) {
    snowFront(o, th);
    const AWN = [['#e53935', '#fff'], ['#2e7d32', '#fff'], ['#1e63c6', '#fff'], ['#e53935', '#ffd54f']];
    [80, 330, 1000, 1250].forEach((x, i) => {
      const y = groundY(x) + 6, [c1, c2] = AWN[i];
      glow(o, th, x + 70, y - 50, 100, '2e');
      o.fillStyle = '#a1785a'; o.fillRect(x, y - 70, 140, 70);
      o.fillStyle = '#6d4c41'; o.fillRect(x, y - 110, 8, 110); o.fillRect(x + 132, y - 110, 8, 110);
      for (let k = 0; k < 7; k++) {
        o.fillStyle = k % 2 ? c2 : c1;
        o.beginPath(); o.moveTo(x - 10 + k * 23, y - 110); o.lineTo(x + 13 + k * 23, y - 110); o.lineTo(x + 13 + k * 23, y - 92); o.arc(x + 1.5 + k * 23, y - 92, 11.5, 0, Math.PI); o.fill();
      }
      o.fillStyle = th.snow; o.fillRect(x - 12, y - 116, 164, 8);
      o.fillStyle = '#ffd54f'; for (let k = 0; k < 4; k++) { o.beginPath(); o.arc(x + 24 + k * 30, y - 76, 9, 0, TAU); o.fill(); }
    });
    lightString(o, 220, 750, 330, 750, 20, 3);
    lightString(o, 1140, 750, 1250, 750, 20, 4);
    // the big tree in the square
    const tx = 760, ty = groundY(tx) + 8;
    glow(o, th, tx, ty - 110, 150, '30');
    Art.bigTree(o, tx, ty, 230);
    const COLS = ['#ff5252', '#ffd740', '#40c4ff', '#ff80ab'];
    const rnd = seeded(81);
    for (let k = 0; k < 18; k++) {
      const t = rnd(), yy = ty - 30 - t * 160, half = (1 - t) * 80;
      o.fillStyle = COLS[k % COLS.length];
      o.beginPath(); o.arc(tx + (rnd() - 0.5) * half * 1.6, yy, 6, 0, TAU); o.fill();
    }
    o.fillStyle = '#ffd54f'; Art.star(o, tx, ty - 240, 22, 10);
  }

  function nearCastle(o, th) {
    snowFront(o, th);
    const rnd = seeded(91);
    for (let i = 0; i < 12; i++) pine(o, th, rnd() * TW, 70 + rnd() * 60);
    for (let x = 150; x < TW; x += 400) lamp(o, th, x);
  }

  function nearCoast(o, th) {
    // rocky shore, a lighthouse, fishing huts and a boat in the ice
    snowFront(o, th);
    for (const [x, w] of [[160, 120], [480, 90], [1350, 140]]) {
      o.fillStyle = '#5f6b86'; o.beginPath(); o.ellipse(x, groundY(x) + 6, w, 34, 0, Math.PI, 0); o.fill();
      o.fillStyle = th.snow; o.beginPath(); o.ellipse(x - 8, groundY(x) - 18, w * 0.6, 12, 0, Math.PI, 0); o.fill();
    }
    const lx = 900, ly = groundY(lx) + 6;
    const g = o.createLinearGradient(lx, 0, lx - 420, 0);
    g.addColorStop(0, th.glow + '66'); g.addColorStop(1, th.glow + '00');
    o.fillStyle = g;
    o.beginPath(); o.moveTo(lx, ly - 222); o.lineTo(lx - 420, ly - 270); o.lineTo(lx - 420, ly - 170); o.fill();
    for (let k = 0; k < 5; k++) {
      o.fillStyle = k % 2 ? '#fff' : '#d32f2f';
      const y0 = ly - k * 40, w0 = 58 - k * 5, w1 = 58 - (k + 1) * 5;
      o.beginPath(); o.moveTo(lx - w0 / 2, y0); o.lineTo(lx - w1 / 2, y0 - 40); o.lineTo(lx + w1 / 2, y0 - 40); o.lineTo(lx + w0 / 2, y0); o.fill();
    }
    o.fillStyle = '#37474f'; o.fillRect(lx - 24, ly - 206, 48, 8);
    glow(o, th, lx, ly - 222, 30, '66');
    o.fillStyle = th.glow; o.fillRect(lx - 14, ly - 236, 28, 30);
    o.fillStyle = '#d32f2f'; o.beginPath(); o.moveTo(lx - 20, ly - 236); o.lineTo(lx, ly - 262); o.lineTo(lx + 20, ly - 236); o.fill();
    for (const [x, c] of [[1080, '#5f7fbf'], [1180, '#c0605a']]) Art.house(o, x, groundY(x) + 6, 60, 42, c, '#4e342e');
    const bx = 640, by = groundY(bx) + 8;
    o.fillStyle = '#8d5a3b'; o.beginPath(); o.moveTo(bx - 50, by - 24); o.lineTo(bx + 50, by - 24); o.lineTo(bx + 34, by); o.lineTo(bx - 34, by); o.fill();
    o.strokeStyle = '#5d4037'; o.lineWidth = 4; o.beginPath(); o.moveTo(bx, by - 24); o.lineTo(bx, by - 90); o.stroke();
    o.fillStyle = '#fff'; o.beginPath(); o.moveTo(bx + 3, by - 86); o.lineTo(bx + 40, by - 34); o.lineTo(bx + 3, by - 34); o.fill();
  }

  function nearRink(o, th) {
    snowFront(o, th);
    const cx = 800, cy = 868;
    o.fillStyle = '#bfe3fb';
    o.beginPath(); o.ellipse(cx, cy, 430, 30, 0, 0, TAU); o.fill();
    o.strokeStyle = 'rgba(255,255,255,0.9)'; o.lineWidth = 3;
    o.beginPath(); o.ellipse(cx - 60, cy, 200, 14, 0, 0.3, 2.6); o.stroke();
    o.beginPath(); o.ellipse(cx + 120, cy + 2, 160, 10, 0, 3.5, 5.9); o.stroke();
    o.fillStyle = '#6d4c41';
    for (let x = cx - 430; x <= cx + 430; x += 86) o.fillRect(x - 3, cy - 70, 6, 50);
    for (let x = cx - 430; x < cx + 430; x += 86) lightString(o, x, cy - 70, x + 86, cy - 70, 14, x);
    // skating snowmen with scarves
    for (const [x, col, tilt] of [[650, '#e53935', -0.12], [930, '#1e88e5', 0.1]]) {
      o.save(); o.translate(x, cy - 8); o.rotate(tilt);
      Art.snowman(o, 0, 0, 74);
      o.fillStyle = col; o.fillRect(-20, -56, 40, 8); o.fillRect(8, -52, 8, 24);
      o.strokeStyle = '#90a4ae'; o.lineWidth = 3;
      o.beginPath(); o.moveTo(-22, 2); o.lineTo(22, 2); o.stroke();
      o.restore();
    }
    const rnd = seeded(101);
    for (let i = 0; i < 6; i++) { const x = rnd() < 0.5 ? rnd() * 330 : 1270 + rnd() * 330; pine(o, th, x, 80 + rnd() * 50); }
  }

  // ------------------------------------------------------------ places
  const PLACES = {
    munti: { far: { seed: 3, h: [260, 400], w: 320 }, mid: { seed: 4, pines: 26, pineH: [70, 130] }, near: nearMountains },
    padure: { far: { seed: 13, h: [150, 250] }, mid: { seed: 14, pines: 46, pineH: [90, 160] }, near: nearForest },
    sat: { far: { seed: 23, h: [110, 200], round: true, w: 420 }, mid: { seed: 24, pines: 14, pineH: [60, 110] }, near: nearVillage },
    brazi: { far: { seed: 33, h: [180, 300] }, mid: { seed: 34, pines: 34, pineH: [70, 120] }, near: nearTreeFarm },
    oras: { far: { seed: 43, h: [80, 140], round: true, w: 500 }, mid: { seed: 44, city: true }, near: nearCity },
    tara: { far: { seed: 53, h: [60, 130], round: true, w: 520, peaks: 6 }, mid: { seed: 54, pines: 8, pineH: [60, 90], stacks: true }, near: nearCountry },
    polnord: { far: { seed: 63, h: [200, 330], ice: true }, mid: { seed: 64, ice: true }, near: nearPole },
    atelier: { far: { seed: 73, h: [220, 340] }, mid: { seed: 74, pines: 30, pineH: [70, 120] }, near: nearWorkshop },
    targ: { far: { seed: 83, h: [90, 160], round: true, w: 460 }, mid: { seed: 84, city: true }, near: nearMarket },
    castel: { far: { seed: 93, h: [240, 380] }, mid: { seed: 94, pines: 18, pineH: [60, 100], castle: true }, near: nearCastle },
    far: { far: { seed: 103, h: [70, 130], round: true, w: 500, peaks: 5 }, mid: { seed: 104, sea: true }, near: nearCoast },
    patinoar: { far: { seed: 113, h: [180, 290] }, mid: { seed: 114, pines: 24, pineH: [70, 120] }, near: nearRink }
  };
  const LAYERS = [
    { key: 'far', top: 100, h: 800, speed: 0.12 },
    { key: 'mid', top: 300, h: 600, speed: 0.4 },
    { key: 'near', top: 540, h: 360, speed: 1 }
  ];

  // offscreen images (least recently used ones are dropped)
  const cache = new Map();
  function tile(id, w, top, h, fn) {
    const k = E.scale * E.dpr;
    id += `|${k.toFixed(3)}|${E.W}`;
    let off = cache.get(id);
    if (off) { cache.delete(id); cache.set(id, off); return off; }
    while (cache.size >= 8) cache.delete(cache.keys().next().value);
    off = document.createElement('canvas');
    off.width = Math.max(1, Math.round(w * k));
    off.height = Math.max(1, Math.round(h * k));
    const o = off.getContext('2d');
    o.setTransform(k, 0, 0, k, 0, -top * k);
    fn(o);
    cache.set(id, off);
    return off;
  }

  /** The landscape of one night; the place can be changed with setPlace(). */
  function make(night, place) {
    const n = night % NIGHTS.length;
    const th = NIGHTS[n];
    const offs = LAYERS.map(() => 0);
    const rnd = seeded(21);
    const twinkles = [...Array(16)].map(() => ({ x: rnd(), y: 30 + rnd() * 420, s: 5 + rnd() * 7, ph: rnd() * TAU }));
    const upStars = [...Array(40)].map(() => ({ x: rnd(), y: rnd(), r: 0.6 + rnd() * 1.6 }));
    const flakes = th.snowing ? [...Array(E.reduced ? 20 : 60)].map(() => ({ x: rnd(), y: rnd() * 900, r: 2 + rnd() * 3, v: 60 + rnd() * 60, ph: rnd() * TAU })) : [];
    let cur = place || 'munti', prev = null, fade = 1;

    function layer(c, pl, i) {
      const L = LAYERS[i], P = PLACES[pl];
      const img = tile(`${n}|${pl}|${i}`, TW, L.top, L.h, o => {
        if (L.key === 'far') drawFar(o, th, P.far);
        else if (L.key === 'mid') drawMid(o, th, P.mid);
        else P.near(o, th);
      });
      for (let x = -offs[i]; x < E.W; x += TW) c.drawImage(img, x, L.top, TW, L.h);
    }
    function layers(c, from, to) {
      for (let i = from; i <= to; i++) {
        if (prev && fade < 1) {
          layer(c, prev, i);
          c.globalAlpha = fade;
          layer(c, cur, i);
          c.globalAlpha = 1;
        } else layer(c, cur, i);
      }
    }
    return {
      theme: th,
      setPlace(pl) {
        if (pl === cur) return;
        prev = cur; cur = pl; fade = 0;
        for (let i = 0; i < LAYERS.length; i++) layer({ drawImage() {} }, cur, i);   // build the new tiles now
      },
      update(dt, speed) {
        LAYERS.forEach((L, i) => { offs[i] = (offs[i] + speed * L.speed * dt) % TW; });
        if (fade < 1) fade = Math.min(1, fade + dt / 1.6);
        for (const f of flakes) {
          f.y += f.v * dt;
          if (f.y > Math.max(910, E.viewBottom + 10)) { f.y = Math.min(-10, E.viewTop - 10); f.x = Math.random(); }
        }
      },
      /** sky, twinkling stars, mountains and hills */
      drawBack(c) {
        // tall screen: the sky goes on above the stage
        if (E.viewTop < 0) {
          c.fillStyle = th.sky[0];
          c.fillRect(0, E.viewTop - 2, E.W, 4 - E.viewTop);
          c.fillStyle = 'rgba(255,255,255,0.8)';
          c.beginPath();
          for (const t of upStars) {
            const y = t.y * E.viewTop;
            if (y > -6) continue;
            c.moveTo(t.x * E.W + t.r, y); c.arc(t.x * E.W, y, t.r, 0, TAU);
          }
          c.fill();
        }
        c.drawImage(tile(`${n}|sky`, E.W, 0, 900, o => drawSky(o, th)), 0, 0, E.W, 900);
        c.fillStyle = '#fffbe6';
        for (const t of twinkles) {
          const a = 0.35 + 0.65 * Math.abs(Math.sin(E.time * 1.7 + t.ph));
          c.globalAlpha = a;
          Art.star(c, t.x * E.W, t.y, t.s * (0.7 + a * 0.4), t.s * 0.22, 4);
        }
        c.globalAlpha = 1;
        layers(c, 0, 1);
      },
      /** the place right under the sleigh (and the thick snow of the snowy night) */
      drawFront(c) {
        layers(c, 2, 2);
        // tall screen: the snow goes on below the stage
        if (E.viewBottom > 900) {
          const g = c.createLinearGradient(0, 899, 0, E.viewBottom);
          g.addColorStop(0, th.snow);
          g.addColorStop(1, th.snowShade);
          c.fillStyle = g;
          c.fillRect(0, 898, E.W, E.viewBottom - 898 + 2);
        }
        if (flakes.length) {
          c.fillStyle = 'rgba(255,255,255,0.75)';
          c.beginPath();
          for (const f of flakes) {
            const x = f.x * E.W + Math.sin(E.time + f.ph) * 20;
            c.moveTo(x + f.r, f.y); c.arc(x, f.y, f.r, 0, TAU);
          }
          c.fill();
        }
      }
    };
  }

  const ROUND_1 = ['munti', 'padure', 'sat', 'brazi', 'oras', 'tara'];
  const ROUND_2 = ['polnord', 'atelier', 'castel', 'targ', 'patinoar', 'far'];
  /** The 6 places of a round: the first two rounds are fixed, then a mix. */
  function placesFor(round) {
    if (round === 0) return ROUND_1;
    if (round === 1) return ROUND_2;
    return E.shuffle(ROUND_1.concat(ROUND_2)).slice(0, 6);
  }

  window.Scenery = { make, placesFor, nights: NIGHTS.length };
})();
