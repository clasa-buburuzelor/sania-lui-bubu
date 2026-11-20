/*
 * audio.js — all sounds are synthesized with the Web Audio API (no files to
 * download). The context is created on the first click, as browsers require.
 * Optional: digits are spoken with a Romanian voice when the browser has one.
 */
(function () {
  'use strict';

  let ctx = null;
  let master = null;
  let muted = false;
  let noiseBuf = null;
  let roVoice = null;

  try { muted = localStorage.getItem('bubu-craciun-mute') === '1'; } catch (e) { /* private mode */ }

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return true;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    // one second of white noise, reused for snow crunches and munching
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return true;
  }

  function tone(freq, at, dur, type, vol) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + (at || 0);
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.3, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // a small bell: fundamental + a non-harmonic partial
  function bell(freq, at, dur, vol) {
    tone(freq, at, dur, 'sine', vol || 0.25);
    tone(freq * 2.76, at, dur * 0.5, 'sine', (vol || 0.25) * 0.25);
  }

  function noise(at, dur, filterFreq, vol) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime + (at || 0);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = filterFreq || 1200;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(master);
    src.start(t, Math.random() * 0.5);
    src.stop(t + dur + 0.05);
  }

  function slide(from, to, dur, type, vol) {
    if (!ensure() || muted) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(from, t);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol || 0.25, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  // Jingle Bells chorus (traditional, public domain). [semitones from C5, beats]
  const JINGLE = [
    [4, 1], [4, 1], [4, 2], [4, 1], [4, 1], [4, 2],
    [4, 1], [7, 1], [0, 1.5], [2, 0.5], [4, 4],
    [5, 1], [5, 1], [5, 1.5], [5, 0.5], [5, 1], [4, 1], [4, 1], [4, 0.5], [4, 0.5],
    [4, 1], [2, 1], [2, 1], [4, 1], [2, 2], [7, 2]
  ];

  const SFX = {
    unlock: ensure,
    // gift caught
    chime() { bell(1318.5, 0, 0.35, 0.22); bell(1760, 0.08, 0.5, 0.2); },
    // soft "oops" (never a harsh error sound)
    oops() { tone(392, 0, 0.18, 'sine', 0.18); tone(311, 0.14, 0.28, 'sine', 0.16); },
    pop() { slide(500, 1100, 0.12, 'sine', 0.22); },
    // Bubu giggles when she is found: "hi-hi-hi!"
    giggle() { for (let i = 0; i < 5; i++) { tone(1400 - i * 50, i * 0.11, 0.07, 'triangle', 0.18); tone(1050 - i * 50, i * 0.11 + 0.05, 0.06, 'triangle', 0.14); } },
    whoosh() { noise(0, 0.35, 900, 0.12); },
    crunch() { noise(0, 0.18, 2500, 0.28); noise(0.06, 0.14, 1800, 0.18); },
    munch() { for (let i = 0; i < 3; i++) noise(i * 0.16, 0.08, 1400, 0.3); },
    sparkle() { [2093, 2637, 3136, 4186].forEach((f, i) => bell(f, i * 0.05, 0.3, 0.08)); },
    sleighBells() {
      for (let i = 0; i < 14; i++) bell(2200 + Math.random() * 900, i * 0.11 + Math.random() * 0.03, 0.15, 0.07);
    },
    // short fanfare when a stop is finished
    fanfare() { [523, 659, 784, 1047].forEach((f, i) => { tone(f, i * 0.12, 0.35, 'triangle', 0.2); }); bell(2093, 0.5, 0.8, 0.12); },
    step(n) { bell(523.25 * Math.pow(2, ((n || 0) % 12) / 12), 0, 0.3, 0.18); },
    // the owl that flies past: "hu-huu"
    hoot() { slide(430, 380, 0.22, 'sine', 0.2); setTimeout(() => slide(400, 330, 0.45, 'sine', 0.2), 320); },
    // a new piece for the sleigh
    reward() { [784, 988, 1175, 1568].forEach((f, i) => bell(f, i * 0.09, 0.6, 0.18)); },
    // the i-th note of the carol: catching bells one by one plays the song
    note(i) {
      const f = 523.25 * Math.pow(2, JINGLE[i % JINGLE.length][0] / 12);
      bell(f, 0, 0.7, 0.24);
      tone(f / 2, 0, 0.3, 'triangle', 0.06);
    },
    carol() {
      const beat = 0.24;
      let t = 0;
      for (const [semi, len] of JINGLE) {
        const f = 523.25 * Math.pow(2, semi / 12);
        bell(f, t, Math.min(1.2, len * beat * 2.2), 0.2);
        tone(f / 2, t, len * beat * 0.9, 'triangle', 0.05);
        t += len * beat;
      }
      return t;
    },
    isMuted() { return muted; },
    setMuted(m) {
      muted = m;
      try { localStorage.setItem('bubu-craciun-mute', m ? '1' : '0'); } catch (e) { /* ignore */ }
      if (master) master.gain.value = m ? 0 : 0.55;
      if (m && window.speechSynthesis) speechSynthesis.cancel();
    }
  };

  // ---- optional Romanian voice for numbers ----
  const WORDS = ['zero', 'unu', 'doi', 'trei', 'patru', 'cinci', 'șase', 'șapte', 'opt', 'nouă', 'zece',
    'unsprezece', 'doisprezece', 'treisprezece', 'paisprezece', 'cincisprezece'];
  function pickVoice() {
    if (!window.speechSynthesis) return;
    roVoice = speechSynthesis.getVoices().find(v => /^ro(-|_|$)/i.test(v.lang)) || null;
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', pickVoice);
  }
  SFX.sayNumber = function (n) {
    if (muted || !roVoice || !WORDS[n]) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(WORDS[n]);
    u.voice = roVoice;
    u.lang = roVoice.lang;
    u.rate = 0.9;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  };

  window.SFX = SFX;
})();
