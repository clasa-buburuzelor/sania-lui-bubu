/*
 * game.js — Sania lui Bubu.
 *
 * Bubu drives a small sleigh pulled by two reindeer through the night sky.
 * The child only MOVES THE MOUSE (a click or a tap works too): the sleigh
 * follows it and catches things. There are 6 levels; each one has something
 * else to catch, somewhere else for it to go and another landscape below:
 *   1 stars     → back to the sky              (over the mountains)
 *   2 gifts     → on balloons, to the top row  (forest with a frozen lake)
 *   3 bells     → each plays the next note     (village with a church)
 *   4 baubles   → onto the Christmas tree      (fir tree farm)
 *   5 bulbs     → the garland lights up        (town with lights)
 *   6 houses    → a gift drops in the chimney  (country houses)
 * Then the big Christmas star, Santa's sleigh and "Crăciun fericit!".
 *
 * To make children want to play again:
 *   - every finished round gives the sleigh a new piece (lights, bells, a
 *     sack of gifts, holly, a lantern, a sparkly trail; after that a new
 *     colour each time). Kept in the browser (localStorage); the teacher
 *     can clear it with Shift+R on the start screen.
 *   - small surprises pass by while playing (owl, shooting star, waving
 *     snowman, bunny). They ask nothing of the child.
 *   - every new round is another night (6 skies), other places and a
 *     little faster.
 *
 * No timer, no mistakes, nothing to read. Anything that is missed comes back.
 */
(function () {
  'use strict';

  const Game = { round: 0 };
  const TAU = Math.PI * 2;
  const BALL_COLORS = ['#e53935', '#1e88e5', '#fbc02d', '#8e44ad', '#ec407a', '#43a047', '#fb8c00', '#00acc1'];
  const BULB_COLORS = ['#ff5252', '#ffd740', '#40c4ff', '#69f0ae', '#ff80ab'];
  const GIFT_COLORS = Object.values(Art.COLORS);
  const SLEIGH_COLORS = ['#c62828', '#1e63c6', '#7b3fb0', '#1f8a4c', '#d4a017', '#d81b60'];
  const SPEED_UP = [1, 1.15, 1.28];        // round 1, 2, 3 and later

  // ------------------------------------------------------------ rewards for the sleigh
  const KEY = 'sania-bubu-premii';
  const PIECES = 6;                         // lights, bells, sack, holly, lantern, trail
  const Rewards = {
    n: 0,
    load() { try { this.n = Math.max(0, parseInt(localStorage.getItem(KEY), 10) || 0); } catch (e) { this.n = 0; } },
    add() { this.n++; try { localStorage.setItem(KEY, String(this.n)); } catch (e) { /* ignore */ } },
    reset() { this.n = 0; try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ } },
    color(n) { return SLEIGH_COLORS[n <= PIECES ? 0 : (n - PIECES) % SLEIGH_COLORS.length]; }
  };
  Rewards.load();
  Game.resetRewards = () => Rewards.reset();

  // ------------------------------------------------------------ sleigh and its pieces
  function drawSleigh(c, x, y, s, color) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x - s * 0.5, y - s * 0.3);
    c.lineTo(x + s * 0.35, y - s * 0.3);
    c.quadraticCurveTo(x + s * 0.55, y - s * 0.3, x + s * 0.5, y);
    c.lineTo(x - s * 0.45, y);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(x - s * 0.47, y - s * 0.08, s * 0.95, s * 0.08);
    c.fillStyle = '#ffd54f';
    c.fillRect(x - s * 0.5, y - s * 0.34, s * 0.85, s * 0.06);
    // golden swirl on the side and a curl at the front
    c.strokeStyle = '#ffd54f';
    c.lineWidth = s * 0.025;
    c.beginPath(); c.arc(x + s * 0.25, y - s * 0.15, s * 0.07, 0, TAU * 0.8); c.stroke();
    c.beginPath(); c.arc(x + s * 0.46, y - s * 0.3, s * 0.06, Math.PI, TAU * 0.9); c.stroke();
    c.lineWidth = s * 0.04;
    c.beginPath();
    c.moveTo(x - s * 0.5, y + s * 0.12); c.lineTo(x + s * 0.5, y + s * 0.12);
    c.quadraticCurveTo(x + s * 0.68, y + s * 0.12, x + s * 0.62, y - s * 0.05);
    c.moveTo(x - s * 0.3, y); c.lineTo(x - s * 0.3, y + s * 0.12);
    c.moveTo(x + s * 0.3, y); c.lineTo(x + s * 0.3, y + s * 0.12);
    c.stroke();
  }
  function drawSack(c, x, y, s) {
    Art.gift(c, x - s * 0.25, y - s * 0.55, s * 0.4, Art.COLORS.blue);
    Art.gift(c, x + s * 0.2, y - s * 0.6, s * 0.36, Art.COLORS.green);
    c.fillStyle = '#a1785a';
    c.beginPath(); c.ellipse(x, y, s * 0.55, s * 0.5, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)';
    c.beginPath(); c.ellipse(x + s * 0.18, y + s * 0.08, s * 0.3, s * 0.36, 0, 0, TAU); c.fill();
    c.strokeStyle = '#c62828'; c.lineWidth = s * 0.08;
    c.beginPath(); c.moveTo(x - s * 0.45, y - s * 0.25); c.quadraticCurveTo(x, y - s * 0.12, x + s * 0.45, y - s * 0.25); c.stroke();
  }
  function drawHolly(c, x, y, s) {
    c.fillStyle = '#2e7d32';
    c.beginPath(); c.ellipse(x - s * 0.35, y, s * 0.4, s * 0.17, -0.4, 0, TAU); c.fill();
    c.beginPath(); c.ellipse(x + s * 0.35, y, s * 0.4, s * 0.17, 0.4, 0, TAU); c.fill();
    c.fillStyle = '#e53935';
    for (const [dx, dy] of [[-0.1, -0.12], [0.12, -0.12], [0, 0.06]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, s * 0.13, 0, TAU); c.fill(); }
  }
  function drawLantern(c, x, y, s, on) {
    c.fillStyle = `rgba(255,236,140,${on ? 0.35 : 0.2})`;
    c.beginPath(); c.arc(x, y, s * 0.9, 0, TAU); c.fill();
    c.fillStyle = '#ffd54f';
    Art.star(c, x, y, s * 0.55, s * 0.25);
    c.fillStyle = '#fff8d0';
    Art.star(c, x, y, s * 0.28, s * 0.13);
  }
  function drawGarland(c, x0, x1, y, s, t) {
    c.strokeStyle = '#2e7d32'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(x0, y); c.quadraticCurveTo((x0 + x1) / 2, y + s * 0.5, x1, y); c.stroke();
    const n = 7;
    for (let i = 0; i < n; i++) {
      const k = i / (n - 1), x = E.lerp(x0, x1, k), yy = y + 4 * k * (1 - k) * s * 0.25 + 5;
      const on = (Math.floor(t * 2.5) + i) % 2 === 0;
      const col = BULB_COLORS[i % BULB_COLORS.length];
      if (on) { c.fillStyle = col + '66'; c.beginPath(); c.arc(x, yy, 11, 0, TAU); c.fill(); }
      c.globalAlpha = on ? 1 : 0.6;
      c.fillStyle = col;
      c.beginPath(); c.ellipse(x, yy, 5, 7, 0, 0, TAU); c.fill();
      c.globalAlpha = 1;
    }
  }

  /** Big picture of reward number n (0-based), shown at the end of a round. */
  function drawRewardIcon(c, n, x, y, s) {
    const k = n < PIECES ? n : -1;
    if (k === 0) drawGarland(c, x - s, x + s, y - s * 0.2, s, E.time);
    else if (k === 1) { Art.deco(c, 'bell', x - s * 0.35, y, s * 0.8); Art.deco(c, 'bell', x + s * 0.35, y + s * 0.1, s * 0.7); }
    else if (k === 2) drawSack(c, x, y + s * 0.2, s * 0.9);
    else if (k === 3) drawHolly(c, x, y, s * 1.1);
    else if (k === 4) drawLantern(c, x, y, s, true);
    else if (k === 5) {
      c.fillStyle = '#fff59d';
      for (let i = 0; i < 6; i++) Art.star(c, x - s * 0.8 + i * s * 0.3, y + Math.sin(i * 1.7) * s * 0.3, s * (0.12 + i * 0.04), s * 0.06, 4);
    } else drawSleigh(c, x, y + s * 0.2, s * 1.4, Rewards.color(n + 1));
  }

  // ------------------------------------------------------------ the sleigh team
  function makeTeam(x, y) {
    const bubu = Art.makeBubu(x, y);
    bubu.size = 128;
    bubu.flying = false;           // she sits in the sleigh: no wings
    const DEER = 130;              // reindeer body length
    const OFFS = [{ x: 200, y: -20 }, { x: 345, y: -40 }];
    let trailT = 0;
    return {
      x, y, tx: x, ty: y, bubu, galloping: true, phase: 0, prizes: Rewards.n, trail: [],
      deer: OFFS.map(o => ({ x: x + o.x, y: y + o.y })),
      flyTo(tx, ty) { this.tx = tx; this.ty = ty; },
      update(dt) {
        const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
        if (d > 0.5) {
          const step = Math.min(d, Math.max(150, Math.min(1100, d * 4)) * dt);
          this.x += dx / d * step;
          this.y += dy / d * step;
        }
        // the reindeer follow with a little delay: the team looks alive
        this.deer.forEach((r, i) => {
          const k = Math.min(1, dt * (7 - i * 1.5));
          r.x += (this.x + OFFS[i].x - r.x) * k;
          r.y += (this.y + OFFS[i].y + Math.sin(E.time * 3 + i) * 6 - r.y) * k;
        });
        if (this.galloping) this.phase += dt;
        // Bubu sits high enough in the sleigh to be seen whole
        bubu.x = this.x - 15;
        bubu.y = this.y - 88;
        // sparkly trail behind the runners (6th piece)
        if (this.prizes >= 6 && this.galloping) {
          trailT -= dt;
          if (trailT <= 0 && this.trail.length < 30) {
            trailT = 0.05;
            this.trail.push({ x: this.x - 90, y: this.y + 50 + Math.sin(E.time * 3) * 6 + E.rand(-8, 8), t: 0, s: E.rand(4, 8) });
          }
        }
        for (let i = this.trail.length - 1; i >= 0; i--) {
          const p = this.trail[i];
          p.t += dt; p.x -= 160 * dt; p.y += 10 * dt;
          if (p.t > 0.9) this.trail.splice(i, 1);
        }
      },
      /** Is the point (px, py) touched by the sleigh or by a reindeer? */
      touches(px, py, r) {
        if (E.dist(px, py, this.x, this.y - 40) < 115 + r) return true;
        return this.deer.some(d => E.dist(px, py, d.x + 20, d.y - 20) < 70 + r);
      },
      draw(c) {
        const P = this.prizes, x = this.x, y = this.y;
        if (this.trail.length) {
          c.fillStyle = '#fff59d';
          for (const p of this.trail) { c.globalAlpha = 1 - p.t / 0.9; Art.star(c, p.x, p.y, p.s, p.s * 0.4, 4); }
          c.globalAlpha = 1;
        }
        const bob = Math.sin(E.time * 3) * 6;
        c.save();
        c.translate(0, bob);
        // reins
        c.strokeStyle = '#ffd54f';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(x + 90, y + 5);
        for (const d of this.deer) c.lineTo(d.x + DEER * 0.16, d.y);
        c.stroke();
        for (let i = this.deer.length - 1; i >= 0; i--) {
          const d = this.deer[i];
          Art.reindeerSide(c, d.x, d.y, DEER, this.phase + i * 0.4, i === this.deer.length - 1);
          if (P >= 2) {
            // golden bells on the collar (2nd piece)
            c.save();
            c.translate(d.x + DEER * 0.36, d.y - DEER * 0.12);
            c.rotate(Math.sin(E.time * 8 + i) * 0.35);
            Art.deco(c, 'bell', 0, 12, 26);
            c.restore();
          }
        }
        if (P >= 5) {
          // star lantern on a pole (5th piece)
          c.strokeStyle = '#6d4c41'; c.lineWidth = 5;
          c.beginPath(); c.moveTo(x - 88, y - 20); c.lineTo(x - 88, y - 150); c.lineTo(x - 108, y - 150); c.stroke();
          c.lineWidth = 2;
          c.beginPath(); c.moveTo(x - 108, y - 150); c.lineTo(x - 108, y - 138); c.stroke();
          drawLantern(c, x - 108, y - 122, 22, Math.sin(E.time * 4) > 0);
        }
        bubu.draw(c);
        if (P >= 3) drawSack(c, x + 66, y - 40, 44);          // sack of gifts (3rd piece)
        drawSleigh(c, x, y + 30, 170, Rewards.color(P));
        if (P >= 1) drawGarland(c, x - 84, x + 60, y - 26, 30, E.time);   // lights on the rim (1st)
        if (P >= 4) drawHolly(c, x - 22, y + 6, 34);          // holly on the side (4th piece)
        c.restore();
      }
    };
  }

  // ------------------------------------------------------------ things to catch
  function drawStar(c, x, y, s) {
    c.fillStyle = '#ffd54f';
    Art.star(c, x, y, s, s * 0.44);
  }
  function drawGift(c, x, y, s, color, balloon) {
    if (balloon) {
      c.strokeStyle = 'rgba(255,255,255,0.8)';
      c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y - s * 0.5); c.quadraticCurveTo(x + 8, y - s * 0.85, x, y - s * 1.15); c.stroke();
      c.fillStyle = balloon;
      c.beginPath(); c.ellipse(x, y - s * 1.5, s * 0.36, s * 0.44, 0, 0, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)';
      c.beginPath(); c.ellipse(x - s * 0.12, y - s * 1.65, s * 0.08, s * 0.13, -0.4, 0, TAU); c.fill();
    }
    Art.gift(c, x, y, s, color);
  }
  function drawBell(c, x, y, s) { Art.deco(c, 'bell', x, y, s); }
  function drawBall(c, x, y, s, color) {
    c.fillStyle = '#ffd54f';
    c.fillRect(x - s * 0.12, y - s * 0.58, s * 0.24, s * 0.14);
    c.fillStyle = color;
    c.beginPath(); c.arc(x, y, s * 0.46, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.5)';
    c.beginPath(); c.ellipse(x - s * 0.16, y - s * 0.18, s * 0.11, s * 0.07, -0.6, 0, TAU); c.fill();
  }
  function drawBulb(c, x, y, s, color, glow) {
    if (glow) {
      c.fillStyle = color + '55';
      c.beginPath(); c.arc(x, y + s * 0.1, s * 0.62, 0, TAU); c.fill();
    }
    c.fillStyle = '#546e7a';
    c.fillRect(x - s * 0.14, y - s * 0.5, s * 0.28, s * 0.2);
    c.fillStyle = color;
    c.beginPath(); c.ellipse(x, y + s * 0.08, s * 0.26, s * 0.38, 0, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.beginPath(); c.ellipse(x - s * 0.08, y - s * 0.02, s * 0.06, s * 0.12, 0, 0, TAU); c.fill();
  }
  function drawHouseIcon(c, x, y, s, lit) {
    c.fillStyle = '#8d6e63';
    c.fillRect(x - s * 0.4, y - s * 0.1, s * 0.8, s * 0.5);
    c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x - s * 0.52, y - s * 0.08); c.lineTo(x, y - s * 0.5); c.lineTo(x + s * 0.52, y - s * 0.08); c.fill();
    c.fillStyle = lit ? '#ffe082' : '#37474f';
    c.fillRect(x - s * 0.12, y + s * 0.05, s * 0.24, s * 0.22);
  }

  /** A big country house with a chimney, for the last level (y = ground). */
  function drawHouse(c, h, wanted) {
    const { x, w } = h, y = 860, hh = w * 0.7;
    c.fillStyle = '#8d3b2f';
    c.fillRect(h.cx - 20, h.cy, 40, 90);
    c.fillStyle = '#fff';
    c.fillRect(h.cx - 25, h.cy - 6, 50, 14);
    c.fillStyle = h.wall;
    c.fillRect(x, y - hh, w, hh);
    // wooden band at the bottom, like the old village houses
    c.fillStyle = 'rgba(93,64,55,0.55)';
    c.fillRect(x, y - hh * 0.22, w, hh * 0.22);
    c.fillStyle = '#c62828';
    c.beginPath(); c.moveTo(x - 18, y - hh); c.lineTo(x + w / 2, y - hh - w * 0.48); c.lineTo(x + w + 18, y - hh); c.closePath(); c.fill();
    c.fillStyle = '#fff';
    c.beginPath(); c.moveTo(x - 18, y - hh); c.lineTo(x + w / 2, y - hh - w * 0.48); c.lineTo(x + w + 18, y - hh);
    c.lineTo(x + w + 6, y - hh + 8); c.lineTo(x + w / 2, y - hh - w * 0.48 + 16); c.lineTo(x - 6, y - hh + 8); c.closePath(); c.fill();
    c.fillStyle = '#5d4037';
    c.fillRect(x + w * 0.42, y - hh * 0.5, w * 0.18, hh * 0.5);
    c.fillStyle = h.lit ? '#ffe082' : '#37474f';
    c.fillRect(x + w * 0.12, y - hh * 0.72, w * 0.2, w * 0.18);
    c.fillRect(x + w * 0.68, y - hh * 0.72, w * 0.2, w * 0.18);
    if (h.lit) {
      c.strokeStyle = '#2e7d32'; c.lineWidth = 6;
      c.beginPath(); c.arc(x + w * 0.51, y - hh * 0.36, 10, 0, TAU); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 3; i++) {
        const k = (E.time * 0.5 + i / 3) % 1;
        c.beginPath(); c.arc(h.cx - k * 30, h.cy - 20 - k * 110, 10 + k * 18, 0, TAU); c.fill();
      }
    } else if (wanted) {
      // bouncing gift above the chimney: "bring it here"
      const b = Math.abs(Math.sin(E.time * 4)) * 22;
      c.fillStyle = 'rgba(255,240,150,0.25)';
      c.beginPath(); c.arc(h.cx, h.cy - 70 - b, 46, 0, TAU); c.fill();
      Art.gift(c, h.cx, h.cy - 70 - b, 50, Art.COLORS.red);
    }
  }

  // ------------------------------------------------------------ surprises (they ask nothing)
  const SURPRISES = ['owl', 'shooting', 'snowman', 'bunny'];
  function makeSurprise(kind, scroll) {
    const W = E.W;
    const s = { kind, t: 0, done: false };
    if (kind === 'owl') { s.x = -90; s.y = E.rand(300, 400); }
    else if (kind === 'shooting') { s.x = E.rand(W * 0.45, W * 0.95); s.y = E.rand(40, 120); }
    else if (kind === 'snowman') { s.x = W + 80; }
    else { s.x = W + 60; }
    s.update = function (dt) {
      this.t += dt;
      if (kind === 'owl') { this.x += 240 * dt; this.done = this.x > W + 100; }
      else if (kind === 'shooting') { this.x -= 750 * dt; this.y += 300 * dt; this.done = this.t > 1.6; }
      else if (kind === 'snowman') { this.x -= scroll * dt; this.done = this.x < -100; }
      else { this.x -= (scroll + 130) * dt; this.done = this.x < -80; }
    };
    s.draw = function (c) {
      if (kind === 'owl') {
        const { x } = this, y = this.y + Math.sin(this.t * 3) * 14, f = Math.sin(this.t * 14);
        c.fillStyle = '#6d4c41';
        c.beginPath(); c.ellipse(x - 26, y + 4, 24, 10 + f * 8, -0.5 - f * 0.4, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(x + 26, y + 4, 24, 10 + f * 8, 0.5 + f * 0.4, 0, TAU); c.fill();
        c.fillStyle = '#8d6e63';
        c.beginPath(); c.ellipse(x, y, 26, 32, 0, 0, TAU); c.fill();
        c.beginPath(); c.moveTo(x - 22, y - 22); c.lineTo(x - 18, y - 40); c.lineTo(x - 8, y - 26); c.moveTo(x + 22, y - 22); c.lineTo(x + 18, y - 40); c.lineTo(x + 8, y - 26); c.fill();
        c.fillStyle = '#d7ccc8';
        c.beginPath(); c.ellipse(x, y + 10, 16, 18, 0, 0, TAU); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(x - 10, y - 10, 10, 0, TAU); c.arc(x + 10, y - 10, 10, 0, TAU); c.fill();
        c.fillStyle = '#1b1b1b';
        c.beginPath(); c.arc(x - 8, y - 10, 5, 0, TAU); c.arc(x + 12, y - 10, 5, 0, TAU); c.fill();
        c.fillStyle = '#ffa000';
        c.beginPath(); c.moveTo(x - 4, y - 2); c.lineTo(x + 4, y - 2); c.lineTo(x, y + 6); c.fill();
      } else if (kind === 'shooting') {
        const a = Math.max(0, 1 - this.t / 1.6);
        const g = c.createLinearGradient(this.x, this.y, this.x + 220, this.y - 88);
        g.addColorStop(0, `rgba(255,250,210,${a})`);
        g.addColorStop(1, 'rgba(255,250,210,0)');
        c.strokeStyle = g; c.lineWidth = 6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(this.x, this.y); c.lineTo(this.x + 220, this.y - 88); c.stroke();
        c.globalAlpha = a;
        c.fillStyle = '#fffbe0';
        Art.star(c, this.x, this.y, 16, 7);
        c.globalAlpha = 1;
      } else if (kind === 'snowman') {
        const x = this.x, y = 862;
        c.strokeStyle = '#5d4037'; c.lineWidth = 5; c.lineCap = 'round';
        const a = Math.sin(this.t * 6) * 0.5 - 0.9;
        c.beginPath(); c.moveTo(x + 22, y - 62); c.lineTo(x + 22 + Math.cos(a) * 46, y - 62 + Math.sin(a) * 46); c.stroke();
        Art.snowman(c, x, y, 90);
      } else {
        const x = this.x, y = 860 - Math.abs(Math.sin(this.t * 6)) * 46;
        c.fillStyle = '#fafafa';
        c.beginPath(); c.ellipse(x, y - 18, 24, 18, 0, 0, TAU); c.fill();
        c.beginPath(); c.arc(x - 22, y - 34, 14, 0, TAU); c.fill();
        c.beginPath(); c.ellipse(x - 26, y - 60, 5, 16, -0.2, 0, TAU); c.ellipse(x - 16, y - 60, 5, 16, 0.2, 0, TAU); c.fill();
        c.fillStyle = '#f8bbd0';
        c.beginPath(); c.ellipse(x - 26, y - 60, 2.5, 11, -0.2, 0, TAU); c.ellipse(x - 16, y - 60, 2.5, 11, 0.2, 0, TAU); c.fill();
        c.fillStyle = '#1b1b1b';
        c.beginPath(); c.arc(x - 27, y - 37, 2.5, 0, TAU); c.fill();
        c.fillStyle = '#fff';
        c.beginPath(); c.arc(x + 24, y - 20, 7, 0, TAU); c.fill();
      }
    };
    return s;
  }

  // ------------------------------------------------------------ the levels
  // Places are functions of the stage width (E.W): the game fills any screen.
  const row = (n, gap, y) => [...Array(n)].map((_, i) => ({ x: E.W / 2 + (i - (n - 1) / 2) * gap, y }));
  const TREE = { y: 240, h: 215 };
  const LEVELS = [
    {
      kind: 'star', count: 8, speed: 165,
      slots: () => [...Array(8)].map((_, i) => { const t = i / 7; return { x: E.W / 2 - 380 + t * 760, y: 125 - Math.sin(t * Math.PI) * 55 }; }),
      item: (c, it, s) => drawStar(c, it.x, it.y, s * 0.9)
    },
    {
      kind: 'gift', count: 8, speed: 175, colors: GIFT_COLORS,
      slots: () => row(8, 84, 75),
      item: (c, it, s, flying) => drawGift(c, it.x, it.y, s * 1.1, it.color, flying ? null : it.balloon)
    },
    {
      kind: 'bell', count: 11, speed: 185,
      slots: () => row(11, 64, 70),
      item: (c, it, s) => drawBell(c, it.x, it.y, s * 1.4)
    },
    {
      kind: 'ball', count: 8, speed: 195, colors: BALL_COLORS,
      slots: () => [[-60, -36], [0, -26], [60, -36], [-44, -78], [44, -78], [-28, -120], [28, -120], [0, -160]]
        .map(([dx, dy]) => ({ x: E.W / 2 + dx, y: TREE.y + dy })),
      item: (c, it, s) => drawBall(c, it.x, it.y, s * 1.2, it.color)
    },
    {
      kind: 'bulb', count: 10, speed: 205, colors: BULB_COLORS,
      slots: () => [...Array(10)].map((_, i) => { const t = i / 9; return { x: E.W / 2 - 360 + t * 720, y: 72 + 4 * t * (1 - t) * 50 }; }),
      item: (c, it, s) => drawBulb(c, it.x, it.y, s * 1.3, it.color, true)
    },
    {
      kind: 'house', count: 6, speed: 150,
      slots: () => row(6, 96, 70)
    }
  ];

  /** The level path on the left: done, now, still to come (top to bottom). */
  function drawLevelPath(c, current) {
    LEVELS.forEach((L, i) => {
      const x = 44, y = 46 + i * 60;
      const now = i === current, done = i < current;
      c.globalAlpha = done || now ? 1 : 0.4;
      c.fillStyle = now ? 'rgba(255,213,79,0.4)' : 'rgba(11,26,58,0.6)';
      c.beginPath(); c.arc(x, y, now ? 29 : 24, 0, TAU); c.fill();
      if (done) { c.strokeStyle = '#ffd54f'; c.lineWidth = 3; c.stroke(); }
      if (L.kind === 'house') drawHouseIcon(c, x, y + 2, 32, done);
      else if (L.kind === 'gift') drawGift(c, x, y + 3, 28, Art.COLORS.red);
      else L.item(c, { x, y, color: L.colors ? L.colors[0] : null }, now ? 21 : 18, true);
      c.globalAlpha = 1;
    });
  }

  /** Where the things of this level go: empty places and filled ones. */
  function drawGoal(c, L, filled) {
    const slots = L.slots(), n = L.count;
    if (L.kind === 'star') {
      slots.forEach((p, i) => {
        if (i < filled) {
          c.fillStyle = 'rgba(255,220,100,0.25)';
          c.beginPath(); c.arc(p.x, p.y, 42, 0, TAU); c.fill();
          drawStar(c, p.x, p.y, 30 + Math.sin(E.time * 4 + i) * 3);
        } else {
          c.fillStyle = 'rgba(255,255,255,0.18)';
          Art.star(c, p.x, p.y, 28, 12);
        }
      });
    } else if (L.kind === 'ball') {
      Art.bigTree(c, E.W / 2, TREE.y, TREE.h);
      c.fillStyle = '#ffd54f';
      Art.star(c, E.W / 2, TREE.y - TREE.h * 1.02, 18, 8);
      slots.forEach((p, i) => {
        if (i < filled) drawBall(c, p.x, p.y, 30, L.colors[i % L.colors.length]);
        else { c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(p.x, p.y, 12, 0, TAU); c.fill(); }
      });
    } else if (L.kind === 'bulb') {
      c.strokeStyle = '#2e7d32'; c.lineWidth = 5;
      c.beginPath(); c.moveTo(E.W / 2 - 420, 50); c.quadraticCurveTo(E.W / 2, 170, E.W / 2 + 420, 50); c.stroke();
      slots.forEach((p, i) => {
        const lit = i < filled;
        c.globalAlpha = lit ? 1 : 0.35;
        drawBulb(c, p.x, p.y + 14, 34, lit ? L.colors[i % L.colors.length] : '#90a4ae', lit && Math.sin(E.time * 5 + i * 1.3) > -0.3);
        c.globalAlpha = 1;
      });
    } else {
      // a row with a dark band behind it (gifts, bells, houses)
      const gap = slots[1].x - slots[0].x;
      c.fillStyle = 'rgba(11,26,58,0.55)';
      Art.roundRect(c, slots[0].x - gap / 2 - 10, 18, gap * n + 20, 104, 28);
      c.fill();
      slots.forEach((p, i) => {
        const on = i < filled;
        if (L.kind === 'gift') Art.giftSlot(c, p.x, p.y + 8, 54, on, L.colors[i % L.colors.length]);
        else if (L.kind === 'house') drawHouseIcon(c, p.x, p.y, 62, on);
        else { c.globalAlpha = on ? 1 : 0.3; drawBell(c, p.x, p.y + 6, 46); c.globalAlpha = 1; }
      });
    }
  }

  function makeClouds() {
    return [0, 1, 2].map(i => ({ x: 300 + i * E.W / 3, y: E.rand(280, 560), s: E.rand(110, 160) }));
  }
  function drawCloud(c, cl) {
    Art.cloud(c, cl.x, cl.y, cl.s, 0.22);
    Art.cloud(c, cl.x + cl.s * 0.1, cl.y - cl.s * 0.08, cl.s * 0.8, 0.18);
  }

  // ------------------------------------------------------------ start screen
  Game.start = function () {
    Rewards.load();
    const team = makeTeam(E.W / 2 - 240, 660);
    team.galloping = false;
    const START_PLACES = ['sat', 'targ', 'castel', 'atelier', 'patinoar', 'polnord'];
    const land = Scenery.make(Game.round, START_PLACES[Game.round % START_PLACES.length]);
    return {
      update(dt) { team.prizes = Rewards.n; team.update(dt); },
      draw(c) {
        land.drawBack(c);
        land.drawFront(c);
        team.draw(c);
      }
    };
  };

  // ------------------------------------------------------------ the game
  Game.play = function (onEnd) {
    Rewards.load();
    const night = Game.round;
    const fast = SPEED_UP[Math.min(night, SPEED_UP.length - 1)];
    const team = makeTeam(350, 480);
    const places = Scenery.placesFor(night);       // another landscape for every level
    const land = Scenery.make(night, places[0]);
    const clouds = makeClouds();
    let lv = -1, L = null;
    let items = [], flying = [], houses = [], surprises = [];
    let caught = 0, placed = 0, spawnT = 0, surpriseT = E.rand(10, 16), lastSurprise = '';
    let state = 'intro', stateT = 0, t = 0;
    let big = null;                  // the big Christmas star
    let santa = null;                // Santa's sleigh passing at the end
    let prize = null;                // the new piece for the sleigh, at the end

    const right = () => E.W + 100;
    const maxX = () => E.W - 460;

    // ---- level flow
    function nextLevel() {
      lv++;
      items = []; flying = []; houses = [];
      caught = 0; placed = 0;
      team.bubu.wave = false;
      if (lv >= LEVELS.length) {
        L = null;
        state = 'big'; stateT = 0;
        big = { x: right() + 50, y: 470 };
        return;
      }
      L = LEVELS[lv];
      state = 'intro'; stateT = 0;
      spawnT = 0.4;
      if (L.kind === 'house') { addHouse(right()); addHouse(right() + 750); }
    }

    function levelDone() {
      state = 'done'; stateT = 0;
      SFX.bells();                   // the only sound effect: bells when a mission is finished
      team.bubu.wave = true;
      for (const it of items) E.burst(it.x, it.y, Art.SPARKS, 8);
      items = [];
      for (let i = 0; i < 4; i++) E.burst(E.rand(300, E.W - 300), E.rand(200, 500), Art.SPARKS, 18, 380);
      // the landscape changes while everybody celebrates
      if (places[lv + 1]) land.setPlace(places[lv + 1]);
    }

    // ---- items flying in from the right
    const topY = () => (L.kind === 'gift' ? 330 : 260);    // the balloon must fit above the gift
    function spawnItem() {
      let y, tries = 0;
      do { y = E.rand(topY(), 760); tries++; } while (tries < 10 && items.some(s => Math.abs(s.y - y) < 150 && s.x > E.W - 300));
      const i = caught + items.length;
      items.push({
        x: right(), y, ph: E.rand(0, 6),
        color: L.colors ? L.colors[i % L.colors.length] : null,
        balloon: E.pick(BALL_COLORS)
      });
    }

    function catchItem(it) {
      E.burst(it.x, it.y, ['#ffd54f', '#fff59d', '#ffffff'], 14);
      if (caught >= L.count) return;   // extras: just sparkle (no sound when collecting)
      const idx = caught++;
      const color = L.colors ? L.colors[idx % L.colors.length] : null;
      flying.push({
        x0: it.x, y0: it.y, idx, t: 0, dur: 0.9,
        draw: (c, x, y, k) => L.item(c, { x, y, color }, E.lerp(34, 26, k), true),
        land: () => landed(idx)
      });
    }

    function landed(idx) {
      placed++;
      E.pop(placed, E.W / 2, 380, { size: 190 });
      const to = L.slots()[idx];
      E.burst(to.x, to.y, ['#ffd54f', '#ffffff'], 10, 200);
    }

    // ---- houses (last level)
    function addHouse(x) {
      const w = E.rand(170, 200);
      houses.push({ x, w, cx: x + w * 0.72, cy: 860 - w * 0.7 - w * 0.36, lit: false, wall: E.pick(['#f3ead8', '#cfe3f0', '#f5d9a8', '#e8d4e8']), sent: false });
    }
    function deliver(h) {
      if (caught >= L.count) return;
      h.sent = true;
      const idx = caught++;
      flying.push({
        x0: team.x, y0: team.y - 20, house: h, t: 0, dur: 0.6,
        draw: (c, x, y, k) => Art.gift(c, x, y, E.lerp(50, 34, k), Art.COLORS.red),
        land: () => {
          h.lit = true;
          E.burst(h.cx, h.cy, Art.SPARKS, 16, 260);
          landed(idx);
        }
      });
    }

    function startEnd() {
      state = 'end'; stateT = 0;
      SFX.bells();
      E.burst(big.x, big.y, Art.SPARKS, 50, 560);
      big.fx = big.x; big.fy = big.y;
      team.flyTo(330, 640);
      team.bubu.wave = true;
    }

    nextLevel();

    return {
      update(dt) {
        t += dt;
        stateT += dt;
        team.update(dt);
        const scroll = L && L.kind === 'house' ? L.speed * fast : 140;
        land.update(dt, scroll);
        for (const cl of clouds) { cl.x -= 70 * dt; if (cl.x < -300) { cl.x = right(); cl.y = E.rand(280, 560); } }

        // little surprises now and then
        if (state === 'play' || state === 'intro') {
          surpriseT -= dt;
          if (surpriseT <= 0) {
            const k = E.pick(SURPRISES.filter(s => s !== lastSurprise));
            lastSurprise = k;
            surprises.push(makeSurprise(k, scroll));
            surpriseT = E.rand(14, 22);
          }
        }
        for (let i = surprises.length - 1; i >= 0; i--) { surprises[i].update(dt); if (surprises[i].done) surprises.splice(i, 1); }

        if (state === 'intro' && stateT > 1.2) state = 'play';

        if (state === 'play' && L.kind !== 'house') {
          spawnT -= dt;
          const busy = caught + flying.length;
          const want = busy < 2 ? 1 : (lv >= 3 ? 3 : 2);
          if (spawnT <= 0 && items.length < want && caught + items.length < L.count + 1) {
            spawnItem();
            spawnT = E.rand(0.8, 1.5) / fast;
          }
        }

        // items: a gentle wave, faster and wider in later levels
        const amp = (25 + lv * 7) * fast;
        for (let i = items.length - 1; i >= 0; i--) {
          const s = items[i];
          s.x -= L.speed * fast * dt;
          s.y = E.clamp(s.y + Math.sin(t * 1.6 + s.ph) * amp * dt, 250, 780);
          if (state === 'play' && team.touches(s.x, s.y, 32)) { items.splice(i, 1); catchItem(s); continue; }
          if (s.x < -60) { s.x = right(); s.y = E.rand(topY(), 760); }   // missed ones come back
        }

        // houses scroll past; the ones without a gift come round again
        if (L && L.kind === 'house') {
          for (const h of houses) {
            h.x -= scroll * dt; h.cx -= scroll * dt;
            if (state === 'play' && !h.sent && team.touches(h.cx, h.cy - 50, 45)) deliver(h);
          }
          houses = houses.filter(h => {
            if (h.x + h.w > -40) return true;
            if (!h.sent) { const nx = Math.max(right(), ...houses.map(o => o.x + 750)); h.x = nx; h.cx = nx + h.w * 0.72; return true; }
            return false;
          });
          const need = L.count - caught - houses.filter(h => !h.sent).length;
          const last = houses.reduce((m, h) => Math.max(m, h.x), -1e9);
          if (need > 0 && last < E.W - 600) addHouse(Math.max(right(), last + 750));
        }

        for (let i = flying.length - 1; i >= 0; i--) {
          const f = flying[i];
          f.t += dt / f.dur;
          if (f.t >= 1) { flying.splice(i, 1); f.land(); }
        }

        if (state === 'play' && placed >= L.count && !flying.length) levelDone();
        if (state === 'done' && stateT > 2.6) nextLevel();

        if (state === 'big') {
          big.x -= 130 * fast * dt;
          big.y = 470 + Math.sin(t * 1.2) * 120;
          if (big.x < -120) big.x = right() + 50;
          if (team.touches(big.x, big.y, 60)) startEnd();
        }
        if (state === 'end') {
          // the big star rises to the top of the sky and shines
          const k = E.easeInOut(Math.min(1, stateT / 1.5));
          big.x = E.lerp(big.fx, E.W / 2, k);
          big.y = E.lerp(big.fy, 190, k);
          if (Math.random() < dt * 5) E.burst(E.rand(150, E.W - 150), E.rand(120, 520), Art.SPARKS, 10, 260);
          // Santa found the way: his sleigh passes over the village
          if (!santa && stateT > 2) santa = { x: -350 };
          if (santa) santa.x += 260 * dt;
          // a new piece for the sleigh: shown big, then it flies onto the sleigh
          if (!prize && stateT > 4) prize = { n: Rewards.n, t: 0, given: false };
          if (prize) {
            prize.t += dt;
            if (!prize.given && prize.t > 2.3) {
              prize.given = true;
              Rewards.add();
              team.prizes = Rewards.n;
              E.burst(team.x, team.y - 30, Art.SPARKS, 40, 420);
            }
            if (prize.t > 2.8 && onEnd) { Game.round++; const f = onEnd; onEnd = null; f(); }
          }
        }
      },
      draw(c) {
        land.drawBack(c);
        for (const cl of clouds) drawCloud(c, cl);
        land.drawFront(c);
        for (const h of houses) drawHouse(c, h, L && caught < L.count);
        for (const s of surprises) s.draw(c);
        if (L) drawGoal(c, L, placed);
        if (santa) {
          const sx = santa.x, sy = 330 + Math.sin(E.time * 2) * 10;
          c.save(); c.globalAlpha = 0.9;
          Art.reindeerSide(c, sx + 150, sy - 10, 70, E.time, true);
          Art.reindeerSide(c, sx + 70, sy - 5, 70, E.time + 0.4, false);
          Art.sleigh(c, sx, sy + 15, 100);
          Art.emoji(c, '🎅', sx - 5, sy - 25, 56);
          c.restore();
        }
        for (const s of items) {
          c.save();
          c.translate(s.x, s.y);
          c.rotate(Math.sin(E.time * 2 + s.ph) * (L.kind === 'gift' ? 0.08 : 0.3));
          if (L.kind !== 'gift') {
            c.fillStyle = 'rgba(255,230,120,0.22)';
            c.beginPath(); c.arc(0, 0, 50, 0, TAU); c.fill();
          }
          L.item(c, Object.assign({}, s, { x: 0, y: 0 }), 40);
          c.restore();
        }
        const slots = L ? L.slots() : null;
        for (const f of flying) {
          const k = E.easeInOut(Math.min(1, f.t));
          const to = f.house ? { x: f.house.cx, y: f.house.cy } : slots[f.idx];
          const x = E.lerp(f.x0, to.x, k), y = E.lerp(f.y0, to.y, k) - Math.sin(k * Math.PI) * 80;
          f.draw(c, x, y, k);
        }
        if (big) {
          const r = state === 'end' ? E.lerp(70, 110, Math.min(1, stateT / 1.5)) : 70;
          c.save();
          c.translate(big.x, big.y);
          c.rotate(E.time * 0.6);
          c.fillStyle = 'rgba(255,240,170,0.18)';
          for (let i = 0; i < 8; i++) {
            c.rotate(Math.PI / 4);
            c.beginPath(); c.moveTo(0, 0); c.lineTo(-r * 0.4, -r * 2.6); c.lineTo(r * 0.4, -r * 2.6); c.closePath(); c.fill();
          }
          c.rotate(-E.time * 0.6);
          c.fillStyle = `hsl(${(E.time * 120) % 360},90%,70%)`;
          Art.star(c, 0, 0, r * 1.15, r * 0.5);
          c.fillStyle = '#fff8d0';
          Art.star(c, 0, 0, r * 0.75, r * 0.32);
          c.restore();
        }
        team.draw(c);
        drawLevelPath(c, Math.min(lv, LEVELS.length));
      },
      drawTop(c) {
        // new level: its thing grows big in the middle of the screen
        if (state === 'intro' && L) {
          const k = stateT / 1.2;
          const s = E.easeOutBack(Math.min(1, stateT / 0.4));
          c.save();
          c.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
          c.translate(E.W / 2, 450);
          c.scale(s * 3, s * 3);
          if (L.kind === 'house') drawHouseIcon(c, 0, 0, 60, true);
          else L.item(c, { x: 0, y: 0, color: L.colors ? L.colors[0] : null, balloon: '#e53935' }, 40);
          c.restore();
        }
        if (state !== 'end' || stateT < 1.2) return;
        // "Crăciun fericit!" (fades away when the new piece comes)
        const s = E.easeOutBack(Math.min(1, (stateT - 1.2) / 0.7));
        const a = E.clamp((4.2 - stateT) / 0.5, 0, 1);
        if (a > 0) {
          c.save();
          c.globalAlpha = a;
          c.translate(E.W / 2 + 150, 430);
          c.scale(s, s);
          c.font = `800 96px ${E.font}`;
          c.textAlign = 'center'; c.textBaseline = 'middle';
          c.lineWidth = 14; c.strokeStyle = '#7a1010'; c.lineJoin = 'round';
          c.strokeText('Crăciun fericit!', 0, 0);
          c.fillStyle = '#ffd23f';
          c.fillText('Crăciun fericit!', 0, 0);
          c.restore();
        }
        if (prize && !prize.given) {
          // the new piece: big in a golden circle, then it flies to the sleigh
          const pt = prize.t;
          const grow = E.easeOutBack(Math.min(1, pt / 0.5));
          const fly = E.easeInOut(E.clamp((pt - 1.6) / 0.7, 0, 1));
          const cx = E.lerp(E.W / 2 + 150, team.x, fly), cy = E.lerp(470, team.y - 20, fly);
          const sc = grow * (1 - fly * 0.7);
          c.save();
          c.translate(cx, cy);
          c.scale(sc, sc);
          c.globalAlpha = 1 - fly * 0.6;
          c.rotate(E.time * 0.5);
          c.fillStyle = 'rgba(255,236,150,0.22)';
          for (let i = 0; i < 10; i++) { c.rotate(TAU / 10); c.beginPath(); c.moveTo(0, 0); c.lineTo(-30, -190); c.lineTo(30, -190); c.fill(); }
          c.rotate(-E.time * 0.5);
          c.fillStyle = 'rgba(11,26,58,0.75)';
          c.beginPath(); c.arc(0, 0, 120, 0, TAU); c.fill();
          c.strokeStyle = '#ffd54f'; c.lineWidth = 8; c.stroke();
          drawRewardIcon(c, prize.n, 0, 0, 70);
          c.restore();
        }
      },
      move(x, y) { if (state !== 'end') team.flyTo(E.clamp(x, 140, maxX()), E.clamp(y, 250, 780)); },
      down(x, y) { if (state !== 'end') team.flyTo(E.clamp(x, 140, maxX()), E.clamp(y, 250, 780)); }
    };
  };

  window.Game = Game;
})();
