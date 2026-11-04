/**
 * panel-b-bondi.js — Panel B, pestaña B.4: Radar de Bondi y Paradoja de los Gemelos
 *
 * Idea: el Viajero envía un destello de luz por cada año de SU reloj.
 *   - Alejándose, Gema los recibe separados por K años        (K = √((1+β)/(1−β)) > 1, rojo)
 *   - Acercándose, Gema los recibe separados por 1/K años     (destellos juntos, azul)
 * Con solo esto: γ = ½(K + 1/K)  y  Δs² invariante.
 *
 * Unidades: c = 1 (tiempo en años, distancia en años-luz). Giro instantáneo en la estrella.
 *   Evento de emisión nº s (tiempo propio s):  t_e = γ·s,  x_e = x(t_e)
 *   Llegada a Gema (x = 0):                    t_r = t_e + x_e
 *
 * Es independiente de panel-b.js: solo lee el slider global β (#global-beta-slider).
 */
(function () {
  'use strict';

  const canvas = document.getElementById('canvas-bondi');
  const slider = document.getElementById('global-beta-slider');
  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d');
  const $ = (id) => document.getElementById(id);

  const COL = {
    bg:     '#09111e',
    grid:   'rgba(255,255,255,0.05)',
    axis:   'rgba(255,255,255,0.35)',
    text:   '#e2e8f0',
    muted:  'rgba(255,255,255,0.55)',
    earth:  '#4f9eff',
    trav:   '#a78bfa',
    out:    '#f87171',   // ida  (K)
    ret:    '#60a5fa',   // vuelta (1/K)
    amber:  '#fbbf24',
  };

  const DURATION = 16;   // segundos reales que dura la animación completa

  const st = {
    beta: parseFloat(slider.value) || 0.6,
    n: 3,                // años propios por tramo
    t: 0,                // tiempo de Gema mostrado
    running: false,
    paused: false,
    last: 0,
    raf: null,
  };

  /* ───────────── Modelo físico ───────────── */
  function model() {
    const b = Math.min(0.9995, Math.max(0, st.beta));
    const K = Math.sqrt((1 + b) / (1 - b));
    const g = (K + 1 / K) / 2;
    const n = st.n;
    return { b, K, g, n, tTurn: g * n, xMax: b * g * n, tEnd: 2 * g * n };
  }

  function posAt(t, m) {
    return t <= m.tTurn ? m.b * t : Math.max(0, m.xMax - m.b * (t - m.tTurn));
  }

  function flashes(m) {
    const list = [];
    for (let s = 1; s <= 2 * m.n; s++) {
      const te = m.g * s;
      const x = posAt(te, m);
      list.push({ s, te, x, tr: te + x, out: s <= m.n });
    }
    return list;
  }

  function niceStep(range) {
    const raw = Math.max(range, 0.0001) / 7;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const f = raw / p;
    return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
  }

  /* ───────────── Tabla y textos ───────────── */
  function updateTable(m) {
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    const invK = 1 / m.K;
    const tOut = m.n * m.K;
    const tRet = m.n * invK;
    set('b4-k',        m.K.toFixed(4));
    set('b4-invk',     invK.toFixed(4));
    set('b4-gamma',    m.g.toFixed(4));
    set('b4-gap-out',  `${m.K.toFixed(2)} años`);
    set('b4-gap-ret',  `${invK.toFixed(3)} años`);
    set('b4-t-out',    `${tOut.toFixed(2)} años`);
    set('b4-t-ret',    `${tRet.toFixed(3)} años`);
    set('b4-t-total',  `${(tOut + tRet).toFixed(2)} años`);
    set('b4-tau-total', `${2 * m.n} años`);
    set('b4-n-label',  `n = ${m.n} años`);

    const pct = (tOut / (tOut + tRet)) * 100;
    const v = $('b4-verdict');
    if (v) {
      v.innerHTML =
        `✓ Al reencontrarse: <strong>Viajero cumplió ${2 * m.n} años</strong> y ` +
        `<strong>Gema ${(tOut + tRet).toFixed(2)} años</strong> (= 2γn, con γ = ${m.g.toFixed(3)}). ` +
        `Gema recibió señales «lentas» (K) durante el <strong>${pct.toFixed(1)}%</strong> de su espera: ` +
        `el <em>giro</em> del Viajero rompe la simetría.`;
    }

    // preset activo
    const pr = $('presets-b4');
    if (pr) {
      pr.querySelectorAll('.preset-btn').forEach((btn) => {
        const bb = parseFloat(btn.dataset.beta);
        btn.classList.toggle('active-preset', Math.abs(bb - st.beta) < 0.004);
      });
    }
  }

  function updateLive(m, fl, t, tau) {
    const set = (id, v) => { const e = $(id); if (e) e.textContent = v; };
    const cOut = fl.filter((f) => f.out && f.tr <= t + 1e-9).length;
    const cRet = fl.filter((f) => !f.out && f.tr <= t + 1e-9).length;
    set('b4-clock-earth', `${t.toFixed(2)} años`);
    set('b4-clock-trav',  `${tau.toFixed(2)} años`);
    set('b4-count-out',   `${cOut} / ${m.n}`);
    set('b4-count-ret',   `${cRet} / ${m.n}`);
  }

  /* ───────────── Dibujo ───────────── */
  function resize() {
    const w = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
    if (w > 0) {
      canvas.width = w;
      canvas.height = w < 620 ? 380 : 440;
    }
  }

  function drawSpacetime(m, fl, t, splitX, H) {
    const ml = 58, mr = 16, mt = 44, mb = 52;
    const pw = splitX - ml - mr;
    const ph = H - mt - mb;
    const sc = Math.min(ph / (m.tEnd * 1.04), pw / (Math.max(m.xMax, 0.05) * 1.12));
    const X = (x) => ml + x * sc;
    const Y = (tt) => H - mb - tt * sc;

    ctx.fillStyle = COL.text;
    ctx.font = 'bold 11.5px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Diagrama espacio-tiempo (c = 1)', 12, 20);
    ctx.fillStyle = COL.muted;
    ctx.font = '10px Consolas, monospace';
    ctx.fillText('ct (años) ↑    x (años-luz) →', 12, 35);

    // Rejilla y ticks
    ctx.lineWidth = 1;
    ctx.strokeStyle = COL.grid;
    ctx.fillStyle = COL.muted;
    ctx.font = '10px Consolas, monospace';
    const stepT = niceStep(m.tEnd);
    ctx.textAlign = 'right';
    for (let v = 0; v <= m.tEnd * 1.02; v += stepT) {
      ctx.beginPath(); ctx.moveTo(ml, Y(v)); ctx.lineTo(ml + pw, Y(v)); ctx.stroke();
      ctx.fillText(Number(v.toFixed(2)).toString(), ml - 6, Y(v) + 3);
    }
    const stepX = niceStep(Math.max(m.xMax, 0.5));
    ctx.textAlign = 'center';
    for (let v = 0; v * sc <= pw; v += stepX) {
      ctx.beginPath(); ctx.moveTo(X(v), Y(0)); ctx.lineTo(X(v), Y(m.tEnd * 1.02)); ctx.stroke();
      ctx.fillText(Number(v.toFixed(2)).toString(), X(v), H - mb + 14);
    }

    // Línea de mundo de Gema
    ctx.strokeStyle = COL.earth;
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(m.tEnd)); ctx.stroke();
    ctx.fillStyle = COL.earth;
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Gema', X(0), H - mb + 32);

    // Trayectoria completa del Viajero (tenue) y recorrida (sólida)
    ctx.save();
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = 'rgba(167,139,250,0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(m.xMax), Y(m.tTurn)); ctx.lineTo(X(0), Y(m.tEnd));
    ctx.stroke();
    ctx.restore();

    const xNow = posAt(t, m);
    ctx.strokeStyle = COL.trav;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(X(0), Y(0));
    if (t > m.tTurn) ctx.lineTo(X(m.xMax), Y(m.tTurn));
    ctx.lineTo(X(xNow), Y(t));
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('giro', X(m.xMax) + 6, Y(m.tTurn) + 3);

    // Destellos
    fl.forEach((f) => {
      if (t < f.te - 1e-9) return;
      const col = f.out ? COL.out : COL.ret;
      const arrived = t >= f.tr - 1e-9;
      ctx.strokeStyle = col;
      ctx.lineWidth = arrived ? 1.2 : 2;
      ctx.globalAlpha = arrived ? 0.45 : 0.95;
      ctx.beginPath();
      ctx.moveTo(X(f.x), Y(f.te));
      if (arrived) {
        ctx.lineTo(X(0), Y(f.tr));
      } else {
        const head = f.x - (t - f.te);
        ctx.lineTo(X(head), Y(t));
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(X(f.x), Y(f.te), 3.2, 0, Math.PI * 2); ctx.fill();
      if (arrived) {
        ctx.beginPath(); ctx.arc(X(0), Y(f.tr), 3.6, 0, Math.PI * 2); ctx.fill();
      }
    });

    // Línea de "ahora" para Gema y marcador del Viajero
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(251,191,36,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X(0), Y(t)); ctx.lineTo(X(xNow), Y(t)); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = COL.amber;
    ctx.beginPath(); ctx.arc(X(0), Y(t), 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COL.trav;
    ctx.shadowColor = COL.trav; ctx.shadowBlur = 12;
    ctx.beginPath(); ctx.arc(X(xNow), Y(t), 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  function drawTimelines(m, fl, t, tau, splitX, W, H) {
    const rx0 = splitX + 40;
    const rx1 = W - 26;
    const rw = Math.max(80, rx1 - rx0);
    const yTop = 92;
    const yBot = H - 150;
    const XT = (s) => rx0 + (s / (2 * m.n)) * rw;     // eje del Viajero (tiempo propio)
    const XE = (tt) => rx0 + (tt / m.tEnd) * rw;       // eje de Gema (tiempo de la Tierra)

    // Títulos
    ctx.textAlign = 'left';
    ctx.fillStyle = COL.trav;
    ctx.font = 'bold 11.5px Segoe UI, sans-serif';
    ctx.fillText('⏱ Viajero emite 1 destello por año propio', rx0, 22);
    ctx.fillStyle = COL.muted;
    ctx.font = '10px Consolas, monospace';
    ctx.fillText('(emisión pareja: uno cada 1 año)', rx0, 37);

    // Barra del Viajero
    ctx.strokeStyle = COL.trav;
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(rx0, yTop); ctx.lineTo(rx1, yTop); ctx.stroke();
    ctx.fillStyle = COL.muted;
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    for (let s = 0; s <= 2 * m.n; s++) {
      ctx.fillText(String(s), XT(s), yTop - 10);
    }
    ctx.fillText('años propios (Viajero)', rx0 + rw / 2, yTop - 24);

    // Barra de Gema
    ctx.strokeStyle = COL.earth;
    ctx.beginPath(); ctx.moveTo(rx0, yBot); ctx.lineTo(rx1, yBot); ctx.stroke();
    const stepE = niceStep(m.tEnd);
    ctx.fillStyle = COL.muted;
    for (let v = 0; v <= m.tEnd * 1.001; v += stepE) {
      ctx.fillText(Number(v.toFixed(2)).toString(), XE(v), yBot + 16);
    }
    ctx.fillText('años de la Tierra (Gema)', rx0 + rw / 2, yBot + 31);
    ctx.fillStyle = COL.earth;
    ctx.font = 'bold 11.5px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👀 Gema recibe esos mismos destellos así:', rx0, yBot + 50);

    // Líneas que unen "cuándo se emite" con "cuándo se recibe"
    fl.forEach((f) => {
      if (t < f.te - 1e-9) return;
      const col = f.out ? COL.out : COL.ret;
      const x1 = XT(f.s), x2 = XE(f.tr);
      const arrived = t >= f.tr - 1e-9;
      const p = arrived ? 1 : Math.max(0, (t - f.te) / Math.max(f.tr - f.te, 1e-9));
      ctx.strokeStyle = col;
      ctx.lineWidth = arrived ? 1.2 : 2;
      ctx.globalAlpha = arrived ? 0.6 : 0.95;
      ctx.beginPath();
      ctx.moveTo(x1, yTop);
      ctx.lineTo(x1 + (x2 - x1) * p, yTop + (yBot - yTop) * p);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x1, yTop, 3.6, 0, Math.PI * 2); ctx.fill();
      if (arrived) { ctx.beginPath(); ctx.arc(x2, yBot, 3.8, 0, Math.PI * 2); ctx.fill(); }
    });

    // Cursores de "ahora"
    ctx.strokeStyle = COL.amber;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(XT(tau), yTop - 6); ctx.lineTo(XT(tau), yTop + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(XE(t), yBot - 6); ctx.lineTo(XE(t), yBot + 6); ctx.stroke();

    // Leyenda
    ctx.textAlign = 'left';
    ctx.font = '11px Consolas, monospace';
    ctx.fillStyle = COL.out;
    ctx.fillText(`● Ida: Gema recibe uno cada K = ${m.K.toFixed(2)} años`, rx0, H - 30);
    ctx.fillStyle = COL.ret;
    ctx.fillText(`● Vuelta: uno cada 1/K = ${(1 / m.K).toFixed(3)} años`, rx0, H - 12);
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    const m = model();
    const fl = flashes(m);
    const t = Math.min(Math.max(st.t, 0), m.tEnd);
    const tau = t / m.g;

    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);
    const splitX = Math.min(W * 0.42, 380);
    drawSpacetime(m, fl, t, splitX, H);
    drawTimelines(m, fl, t, tau, splitX, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(splitX + 12, 10); ctx.lineTo(splitX + 12, H - 10); ctx.stroke();
    ctx.setLineDash([]);

    updateLive(m, fl, t, tau);
  }

  /* ───────────── Animación ───────────── */
  function setButtons(playing) {
    const play = $('btn-b4-play'), pause = $('btn-b4-pause');
    if (play) {
      play.disabled = playing;
      play.innerHTML = playing
        ? '<span class="btn-icon">⏸</span> Viajando…'
        : '<span class="btn-icon">▶</span> Reproducir viaje';
    }
    if (pause) pause.disabled = !playing;
  }

  function stop() {
    cancelAnimationFrame(st.raf);
    st.running = false;
    st.paused = false;
    setButtons(false);
  }

  function showFinal() {
    stop();
    st.t = model().tEnd;
    updateTable(model());
    draw();
  }

  function loop(ts) {
    if (!st.running || st.paused) return;
    if (!st.last) st.last = ts;
    const dt = (ts - st.last) / 1000;
    st.last = ts;
    const m = model();
    st.t += dt * (m.tEnd / DURATION);
    if (st.t >= m.tEnd) {
      st.t = m.tEnd;
      draw();
      stop();
      return;
    }
    draw();
    st.raf = requestAnimationFrame(loop);
  }

  function play() {
    const m = model();
    if (st.running && !st.paused) return;
    if (!st.paused) st.t = 0;       // nuevo viaje; si estaba en pausa, continúa
    st.running = true;
    st.paused = false;
    st.last = performance.now();
    setButtons(true);
    st.raf = requestAnimationFrame(loop);
    void m;
  }

  function pause() {
    if (!st.running || st.paused) return;
    st.paused = true;
    cancelAnimationFrame(st.raf);
    const p = $('btn-b4-play');
    if (p) { p.disabled = false; p.innerHTML = '<span class="btn-icon">▶</span> Continuar'; }
    const q = $('btn-b4-pause');
    if (q) q.disabled = true;
  }

  /* ───────────── Eventos ───────────── */
  const tabBtn = document.querySelector('.tab-btn[data-tab="tab-bondi"]');
  if (tabBtn) {
    tabBtn.addEventListener('click', () => {
      requestAnimationFrame(() => { resize(); draw(); });
    });
  }
  window.addEventListener('resize', () => requestAnimationFrame(() => { resize(); draw(); }));

  slider.addEventListener('input', () => {
    st.beta = parseFloat(slider.value) || 0;
    showFinal();
  });

  const pr = $('presets-b4');
  if (pr) {
    pr.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        slider.value = btn.dataset.beta;
        slider.dispatchEvent(new Event('input'));   // panel-b.js actualiza sus etiquetas
      });
    });
  }

  const legSel = $('b4-leg');
  if (legSel) {
    legSel.addEventListener('change', () => {
      st.n = parseInt(legSel.value, 10) || 3;
      showFinal();
    });
    st.n = parseInt(legSel.value, 10) || 3;
  }

  const bPlay = $('btn-b4-play'), bPause = $('btn-b4-pause'), bEnd = $('btn-b4-end');
  if (bPlay)  bPlay.addEventListener('click', play);
  if (bPause) bPause.addEventListener('click', pause);
  if (bEnd)   bEnd.addEventListener('click', showFinal);

  /* ───────────── Init ───────────── */
  resize();
  st.t = model().tEnd;      // al abrir se ve el resultado completo; ▶ lo reproduce
  setButtons(false);
  updateTable(model());
  draw();
})();
