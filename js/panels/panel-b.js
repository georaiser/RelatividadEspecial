/**
 * panel-b.js — Panel B: Transformaciones de Lorentz
 *
 * Submódulos:
 *  B.1 Coordenadas  — transforma (x,t) → (x',t'). Canvas: mini Minkowski con ejes K y K'.
 *  B.2 Simultaneidad — dos eventos. Canvas: diagrama de Minkowski con líneas de simultaneidad.
 *  B.3 Intervalo    — Δs² invariante. Canvas: gráfica Δs² vs β (curva plana).
 *
 * Depende de: js/physics/lorentz.js
 *
 * Correcciones sobre versión anterior:
 *  - B.1: escala dinámica para evitar desbordamiento del canvas
 *  - B.1: canvas ahora es un diagrama de Minkowski real con ejes K' inclinados
 *  - B.2: escala compartida entre S y S' para comparación directa
 *  - B.2: canvas muestra líneas de simultaneidad (no solo ejes de tiempo)
 *  - B.3: Δs² se verifica correctamente entre los dos eventos de B.2
 *  - General: presets pedagógicos, factor k de Bondi, tipos de intervalo con color
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     ESTADO COMPARTIDO
  ══════════════════════════════════════════════════════════ */
  const state = {
    beta: 0.6,
    E:  { x: 3.0, t: 2.0 },   // evento único (B.1)
    A:  { x: -2.0, t: 0.0 },  // evento A (B.2 y B.3)
    B:  { x:  2.0, t: 0.0 },  // evento B (B.2 y B.3)
  };

  /* ── Helpers numéricos ─────────────────────────────────── */
  const fmt  = (v, d = 4) => isNaN(v) ? '—' : Number(v.toFixed(d)).toString();
  const bondik = (β) => Math.sqrt((1 + β) / (1 - β));
  const EPS  = 1e-9;

  function causalType(ds2) {
    const c = Lorentz.classifyInterval(ds2);
    if (c === 'temporal') return { label: 'Tipo temporal (causal)', color: '#4f9eff' };
    if (c === 'luz')      return { label: 'Tipo luz (nulo)',        color: '#fde047' };
    return                       { label: 'Tipo espacial',         color: '#a78bfa' };
  }

  /* ══════════════════════════════════════════════════════════
     TABS
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
      // Wait one frame so the display:none is removed before measuring clientWidth
      requestAnimationFrame(() => { resizeAll(); redrawAll(); });
    });
  });


  /* ══════════════════════════════════════════════════════════
     VELOCITY BAR
  ══════════════════════════════════════════════════════════ */
  const sliderEl = document.getElementById('global-beta-slider');
  const betaLbl  = document.getElementById('beta-label');
  const gammaLbl = document.getElementById('gamma-label');
  const kLbl     = document.getElementById('k-label');

  sliderEl.addEventListener('input', () => {
    state.beta = parseFloat(sliderEl.value);
    updateVelocityBar();
    updateAll();
  });

  function updateVelocityBar() {
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const k = bondik(β);
    betaLbl.textContent  = `β = ${β.toFixed(3)}`;
    gammaLbl.textContent = γ.toFixed(4);
    kLbl.textContent     = `k = ${k.toFixed(4)}`;
  }

  /* ══════════════════════════════════════════════════════════
     B.1 — COORDENADAS
  ══════════════════════════════════════════════════════════ */
  const sXInput = document.getElementById('s-x');
  const sTInput = document.getElementById('s-t');
  const spXOut  = document.getElementById('sp-x');
  const spTOut  = document.getElementById('sp-t');
  const sLbl    = document.getElementById('s-event-label');
  const spLbl   = document.getElementById('sp-event-label');
  const sDs2El  = document.getElementById('s-ds2-display');
  const spDs2El = null; // eliminado del nuevo layout
  const invChk  = null; // eliminado del nuevo layout
  const sCausal = document.getElementById('s-causal-type');

  // Tabla de factores B.1 (nuevos IDs)
  const tblBeta      = document.getElementById('b1-beta');
  const tblGamma     = document.getElementById('b1-gamma');
  const tblGammaBeta = document.getElementById('b1-gammabeta');
  const tblK         = document.getElementById('b1-k');
  const tblXp        = null; // eliminado del nuevo layout
  const tblTp        = null; // eliminado del nuevo layout
  const tblDs2       = null; // eliminado del nuevo layout

  sXInput.addEventListener('input', () => { state.E.x = parseFloat(sXInput.value) || 0; updateCoords(); drawMinkowski(); });
  sTInput.addEventListener('input', () => { state.E.t = parseFloat(sTInput.value) || 0; updateCoords(); drawMinkowski(); });

  // Presets B.1
  document.getElementById('presets-b1').querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('presets-b1').querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
      btn.classList.add('active-preset');
      state.E.x = parseFloat(btn.dataset.x);
      state.E.t = parseFloat(btn.dataset.t);
      sXInput.value = state.E.x;
      sTInput.value = state.E.t;
      updateCoords();
      drawMinkowski();
    });
  });

  function updateCoords() {
    const { x, t } = state.E;
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const k = bondik(β);
    const { x: xp, t: tp } = Lorentz.transform(x, t, β);

    // Δs² desde el origen hasta el evento
    const ds2  = Lorentz.spacetimeInterval(x, t);
    const ds2p = Lorentz.spacetimeInterval(xp, tp);
    const ct   = causalType(ds2);
    const inv  = Math.abs(ds2 - ds2p) < 1e-7;

    spXOut.textContent = fmt(xp);
    spTOut.textContent = fmt(tp);
    sLbl.textContent   = `E = (${fmt(x, 2)}, ${fmt(t, 2)})`;
    spLbl.textContent  = `E = (${fmt(xp, 3)}, ${fmt(tp, 3)})`;

    sDs2El.textContent = fmt(ds2, 4);
    if (spDs2El) { spDs2El.textContent = fmt(ds2p, 4); spDs2El.style.color = ct.color; }
    sDs2El.style.color  = ct.color;
    sCausal.textContent = ct.label;
    sCausal.style.background = ct.color + '22';
    sCausal.style.color      = ct.color;
    if (invChk) { invChk.textContent = inv ? '✓ invariante' : '✗ error'; invChk.style.color = inv ? '#34d399' : '#f87171'; }

    if (tblBeta)      tblBeta.textContent      = β.toFixed(4);
    if (tblGamma)     tblGamma.textContent     = γ.toFixed(4);
    if (tblGammaBeta) tblGammaBeta.textContent = (γ * β).toFixed(4);
    if (tblK)         tblK.textContent         = k.toFixed(4);
    if (tblXp)        tblXp.textContent        = fmt(xp);
    if (tblTp)        tblTp.textContent        = fmt(tp);
    if (tblDs2)       tblDs2.textContent       = fmt(ds2);
  }


  /* ── Canvas B.1: Diagrama de Minkowski mini ─────────────
     Ejes K: x horizontal, t vertical (c=1 → ct = t)
     Ejes K': x'-axis t = β·x;  t'-axis x = β·t
             inclinados hacia el cono de luz a medida que β→1
     Cono de luz: t = ±x  (45° con c=1)
     Punto E marcado como dot, con líneas de proyección
  ────────────────────────────────────────────────────────── */
  const coordCanvas = document.getElementById('coord-canvas');
  const ctx1        = coordCanvas.getContext('2d');

  function resizeCoordCanvas() {
    coordCanvas.width  = coordCanvas.parentElement.clientWidth;
    coordCanvas.height = 440;
    drawMinkowski();
  }


  function drawMinkowski() {
    const W = coordCanvas.width;
    const H = coordCanvas.height;
    const β = state.beta;
    const { x: Ex, t: Et } = state.E;
    const { x: Exp, t: Etp } = Lorentz.transform(Ex, Et, β);

    // Autoscale: the diagram should show the event and a comfortable margin
    const raw = Math.max(Math.abs(Ex), Math.abs(Et), Math.abs(Exp), Math.abs(Etp), 2) * 1.4;
    const RANGE = Math.ceil(raw) + 1;

    // Márgenes
    const ML = 55, MR = 30, MT = 30, MB = 45;
    const PW = W - ML - MR;
    const PH = H - MT - MB;

    // Origin at center-bottom shifted up to show negative t slightly
    const OX = ML + PW / 2;
    const OY = MT + PH * 0.85;  // 85% down → more space for future (t>0)

    // Coordinate → pixel
    const toPx = (x, t) => ({
      px: OX + (x / RANGE) * (PW / 2),
      py: OY - (t / RANGE) * (PH * 0.85),
    });

    ctx1.fillStyle = '#09111e';
    ctx1.fillRect(0, 0, W, H);

    // ── Grid lines ───────────────────────────────────────
    ctx1.save();
    ctx1.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx1.lineWidth = 1;
    for (let v = -RANGE; v <= RANGE; v++) {
      const { px: lx, py: ly } = toPx(v, -RANGE);
      const { px: rx, py: ry } = toPx(v,  RANGE);
      ctx1.beginPath(); ctx1.moveTo(lx, ly); ctx1.lineTo(rx, ry); ctx1.stroke();
      const { px: tx, py: ty } = toPx(-RANGE, v);
      const { px: bx, py: by } = toPx( RANGE, v);
      ctx1.beginPath(); ctx1.moveTo(tx, ty); ctx1.lineTo(bx, by); ctx1.stroke();
    }
    ctx1.restore();

    // ── Light cone (45° lines: t = ±x) ──────────────────
    ctx1.save();
    ctx1.strokeStyle = 'rgba(253,224,71,0.35)';
    ctx1.lineWidth = 1.2; ctx1.setLineDash([5, 4]);
    const { px: lc1x, py: lc1y } = toPx(-RANGE, -RANGE);
    const { px: rc1x, py: rc1y } = toPx( RANGE,  RANGE);
    ctx1.beginPath(); ctx1.moveTo(lc1x, lc1y); ctx1.lineTo(rc1x, rc1y); ctx1.stroke();
    const { px: lc2x, py: lc2y } = toPx( RANGE, -RANGE);
    const { px: rc2x, py: rc2y } = toPx(-RANGE,  RANGE);
    ctx1.beginPath(); ctx1.moveTo(lc2x, lc2y); ctx1.lineTo(rc2x, rc2y); ctx1.stroke();
    ctx1.setLineDash([]);
    // Label
    const { px: lbx, py: lby } = toPx(RANGE * 0.55, RANGE * 0.55);
    ctx1.fillStyle = 'rgba(253,224,71,0.5)'; ctx1.font = '10px Consolas,monospace';
    ctx1.textAlign = 'left'; ctx1.fillText('c', lbx + 4, lby - 4);
    ctx1.restore();

    // ── K' axes: x'-axis (t = β·x) and t'-axis (x = β·t) ─
    if (β > EPS) {
      ctx1.save();
      ctx1.strokeStyle = 'rgba(167,139,250,0.4)';
      ctx1.lineWidth = 1.2;

      // x'-axis: t = β·x  → from (-RANGE, -β*RANGE) to (RANGE, β*RANGE)
      const { px: xa1, py: ya1 } = toPx(-RANGE, -β * RANGE);
      const { px: xa2, py: ya2 } = toPx( RANGE,  β * RANGE);
      ctx1.beginPath(); ctx1.moveTo(xa1, ya1); ctx1.lineTo(xa2, ya2); ctx1.stroke();

      // t'-axis: x = β·t → from (-β*RANGE, -RANGE) to (β*RANGE, RANGE)
      const { px: ta1, py: tb1 } = toPx(-β * RANGE, -RANGE);
      const { px: ta2, py: tb2 } = toPx( β * RANGE,  RANGE);
      ctx1.beginPath(); ctx1.moveTo(ta1, tb1); ctx1.lineTo(ta2, tb2); ctx1.stroke();

      ctx1.restore();

      // Axis labels
      ctx1.save();
      ctx1.fillStyle = 'rgba(167,139,250,0.8)';
      ctx1.font = 'bold 11px Segoe UI, sans-serif';
      const { px: xl, py: yl } = toPx(RANGE * 0.75, β * RANGE * 0.75);
      const { px: tl, py: tll } = toPx(β * RANGE * 0.6, RANGE * 0.55);
      ctx1.textAlign = 'center'; ctx1.fillText("x'", xl, yl + 14);
      ctx1.textAlign = 'right';  ctx1.fillText("t'", tl - 6, tll);
      ctx1.restore();
    }

    // ── K axes (main: solid) ─────────────────────────────
    ctx1.save();
    ctx1.strokeStyle = 'rgba(79,158,255,0.7)';
    ctx1.lineWidth = 1.5;
    // x-axis
    const { px: ax1, py: ay1 } = toPx(-RANGE, 0);
    const { px: ax2, py: ay2 } = toPx( RANGE, 0);
    ctx1.beginPath(); ctx1.moveTo(ax1, ay1); ctx1.lineTo(ax2, ay2); ctx1.stroke();
    // t-axis
    const { px: tx1, py: ty1 } = toPx(0, -RANGE * 0.3);
    const { px: tx2, py: ty2 } = toPx(0,  RANGE);
    ctx1.beginPath(); ctx1.moveTo(tx1, ty1); ctx1.lineTo(tx2, ty2); ctx1.stroke();
    ctx1.restore();

    // Axis tick marks & labels
    ctx1.save();
    ctx1.fillStyle = 'rgba(79,158,255,0.5)';
    ctx1.font = '9px Consolas, monospace';
    for (let v = -RANGE + 1; v < RANGE; v++) {
      if (v === 0) continue;
      const { px: xTick } = toPx(v, 0);
      const { py: yTick } = toPx(0, v);
      // x-axis tick
      ctx1.fillRect(xTick - 0.5, OY - 3, 1, 6);
      if (v % 2 === 0) {
        ctx1.textAlign = 'center';
        ctx1.fillText(v, xTick, OY + 14);
      }
      // t-axis tick (only positive)
      if (v > 0) {
        ctx1.fillRect(OX - 3, yTick - 0.5, 6, 1);
        ctx1.textAlign = 'right';
        ctx1.fillText(v, OX - 6, yTick + 4);
      }
    }
    ctx1.restore();

    // Axis arrows & labels
    ctx1.save();
    ctx1.fillStyle = 'rgba(79,158,255,0.8)';
    ctx1.font = 'bold 12px Segoe UI, sans-serif';
    ctx1.textAlign = 'left'; ctx1.fillText('x', ax2 - 10, ay2 + 16);
    ctx1.textAlign = 'right'; ctx1.fillText('t (=ct)', tx2 + 30, ty2);
    ctx1.restore();

    // ── Proyecciones de E hacia los ejes de K (Azul) ─────────
    const { px: epx, py: epy } = toPx(Ex, Et);
    const { px: pxAxis }   = toPx(Ex, 0);
    const { py: ptAxis }   = toPx(0, Et);

    ctx1.save();
    ctx1.strokeStyle = 'rgba(79,158,255,0.45)';
    ctx1.lineWidth = 1.2; ctx1.setLineDash([4, 3]);
    ctx1.beginPath();
    ctx1.moveTo(epx, epy); ctx1.lineTo(epx, OY); ctx1.stroke();  // hacia eje x
    ctx1.moveTo(epx, epy); ctx1.lineTo(OX, epy); ctx1.stroke();  // hacia eje t
    ctx1.setLineDash([]);
    ctx1.restore();

    // ── Proyecciones de E hacia los ejes de K' (Violeta) ──────
    if (β > EPS) {
      const γ = Lorentz.gamma(β);
      // 1. Proyección paralela al eje t' (dirección β, 1) hasta el eje x' (t = β·x)
      const x_int_xp = γ * Exp;
      const t_int_xp = β * x_int_xp;
      const p_xp = toPx(x_int_xp, t_int_xp);

      // 2. Proyección paralela al eje x' (dirección 1, β) hasta el eje t' (x = β·t)
      const t_int_tp = γ * Etp;
      const x_int_tp = β * t_int_tp;
      const p_tp = toPx(x_int_tp, t_int_tp);

      ctx1.save();
      ctx1.strokeStyle = 'rgba(167,139,250,0.55)';
      ctx1.lineWidth = 1.2; ctx1.setLineDash([4, 3]);
      ctx1.beginPath();
      ctx1.moveTo(epx, epy); ctx1.lineTo(p_xp.px, p_xp.py); ctx1.stroke(); // hacia eje x'
      ctx1.moveTo(epx, epy); ctx1.lineTo(p_tp.px, p_tp.py); ctx1.stroke(); // hacia eje t'
      ctx1.setLineDash([]);

      // Puntos de intersección en ejes K'
      ctx1.fillStyle = '#a78bfa';
      ctx1.beginPath(); ctx1.arc(p_xp.px, p_xp.py, 3.5, 0, Math.PI * 2); ctx1.fill();
      ctx1.beginPath(); ctx1.arc(p_tp.px, p_tp.py, 3.5, 0, Math.PI * 2); ctx1.fill();

      // Etiquetas en los ejes K'
      ctx1.font = 'bold 9px Consolas, monospace';
      ctx1.textAlign = 'left';
      ctx1.fillText(`x'=${fmt(Exp, 2)}`, p_xp.px + 5, p_xp.py + 10);
      ctx1.textAlign = 'right';
      ctx1.fillText(`t'=${fmt(Etp, 2)}`, p_tp.px - 6, p_tp.py);
      ctx1.restore();
    }

    // ── Evento Único E en el Espacio-Tiempo (Invariante) ─────
    ctx1.save();
    ctx1.fillStyle   = '#38bdf8';
    ctx1.strokeStyle = '#ffffff'; ctx1.lineWidth = 2.5;
    ctx1.beginPath(); ctx1.arc(epx, epy, 9, 0, Math.PI * 2);
    ctx1.fill(); ctx1.stroke();

    ctx1.fillStyle = '#0f172a'; ctx1.font = 'bold 10px Segoe UI, sans-serif';
    ctx1.textAlign = 'center'; ctx1.fillText('E', epx, epy + 3.5);
    ctx1.restore();

    // Coordenadas de K en los ejes
    ctx1.save();
    ctx1.fillStyle = '#4f9eff'; ctx1.font = 'bold 10px Consolas, monospace';
    ctx1.textAlign = 'center';
    ctx1.fillText(`x=${fmt(Ex, 1)}`, pxAxis, OY + 22);
    ctx1.textAlign = 'right';
    ctx1.fillText(`t=${fmt(Et, 1)}`, OX - 8, epy + 4);
    ctx1.restore();

    // Etiqueta flotante del evento con ambas lecturas
    ctx1.save();
    ctx1.fillStyle = '#ffffff'; ctx1.font = 'bold 11px Segoe UI, sans-serif';
    ctx1.textAlign = 'left';
    ctx1.fillText(`Evento E`, epx + 14, epy - 10);
    ctx1.fillStyle = '#4f9eff'; ctx1.font = '10px Consolas, monospace';
    ctx1.fillText(`K : (${fmt(Ex, 2)}, ${fmt(Et, 2)})`, epx + 14, epy + 4);
    if (β > EPS) {
      ctx1.fillStyle = '#a78bfa';
      ctx1.fillText(`K': (${fmt(Exp, 2)}, ${fmt(Etp, 2)})`, epx + 14, epy + 17);
    }
    ctx1.restore();

    // Pie de gráfica
    ctx1.save();
    ctx1.fillStyle = 'rgba(255,255,255,0.3)';
    ctx1.font = '10px Segoe UI, sans-serif'; ctx1.textAlign = 'center';
    ctx1.fillText(`Diagrama de Minkowski · Un solo evento E proyectado en K (azul) y K' (violeta) · β = ${β.toFixed(3)}`, W / 2, H - 8);
    ctx1.restore();
  }

  /* ══════════════════════════════════════════════════════════
     B.2 — SIMULTANEIDAD
  ══════════════════════════════════════════════════════════ */
  const simAx = document.getElementById('sim-ax');
  const simAt = document.getElementById('sim-at');
  const simBx = document.getElementById('sim-bx');
  const simBt = document.getElementById('sim-bt');

  const simDtS   = document.getElementById('sim-dt-s');
  const simDtSp  = document.getElementById('sim-dt-sp');
  const simDxS   = document.getElementById('sim-dx-s');
  const simDxSp  = document.getElementById('sim-dx-sp');
  const simVS    = document.getElementById('sim-verdict-s');
  const simVSp   = document.getElementById('sim-verdict-sp');
  const simExpl  = document.getElementById('sim-explanation');

  function readSimEvents() {
    state.A = { x: parseFloat(simAx.value) || 0, t: parseFloat(simAt.value) || 0 };
    state.B = { x: parseFloat(simBx.value) || 0, t: parseFloat(simBt.value) || 0 };
  }

  [simAx, simAt, simBx, simBt].forEach(el => {
    el.addEventListener('input', () => {
      readSimEvents();
      updateSimul();
      updateInterval();          // B.3 también se actualiza
      drawSimulCanvas();
      drawIntervalCanvas();
    });
  });

  // Presets B.2
  document.getElementById('presets-b2').querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('presets-b2').querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
      btn.classList.add('active-preset');
      simAx.value = btn.dataset.ax; simAt.value = btn.dataset.at;
      simBx.value = btn.dataset.bx; simBt.value = btn.dataset.bt;
      readSimEvents();
      updateSimul(); updateInterval();
      drawSimulCanvas(); drawIntervalCanvas();
    });
  });

  // Presets B.3 (mismos eventos A/B que B.2 — sincroniza inputs y actualiza ambos tabs)
  const presetsB3El = document.getElementById('presets-b3');
  if (presetsB3El) {
    presetsB3El.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsB3El.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');
        // Sincronizar inputs de B.2 también
        simAx.value = btn.dataset.ax; simAt.value = btn.dataset.at;
        simBx.value = btn.dataset.bx; simBt.value = btn.dataset.bt;
        readSimEvents();
        updateSimul(); updateInterval();
        drawSimulCanvas(); drawIntervalCanvas();
      });
    });
  }


  function updateSimul() {
    const { A, B, beta: β } = state;
    const Ap = Lorentz.transform(A.x, A.t, β);
    const Bp = Lorentz.transform(B.x, B.t, β);

    const Δt   = B.t  - A.t;
    const Δtp  = Bp.t - Ap.t;
    const Δx   = B.x  - A.x;
    const Δxp  = Bp.x - Ap.x;

    simDtS.textContent  = fmt(Δt, 4);
    simDtSp.textContent = fmt(Δtp, 4);
    simDxS.textContent  = fmt(Δx, 4);
    simDxSp.textContent = fmt(Δxp, 4);

    // Verdict K
    if (Math.abs(Δt) < EPS) {
      simVS.textContent = 'Simultáneos en K ✓';
      simVS.className   = 'sim-verdict simultaneous';
    } else {
      simVS.textContent = Δt > 0 ? 'A ocurre antes en K' : 'B ocurre antes en K';
      simVS.className   = 'sim-verdict not-simultaneous';
    }

    // Verdict K'
    if (Math.abs(Δtp) < EPS) {
      simVSp.textContent = "Simultáneos en K' ✓";
      simVSp.className   = 'sim-verdict simultaneous';
    } else {
      const reversed = (Math.sign(Δt) !== Math.sign(Δtp)) && (Math.abs(Δt) > EPS);
      simVSp.textContent = Δtp > 0 ? "A' ocurre antes en K'" : "B' ocurre antes en K'";
      simVSp.className   = 'sim-verdict ' + (reversed ? 'reversed' : 'not-simultaneous');
    }

    // Explanation
    const γ = Lorentz.gamma(β);
    if (Math.abs(Δt) < EPS && Math.abs(Δx) > EPS) {
      const predicted = -(γ * β * Δx).toFixed(4);
      simExpl.innerHTML =
        `<strong>Caso clásico de simultaneidad relativa:</strong> los eventos son simultáneos en K (Δt = 0) pero `
        + `están separados espacialmente (Δx = ${fmt(Δx, 2)} u.n.). `
        + `Según la fórmula Δt' = −γβΔx = −${γ.toFixed(3)}·${β.toFixed(3)}·${fmt(Δx, 2)} = ${predicted} u.n. ≠ 0. `
        + (Math.abs(Δt) < EPS && Math.abs(Δtp) > EPS ? `Para K', el evento ${Δtp < 0 ? 'B' : 'A'} ocurre antes.` : '');
    } else if (Math.abs(Δt) < EPS && Math.abs(Δx) < EPS) {
      simExpl.textContent = 'Los dos eventos son el mismo punto del espacio-tiempo: simultáneos en todo sistema de referencia.';
    } else if (Math.sign(Δt) !== Math.sign(Δtp) && Math.abs(Δt) > EPS && Math.abs(Δtp) > EPS) {
      simExpl.innerHTML =
        `<strong>Inversión del orden temporal:</strong> Δt = ${fmt(Δt, 3)} en K, pero Δt' = ${fmt(Δtp, 3)} en K'. `
        + `El orden de A y B se ha <strong>invertido</strong> al cambiar de sistema. Esto es posible porque el intervalo `
        + `Δs² = ${fmt(Lorentz.spacetimeInterval(Δx, Δt), 3)} es de tipo espacial (no hay conexión causal entre A y B).`;
    } else {
      simExpl.innerHTML =
        `Δt = ${fmt(Δt, 3)} en K, Δt' = ${fmt(Δtp, 3)} en K'. `
        + `Fórmula general: Δt' = γ(Δt − βΔx) = ${γ.toFixed(3)}·(${fmt(Δt, 3)} − ${β.toFixed(3)}·${fmt(Δx, 3)}) = ${fmt(Δtp, 4)}.`;
    }
  }

  /* ── Canvas B.2: Minkowski con líneas de simultaneidad ──
     x horizontal, t vertical (c=1)
     Líneas de simultaneidad en K: horizontales (t = const)
     Líneas de simultaneidad en K': inclinadas con pendiente β (t = β·x + const/γ)
     Eventos A (verde) y B (amarillo) marcados como puntos
  ────────────────────────────────────────────────────────── */
  const simCanvas = document.getElementById('sim-canvas');
  const ctx2      = simCanvas.getContext('2d');

  function resizeSimCanvas() {
    simCanvas.width  = simCanvas.parentElement.clientWidth;
    simCanvas.height = 440;
    drawSimulCanvas();
  }


  function drawSimulCanvas() {
    const W = simCanvas.width;
    const H = simCanvas.height;
    const β = state.beta;
    const { A, B } = state;
    const Ap = Lorentz.transform(A.x, A.t, β);
    const Bp = Lorentz.transform(B.x, B.t, β);

    // Autoscale
    const allX = [A.x, B.x];
    const allT = [A.t, B.t, Ap.t, Bp.t];
    const xc = (Math.max(...allX) + Math.min(...allX)) / 2;
    const tc = (Math.max(...allT) + Math.min(...allT)) / 2;
    const rx = Math.max(Math.max(...allX) - Math.min(...allX), 2) * 1.8;
    const rt = Math.max(Math.max(...allT) - Math.min(...allT), 2) * 2.0;
    const RANGE = Math.max(rx, rt, 6);

    const ML = 55, MR = 30, MT = 30, MB = 45;
    const PW = W - ML - MR;
    const PH = H - MT - MB;

    // Origin: centered on the events
    const OX = ML + PW / 2;
    const OY = MT + PH / 2;

    const toPx = (x, t) => ({
      px: OX + ((x - xc) / RANGE) * PW,
      py: OY - ((t - tc) / RANGE) * PH,
    });

    ctx2.fillStyle = '#09111e';
    ctx2.fillRect(0, 0, W, H);

    // Grid
    ctx2.save();
    ctx2.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx2.lineWidth = 1;
    const gStep = Math.ceil(RANGE / 5);
    for (let v = -20; v <= 20; v += gStep) {
      const { px: gx1, py: gy1 } = toPx(xc + v, tc - RANGE);
      const { px: gx2, py: gy2 } = toPx(xc + v, tc + RANGE);
      ctx2.beginPath(); ctx2.moveTo(gx1, gy1); ctx2.lineTo(gx2, gy2); ctx2.stroke();
      const { px: hx1, py: hy1 } = toPx(xc - RANGE, tc + v);
      const { px: hx2, py: hy2 } = toPx(xc + RANGE, tc + v);
      ctx2.beginPath(); ctx2.moveTo(hx1, hy1); ctx2.lineTo(hx2, hy2); ctx2.stroke();
    }
    ctx2.restore();

    // Light cone
    ctx2.save();
    ctx2.strokeStyle = 'rgba(253,224,71,0.25)';
    ctx2.lineWidth = 1; ctx2.setLineDash([4, 4]);
    const cx1 = toPx(xc - RANGE, tc - RANGE); const cx2 = toPx(xc + RANGE, tc + RANGE);
    ctx2.beginPath(); ctx2.moveTo(cx1.px, cx1.py); ctx2.lineTo(cx2.px, cx2.py); ctx2.stroke();
    const cx3 = toPx(xc + RANGE, tc - RANGE); const cx4 = toPx(xc - RANGE, tc + RANGE);
    ctx2.beginPath(); ctx2.moveTo(cx3.px, cx3.py); ctx2.lineTo(cx4.px, cx4.py); ctx2.stroke();
    ctx2.setLineDash([]);
    ctx2.restore();

    // K axes
    ctx2.save();
    ctx2.strokeStyle = 'rgba(79,158,255,0.4)'; ctx2.lineWidth = 1;
    const { px: kxa, py: kya } = toPx(xc - RANGE, tc); const { px: kxb, py: kyb } = toPx(xc + RANGE, tc);
    ctx2.beginPath(); ctx2.moveTo(kxa, kya); ctx2.lineTo(kxb, kyb); ctx2.stroke();
    const { px: kta, py: ktaa } = toPx(xc, tc - RANGE); const { px: ktb, py: ktbb } = toPx(xc, tc + RANGE);
    ctx2.beginPath(); ctx2.moveTo(kta, ktaa); ctx2.lineTo(ktb, ktbb); ctx2.stroke();
    ctx2.restore();

    // ── Simultaneity lines for K through events A and B ──
    // In K: horizontal lines t = A.t and t = B.t
    function drawSimLine_K(t, color, label) {
      const { px: sx1, py: sy1 } = toPx(xc - RANGE, t);
      const { px: sx2, py: sy2 } = toPx(xc + RANGE, t);
      ctx2.save();
      ctx2.strokeStyle = color; ctx2.globalAlpha = 0.5; ctx2.lineWidth = 1.5;
      ctx2.beginPath(); ctx2.moveTo(sx1, sy1); ctx2.lineTo(sx2, sy2); ctx2.stroke();
      ctx2.fillStyle = color; ctx2.globalAlpha = 0.7;
      ctx2.font = '9px Consolas, monospace'; ctx2.textAlign = 'left';
      ctx2.fillText(`t=${fmt(t, 1)} (K)`, sx2 - 90, sy2 - 4);
      ctx2.restore();
    }

    drawSimLine_K(A.t, '#34d399', 'A');
    if (Math.abs(B.t - A.t) > EPS) drawSimLine_K(B.t, '#fbbf24', 'B');

    // ── Simultaneity lines for K' through events A and B ──
    // In K': lines of constant t', which in the (x,t) plane have slope dct/dx = β
    // Through event A: t - A.t = β·(x - A.x) → t = β·x + (A.t - β·A.x)
    // Through event B: t - B.t = β·(x - B.x) → t = β·x + (B.t - β·B.x)
    function drawSimLine_Kp(evtX, evtT, color, label) {
      const intercept = evtT - β * evtX;
      const { px: px1, py: py1 } = toPx(xc - RANGE, β * (xc - RANGE) + intercept);
      const { px: px2, py: py2 } = toPx(xc + RANGE, β * (xc + RANGE) + intercept);
      ctx2.save();
      ctx2.strokeStyle = color; ctx2.globalAlpha = 0.55; ctx2.lineWidth = 1.5;
      ctx2.setLineDash([6, 4]);
      ctx2.beginPath(); ctx2.moveTo(px1, py1); ctx2.lineTo(px2, py2); ctx2.stroke();
      ctx2.setLineDash([]);
      ctx2.fillStyle = color; ctx2.globalAlpha = 0.7;
      ctx2.font = '9px Consolas, monospace'; ctx2.textAlign = 'right';
      const { px: mlx, py: mly } = toPx(xc - RANGE * 0.3, β * (xc - RANGE * 0.3) + intercept);
      ctx2.fillText(`(K')`, mlx - 4, mly - 4);
      ctx2.restore();
    }

    drawSimLine_Kp(A.x, A.t, '#34d399', 'A');
    if (Math.abs(B.t - A.t) > EPS || Math.abs(B.x - A.x) > EPS)
      drawSimLine_Kp(B.x, B.t, '#fbbf24', 'B');

    // ── Event dots ───────────────────────────────────────
    function drawEventDot(x, t, color, label) {
      const { px: dp, py: dpy } = toPx(x, t);
      ctx2.save();
      ctx2.fillStyle = color; ctx2.strokeStyle = '#fff'; ctx2.lineWidth = 2;
      ctx2.beginPath(); ctx2.arc(dp, dpy, 9, 0, Math.PI * 2); ctx2.fill(); ctx2.stroke();
      ctx2.fillStyle = '#fff'; ctx2.font = 'bold 10px Consolas, monospace';
      ctx2.textAlign = 'center'; ctx2.fillText(label, dp, dpy + 4);
      // Coord labels
      ctx2.fillStyle = color; ctx2.font = '9px Consolas, monospace';
      ctx2.fillText(`(${fmt(x, 1)}, ${fmt(t, 1)})`, dp, dpy - 14);
      ctx2.restore();
    }

    drawEventDot(A.x, A.t, '#34d399', 'A');
    drawEventDot(B.x, B.t, '#fbbf24', 'B');

    // ── Legend ───────────────────────────────────────────
    ctx2.save();
    ctx2.font = '10px Segoe UI, sans-serif';
    ctx2.fillStyle = 'rgba(255,255,255,0.25)'; ctx2.textAlign = 'center';
    ctx2.fillText(
      `K (reposo) · K' en movimiento β = ${β.toFixed(2)} · γ = ${Lorentz.gamma(β).toFixed(3)}`,
      W / 2, H - 8
    );
    ctx2.restore();
  }

  /* ══════════════════════════════════════════════════════════
     B.3 — INTERVALO
  ══════════════════════════════════════════════════════════ */
  const intDs2S      = document.getElementById('int-ds2-s');
  const intDs2Sp     = document.getElementById('int-ds2-sp');
  const intTypeS     = document.getElementById('int-type-s');
  const intTypeSp    = document.getElementById('int-type-sp');
  const intInvariant = document.getElementById('int-invariant');
  const intInvLabel  = document.getElementById('int-invariant-label');

  function updateInterval() {
    const { A, B, beta: β } = state;
    const Ap = Lorentz.transform(A.x, A.t, β);
    const Bp = Lorentz.transform(B.x, B.t, β);

    const Δx  = B.x  - A.x;
    const Δt  = B.t  - A.t;
    const Δxp = Bp.x - Ap.x;
    const Δtp = Bp.t - Ap.t;

    const ds2  = Lorentz.spacetimeInterval(Δx, Δt);
    const ds2p = Lorentz.spacetimeInterval(Δxp, Δtp);
    const inv  = Math.abs(ds2 - ds2p) < 1e-7;

    const ct  = causalType(ds2);
    const ctp = causalType(ds2p);

    intDs2S.textContent   = fmt(ds2, 4);
    intDs2Sp.textContent  = fmt(ds2p, 4);
    intTypeS.textContent  = ct.label;
    intTypeSp.textContent = ctp.label;
    intDs2S.style.color   = ct.color;
    intDs2Sp.style.color  = ctp.color;

    intInvariant.textContent = inv ? '✓' : '✗';
    intInvLabel.textContent  = inv ? "Δs² = Δs'²" : '¡Discrepancia numérica!';
    intInvariant.style.color = inv ? '#34d399' : '#f87171';
  }

  /* ── Canvas B.3: Componentes vs Invariante Δs² ───────── */
  const intCanvas = document.getElementById('interval-canvas');
  const ctx3      = intCanvas.getContext('2d');

  function resizeIntCanvas() {
    intCanvas.width  = intCanvas.parentElement.clientWidth;
    intCanvas.height = 280;
    drawIntervalCanvas();
  }

  function drawIntervalCanvas() {
    const W = intCanvas.width;
    const H = intCanvas.height;
    const { A, B } = state;
    const Δx = B.x - A.x;
    const Δt = B.t - A.t;
    const ds2_S = Lorentz.spacetimeInterval(Δx, Δt);

    const ML = 65, MR = 40, MT = 35, MB = 45;
    const PW = W - ML - MR;
    const PH = H - MT - MB;

    ctx3.fillStyle = '#09111e';
    ctx3.fillRect(0, 0, W, H);

    // Muestreo de curvas de 0 a 0.94c
    const N = 160;
    const maxB = 0.93;
    const betas = Array.from({ length: N }, (_, i) => (i / (N - 1)) * maxB);

    const dataDX2 = [];
    const dataDT2 = [];
    const dataDS2 = [];

    betas.forEach(b => {
      const g = 1 / Math.sqrt(Math.max(1e-6, 1 - b * b));
      const dxp = g * (Δx - b * Δt);
      const dtp = g * (Δt - b * Δx);
      const dx2 = dxp * dxp;
      const dt2 = dtp * dtp;
      const ds2 = dt2 - dx2;
      dataDX2.push(dx2);
      dataDT2.push(dt2);
      dataDS2.push(ds2);
    });

    // Rango dinámico en Y
    const allVals = [...dataDX2, ...dataDT2, ...dataDS2, 0, ds2_S];
    let yMin = Math.min(...allVals);
    let yMax = Math.max(...allVals);
    const span = Math.max(Math.abs(yMax - yMin), 2);
    yMin -= span * 0.12;
    yMax += span * 0.15;
    const yRange = yMax - yMin;

    const toXpx = (b) => ML + (b / maxB) * PW;
    const toYpx = (v) => MT + PH - ((v - yMin) / yRange) * PH;

    // ── Cuadrícula suave de fondo ────────────────────────
    ctx3.save();
    ctx3.strokeStyle = 'rgba(255,255,255,0.06)'; ctx3.lineWidth = 1;
    const approxSteps = 5;
    const rawStep = yRange / approxSteps;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const yStep = Math.ceil(rawStep / mag) * mag;

    for (let v = Math.ceil(yMin / yStep) * yStep; v <= yMax; v += yStep) {
      const py = toYpx(v);
      if (py < MT || py > MT + PH) continue;
      ctx3.beginPath(); ctx3.moveTo(ML, py); ctx3.lineTo(ML + PW, py); ctx3.stroke();
      ctx3.fillStyle = 'rgba(255,255,255,0.3)'; ctx3.font = '9px Consolas, monospace';
      ctx3.textAlign = 'right'; ctx3.fillText(v.toFixed(1), ML - 6, py + 3);
    }
    ctx3.restore();

    // ── Línea Cero (y = 0) ───────────────────────────────
    const y0 = toYpx(0);
    if (y0 >= MT && y0 <= MT + PH) {
      ctx3.save();
      ctx3.strokeStyle = 'rgba(255,255,255,0.25)'; ctx3.lineWidth = 1; ctx3.setLineDash([4, 3]);
      ctx3.beginPath(); ctx3.moveTo(ML, y0); ctx3.lineTo(ML + PW, y0); ctx3.stroke();
      ctx3.setLineDash([]);
      ctx3.fillStyle = 'rgba(255,255,255,0.5)'; ctx3.font = 'bold 9px Consolas, monospace';
      ctx3.textAlign = 'right'; ctx3.fillText('0.0', ML - 6, y0 + 3);
      ctx3.restore();
    }

    // ── Curva 1: Separación Espacial Δx'²(β) (Azul celeste) ─
    ctx3.save();
    ctx3.strokeStyle = '#38bdf8'; ctx3.lineWidth = 2.2;
    ctx3.beginPath();
    betas.forEach((b, i) => {
      const px = toXpx(b); const py = toYpx(dataDX2[i]);
      if (i === 0) ctx3.moveTo(px, py); else ctx3.lineTo(px, py);
    });
    ctx3.stroke();
    ctx3.restore();

    // ── Curva 2: Separación Temporal c²Δt'²(β) (Violeta) ───
    ctx3.save();
    ctx3.strokeStyle = '#c084fc'; ctx3.lineWidth = 2.2;
    ctx3.beginPath();
    betas.forEach((b, i) => {
      const px = toXpx(b); const py = toYpx(dataDT2[i]);
      if (i === 0) ctx3.moveTo(px, py); else ctx3.lineTo(px, py);
    });
    ctx3.stroke();
    ctx3.restore();

    // ── Curva 3: Invariante Δs'² = c²Δt'² − Δx'² (Verde Esmeralda) ─
    ctx3.save();
    ctx3.strokeStyle = '#34d399'; ctx3.lineWidth = 3.5;
    ctx3.shadowColor = 'rgba(52, 211, 153, 0.5)'; ctx3.shadowBlur = 8;
    ctx3.beginPath();
    betas.forEach((b, i) => {
      const px = toXpx(b); const py = toYpx(dataDS2[i]);
      if (i === 0) ctx3.moveTo(px, py); else ctx3.lineTo(px, py);
    });
    ctx3.stroke();
    ctx3.restore();

    // ── Indicador vertical en β actual ───────────────────
    const curBeta = Math.min(state.beta, maxB);
    const curG = 1 / Math.sqrt(Math.max(1e-6, 1 - curBeta * curBeta));
    const curDXp = curG * (Δx - curBeta * Δt);
    const curDTp = curG * (Δt - curBeta * Δx);
    const curDX2 = curDXp * curDXp;
    const curDT2 = curDTp * curDTp;
    const curDS2 = curDT2 - curDX2;

    const curXpx = toXpx(curBeta);
    const pyDX2  = toYpx(curDX2);
    const pyDT2  = toYpx(curDT2);
    const pyDS2  = toYpx(curDS2);

    // Línea guía vertical
    ctx3.save();
    ctx3.strokeStyle = 'rgba(255,255,255,0.35)'; ctx3.lineWidth = 1.2; ctx3.setLineDash([4, 4]);
    ctx3.beginPath(); ctx3.moveTo(curXpx, MT); ctx3.lineTo(curXpx, MT + PH); ctx3.stroke();
    ctx3.restore();

    // Punto en Curva Δx'² (Azul)
    ctx3.save();
    ctx3.fillStyle = '#38bdf8'; ctx3.strokeStyle = '#fff'; ctx3.lineWidth = 2;
    ctx3.beginPath(); ctx3.arc(curXpx, pyDX2, 5.5, 0, Math.PI * 2); ctx3.fill(); ctx3.stroke();
    ctx3.restore();

    // Punto en Curva c²Δt'² (Violeta)
    ctx3.save();
    ctx3.fillStyle = '#c084fc'; ctx3.strokeStyle = '#fff'; ctx3.lineWidth = 2;
    ctx3.beginPath(); ctx3.arc(curXpx, pyDT2, 5.5, 0, Math.PI * 2); ctx3.fill(); ctx3.stroke();
    ctx3.restore();

    // Punto en Invariante Δs'² (Verde)
    ctx3.save();
    ctx3.fillStyle = '#34d399'; ctx3.strokeStyle = '#fff'; ctx3.lineWidth = 2.5;
    ctx3.beginPath(); ctx3.arc(curXpx, pyDS2, 7, 0, Math.PI * 2); ctx3.fill(); ctx3.stroke();
    ctx3.restore();

    // ── Ejes Cartesianos ─────────────────────────────────
    ctx3.save();
    ctx3.strokeStyle = 'rgba(255,255,255,0.3)'; ctx3.lineWidth = 1.2;
    ctx3.beginPath();
    ctx3.moveTo(ML, MT); ctx3.lineTo(ML, MT + PH); ctx3.lineTo(ML + PW, MT + PH);
    ctx3.stroke();

    // Ticks eje X (β)
    [0.0, 0.2, 0.4, 0.6, 0.8, 0.9].forEach(b => {
      const bx = toXpx(b);
      ctx3.beginPath(); ctx3.moveTo(bx, MT + PH); ctx3.lineTo(bx, MT + PH + 4); ctx3.stroke();
      ctx3.fillStyle = 'rgba(255,255,255,0.4)'; ctx3.font = '9px Consolas, monospace';
      ctx3.textAlign = 'center'; ctx3.fillText(b.toFixed(1), bx, MT + PH + 16);
    });

    ctx3.fillStyle = 'rgba(255,255,255,0.6)'; ctx3.font = 'bold 10px Segoe UI, sans-serif';
    ctx3.textAlign = 'center'; ctx3.fillText('Velocidad relativa β = v/c →', ML + PW / 2, MT + PH + 32);

    // Marcador de β actual en el eje X
    ctx3.fillStyle = '#34d399'; ctx3.font = 'bold 10px Consolas, monospace';
    ctx3.textAlign = 'center'; ctx3.fillText(`β = ${curBeta.toFixed(2)}`, curXpx, MT + PH + 16);
    ctx3.restore();

    // ── Leyenda Interactiva Superior ──────────────────────
    ctx3.save();
    ctx3.font = 'bold 10px Segoe UI, sans-serif';

    // 1. Δx'²
    ctx3.fillStyle = '#38bdf8';
    ctx3.fillText(`━ Δx'²(β) = ${fmt(curDX2, 2)}`, ML + 10, MT - 12);

    // 2. c²Δt'²
    ctx3.fillStyle = '#c084fc';
    ctx3.fillText(`━ c²Δt'²(β) = ${fmt(curDT2, 2)}`, ML + 170, MT - 12);

    // 3. Δs'²
    ctx3.fillStyle = '#34d399';
    ctx3.fillText(`━ Δs'² = c²Δt'² − Δx'² = ${fmt(curDS2, 2)} (INVARIANTE ✓)`, ML + 350, MT - 12);
    ctx3.restore();
  }

  /* ══════════════════════════════════════════════════════════
     RESIZE
  ══════════════════════════════════════════════════════════ */
  function resizeAll() {
    // Guard against hidden tabs (display:none → clientWidth === 0)
    if (coordCanvas.parentElement.clientWidth > 0) resizeCoordCanvas();
    if (simCanvas.parentElement.clientWidth   > 0) resizeSimCanvas();
    if (intCanvas.parentElement.clientWidth   > 0) resizeIntCanvas();
  }
  window.addEventListener('resize', () => requestAnimationFrame(resizeAll));


  /* ══════════════════════════════════════════════════════════
     UPDATE ALL
  ══════════════════════════════════════════════════════════ */
  function updateAll() {
    updateCoords();
    updateSimul();
    updateInterval();
    redrawAll();
  }

  function redrawAll() {
    drawMinkowski();
    drawSimulCanvas();
    drawIntervalCanvas();
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  updateVelocityBar();
  resizeAll();
  updateAll();

})();
