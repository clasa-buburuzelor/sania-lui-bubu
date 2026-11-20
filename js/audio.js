/*
 * audio.js — the only sound effect of the game: bells when a mission is
 * finished (the story narrator is separate, see main.js).
 *
 * Made right in the browser (Web Audio), no audio files — the same recipe as
 * the winter mode of the Bubu 2026 site:
 * - sleigh bells: quick shakes, each one = many tiny metal bells ringing at
 *   almost the same time, a little left and right;
 * - a short echo (a small "room" made from noise), so the sound is round, not dry.
 * The context is created on the first click, as browsers require.
 */
(function () {
  'use strict';

  let ctx = null;
  let out = null;          // bells → (dry + echo) → master → speakers
  let master = null;
  let muted = false;

  try { muted = localStorage.getItem('bubu-craciun-mute') === '1'; } catch (e) { /* private mode */ }

  function makeEcho(c) {
    const len = Math.floor(c.sampleRate * 1.4);
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    const conv = c.createConvolver();
    conv.buffer = buf;
    return conv;
  }

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 1;
    master.connect(ctx.destination);
    const dry = ctx.createGain(); dry.gain.value = 0.8; dry.connect(master);
    const wet = ctx.createGain(); wet.gain.value = 0.35; wet.connect(master);
    const echo = makeEcho(ctx); echo.connect(wet);
    out = ctx.createGain(); out.gain.value = 0.9;
    out.connect(dry); out.connect(echo);
    return true;
  }

  function panned(dest, pan) {
    if (!ctx.createStereoPanner) return dest;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(dest);
    return p;
  }

  // one sine partial with a fast attack and a ringing decay
  function partial(dest, at, freq, vol, len) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(dest);
    o.start(at);
    o.stop(at + len + 0.05);
  }

  // one shake of sleigh bells: 5 tiny bells spread over 50 ms
  function shake(at, vol) {
    for (let i = 0; i < 5; i++) {
      const t = at + Math.random() * 0.05;
      const f = 3600 + Math.random() * 4200;
      const dest = panned(out, Math.random() * 1.2 - 0.6);
      const len = 0.07 + Math.random() * 0.12;
      const v = vol * (0.5 + Math.random() * 0.5);
      partial(dest, t, f, v, len);
      partial(dest, t, f * 1.52, v * 0.5, len);
    }
  }

  const SFX = {
    unlock: ensure,
    // a mission is finished
    bells() {
      if (muted || !ensure()) return;
      const now = ctx.currentTime + 0.03;
      // sleigh bells only: "chi-chi  chi-chi  chi-chi ..." (pairs of shakes),
      // a bit louder than in the winter mode, since there is no melody on top
      for (let k = 0; k < 5; k++) {
        shake(now + k * 0.26, 0.08);
        shake(now + k * 0.26 + 0.11, 0.055);
      }
    },
    isMuted() { return muted; },
    setMuted(m) {
      muted = m;
      try { localStorage.setItem('bubu-craciun-mute', m ? '1' : '0'); } catch (e) { /* ignore */ }
      if (master) master.gain.value = m ? 0 : 1;
    }
  };

  window.SFX = SFX;
})();
