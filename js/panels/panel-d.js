/**
 * panel-d.js — Panel D: Dilatación, Contracción, Evidencia Experimental e Impacto (E = mc²)
 *
 * Estructura idéntica a Panel B y Panel C:
 *   - Barra sticky con 3 pestañas (D.1, D.2, D.3) + slider global β
 *   - Tab D.1: Dilatación del tiempo, Efecto Doppler Transversal y Simulación del Reloj de Luz (Izquierda S' vs Derecha S)
 *   - Tab D.2: Contracción de Lorentz, Dualidad Muón-Atmósfera y Escáner Relativista interactivo
 *   - Tab D.3: Dinámica Relativista (p = γmv, E = γmc²), Gráfica interactiva E(β) vs Clásica e Impacto
 *
 * Dependencias: js/physics/lorentz.js
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     PALETA Y CONSTANTES
  ══════════════════════════════════════════════════════════ */
  const COL = {
    bg:           '#09111e',
    grid:         'rgba(255,255,255,0.04)',
    axis:         'rgba(255,255,255,0.22)',
    sep:          'rgba(255,255,255,0.12)',
    accent:       '#4f9eff',
    purple:       '#a78bfa',
    green:        '#34d399',
    red:          '#f87171',
    gold:         '#fde047',
    amber:        '#fbbf24',
    mirror:       '#94a3b8',
    mirrorBorder: 'rgba(255, 255, 255, 0.45)',
    triangle:     'rgba(251, 191, 36, 0.75)',
    text:         '#e2e8f0',
    textMuted:    'rgba(255, 255, 255, 0.55)',
  };

  const C_KM_PER_US = 0.299792458; // c en km/μs (~0.3 km/μs)

  const PARTICLES = {
    electron: { name: 'Electrón (e⁻)',        e0: 0.5110,    unit: 'MeV', dec: 4, sci: false },
    muon:     { name: 'Muón (μ⁻)',            e0: 105.66,    unit: 'MeV', dec: 2, sci: false },
    proton:   { name: 'Protón (p⁺)',          e0: 938.27,    unit: 'MeV', dec: 2, sci: false },
    gram:     { name: '1 g de materia',       e0: 8.9876e13, unit: 'J',   dec: 2, sci: true  },
    u235:     { name: 'Fisión ²³⁵U (Δm·c²)',  e0: 202.50,    unit: 'MeV', dec: 2, sci: false },
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO GLOBAL DEL PANEL D
  ══════════════════════════════════════════════════════════ */
  const state = {
    beta:      0.60,
    particle:  'electron',
    clock: {
      running:   false,
      paused:    false,
      time:      0,
      lastStamp: 0,
      animId:    null,
    }
  };

  /* ══════════════════════════════════════════════════════════
     REFERENCIAS DOM
  ══════════════════════════════════════════════════════════ */
  // Barra global
  const betaSlider     = document.getElementById('global-beta-slider');
  const betaLabel      = document.getElementById('beta-label');
  const gammaLabel     = document.getElementById('gamma-label');
  const invGammaLabel  = document.getElementById('invgamma-label');

  // Tab D.1 — Dilatación y Reloj de Luz
  const presetsD1      = document.getElementById('presets-d1');
  const inputT0        = document.getElementById('input-t0');
  const unitT0         = document.getElementById('unit-t0');
  const clockSpTicks   = document.getElementById('clock-sp-ticks');
  const resT           = document.getElementById('res-t');
  const resDtDiff      = document.getElementById('res-dt-diff');
  const clockSRatio    = document.getElementById('clock-s-ratio');
  const d1TblBeta      = document.getElementById('d1-tbl-beta');
  const d1TblGamma     = document.getElementById('d1-tbl-gamma');
  const d1TblRate      = document.getElementById('d1-tbl-rate');
  const d1TblFreq      = document.getElementById('d1-tbl-freq');
  const d1TblDlambda   = document.getElementById('d1-tbl-dlambda');
  const clockSpT       = document.getElementById('clock-sp-t');
  const clockST        = document.getElementById('clock-s-t');
  const clockCanvas    = document.getElementById('canvas-light-clock');
  const clockCtx       = clockCanvas ? clockCanvas.getContext('2d') : null;
  const btnClockPlay   = document.getElementById('btn-clock-play');
  const btnClockPause  = document.getElementById('btn-clock-pause');
  const btnClockReset  = document.getElementById('btn-clock-reset');

  // Tab D.2 — Contracción y Muones
  const presetsD2      = document.getElementById('presets-d2');
  const inputL0        = document.getElementById('input-l0');
  const unitL0         = document.getElementById('unit-l0');
  const resL           = document.getElementById('res-l');
  const resLPct        = document.getElementById('res-l-pct');
  const cRatioVal      = document.getElementById('c-ratio-val');
  const scanL          = document.getElementById('scan-l');
  const scanPct        = document.getElementById('scan-pct');
  const muonDClas      = document.getElementById('muon-d-clas');
  const muonTEarth     = document.getElementById('muon-t-earth');
  const muonDEarth     = document.getElementById('muon-d-earth');
  const muonAtmCont    = document.getElementById('muon-atm-cont');
  const muonVerdict    = document.getElementById('muon-verdict');
  const scanCanvas     = document.getElementById('canvas-contraction');
  const scanCtx        = scanCanvas ? scanCanvas.getContext('2d') : null;

  // Tab D.3 — Dinámica y E = mc²
  const presetsD3Part  = document.getElementById('presets-d3-part');
  const presetsD3Beta  = document.getElementById('presets-d3-beta');
  const d3Verdict      = document.getElementById('d3-verdict');
  const resE0          = document.getElementById('res-e0');
  const resEk          = document.getElementById('res-ek');
  const resEkClas      = document.getElementById('res-ek-clas');
  const resEtot        = document.getElementById('res-etot');
  const resMom         = document.getElementById('res-mom');
  const resInvE        = document.getElementById('res-inv-e');
  const energyCanvas   = document.getElementById('canvas-energy');
  const energyCtx      = energyCanvas ? energyCanvas.getContext('2d') : null;

  /* ══════════════════════════════════════════════════════════
     SISTEMA DE PESTAÑAS (TABS) Y RESIZE DE CANVASES
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
      requestAnimationFrame(() => {
        resizeCanvases();
        drawAll();
      });
    });
  });

  function getFallbackWidth() {
    const page = document.querySelector('.panel-page');
    if (page && page.clientWidth > 0) return Math.max(320, page.clientWidth - 48);
    return 860;
  }

  function resizeCanvases() {
    const fbW = getFallbackWidth();
    if (clockCanvas && clockCanvas.parentElement) {
      const w = clockCanvas.parentElement.clientWidth > 0 ? clockCanvas.parentElement.clientWidth : fbW;
      clockCanvas.width  = w;
      clockCanvas.height = w < 600 ? 320 : 380;
    }
    if (scanCanvas && scanCanvas.parentElement) {
      const w = scanCanvas.parentElement.clientWidth > 0 ? scanCanvas.parentElement.clientWidth : fbW;
      scanCanvas.width  = w;
      scanCanvas.height = w < 600 ? 250 : 280;
    }
    if (energyCanvas && energyCanvas.parentElement) {
      const w = energyCanvas.parentElement.clientWidth > 0 ? energyCanvas.parentElement.clientWidth : fbW;
      energyCanvas.width  = w;
      energyCanvas.height = w < 600 ? 290 : 320;
    }
  }

  window.addEventListener('resize', () => {
    requestAnimationFrame(() => {
      resizeCanvases();
      drawAll();
    });
  });

  /* ══════════════════════════════════════════════════════════
     ACTUALIZACIÓN NUMÉRICA INTEGRAL (TABS D.1, D.2, D.3)
  ══════════════════════════════════════════════════════════ */
  function updateAll() {
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const invG = 1 / γ;

    // 1. Barra sticky global
    if (betaLabel)     betaLabel.textContent     = `β = ${β.toFixed(4)}`;
    if (gammaLabel)    gammaLabel.textContent    = γ.toFixed(4);
    if (invGammaLabel) invGammaLabel.textContent = `1/γ = ${invG.toFixed(4)}`;

    // 2. Tab D.1 — Dilatación y Doppler Transversal
    const valT0 = parseFloat(inputT0 ? inputT0.value : 1) || 0;
    const uT    = unitT0 ? unitT0.value : 's';
    const valT  = valT0 * γ;
    const diffT = valT - valT0;

    if (resT)        resT.textContent        = `${valT.toFixed(3)} ${uT}`;
    if (resDtDiff)   resDtDiff.textContent   = `+${diffT.toFixed(3)} ${uT}`;
    if (clockSRatio) clockSRatio.textContent = `γ = ${γ.toFixed(4)}`;

    const dLambda = γ - 1;
    const dLambdaStr = (dLambda > 0 && dLambda < 0.001)
      ? `+${dLambda.toExponential(3)}`
      : `+${dLambda.toFixed(4)}`;

    if (d1TblBeta)    d1TblBeta.textContent    = β.toFixed(4);
    if (d1TblGamma)   d1TblGamma.textContent   = γ.toFixed(4);
    if (d1TblRate)    d1TblRate.textContent    = `${invG.toFixed(4)} (${(invG * 100).toFixed(1)}%)`;
    if (d1TblFreq)    d1TblFreq.textContent    = `${invG.toFixed(5)} · f₀`;
    if (d1TblDlambda) d1TblDlambda.textContent = dLambdaStr;

    updateClockReadouts();

    // 3. Tab D.2 — Contracción de Longitud y Muones Atmosféricos
    const valL0   = parseFloat(inputL0 ? inputL0.value : 100) || 0;
    const uL      = unitL0 ? unitL0.value : 'm';
    const valL    = valL0 * invG;
    const pctL    = invG * 100;
    const pctDrop = (1 - invG) * 100;

    if (resL)      resL.textContent      = `${valL.toFixed(2)} ${uL}`;
    if (resLPct)   resLPct.textContent   = `-${pctDrop.toFixed(2)}%`;
    if (cRatioVal) cRatioVal.textContent = `L = ${pctL.toFixed(1)}% de L₀`;
    if (scanL)     scanL.textContent     = `${valL.toFixed(2)} ${uL}`;
    if (scanPct)   scanPct.textContent   = `-${pctDrop.toFixed(1)}%`;

    // Tabla Muón Cósmico en vivo (h = 10 km, τ₀ = 2.2 μs)
    const tau0    = 2.2; // μs
    const hAtm    = 10.0; // km
    const dClas   = β * C_KM_PER_US * tau0;
    const tEarth  = γ * tau0;
    const dEarth  = γ * dClas;
    const atmCont = hAtm * invG;

    if (muonDClas)   muonDClas.textContent   = `${dClas.toFixed(3)} km`;
    if (muonTEarth)  muonTEarth.textContent  = `${tEarth.toFixed(2)} μs`;
    if (muonDEarth)  muonDEarth.textContent  = `${dEarth.toFixed(2)} km`;
    if (muonAtmCont) muonAtmCont.textContent = `${atmCont.toFixed(3)} km`;
    if (muonVerdict) {
      if (dEarth >= hAtm) {
        muonVerdict.style.color = '#34d399';
        muonVerdict.textContent = `✓ ¡Llega al suelo! (${dEarth.toFixed(1)} km ≥ 10 km)`;
      } else {
        muonVerdict.style.color = '#fbbf24';
        muonVerdict.textContent = `✗ Se desintegra a los ${dEarth.toFixed(2)} km (sube β a 0.998)`;
      }
    }

    // 4. Tab D.3 — Dinámica Relativista y Masa-Energía (E = γmc²)
    const pObj  = PARTICLES[state.particle] || PARTICLES.electron;
    const E0    = pObj.e0;
    const K     = (γ - 1) * E0;
    const Kclas = 0.5 * β * β * E0;
    const Etot  = γ * E0;
    const pc    = γ * β * E0;
    const invE  = Math.sqrt(Math.max(0, Etot * Etot - pc * pc));

    const fmt = (val) => pObj.sci ? `${val.toExponential(3)} ${pObj.unit}` : `${val.toFixed(pObj.dec)} ${pObj.unit}`;

    if (resE0)     resE0.textContent     = fmt(E0);
    if (resEk)     resEk.textContent     = fmt(K);
    if (resEkClas) resEkClas.textContent = fmt(Kclas);
    if (resEtot)   resEtot.textContent   = fmt(Etot);
    if (resMom)    resMom.textContent    = `${fmt(pc).replace(' ' + pObj.unit, '')} ${pObj.unit}/c`;
    if (resInvE)   resInvE.textContent   = `${fmt(invE)} ✓`;

    if (d3Verdict) {
      const kRatioPct = ((γ - 1) * 100).toFixed(1);
      const errClasPct = K > 1e-12 ? (((K - Kclas) / K) * 100).toFixed(1) : '0.0';
      d3Verdict.innerHTML =
        `✓ <strong>${pObj.name}</strong> a <strong>β = ${β.toFixed(4)} (γ = ${γ.toFixed(4)})</strong>: ` +
        `la energía cinética es el <strong>${kRatioPct}%</strong> de E₀ ` +
        `(la fórmula clásica ½mv² falla por un <strong>${errClasPct}%</strong>).`;
    }
  }

  function drawAll() {
    drawClock();
    drawContraction();
    drawEnergyCanvas();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO D.1: SIMULACIÓN DEL RELOJ DE LUZ (IZQUIERDA S' VS DERECHA S)
  ══════════════════════════════════════════════════════════ */
  function updateClockReadouts() {
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const t_lab  = state.clock.time;
    const t_prop = t_lab / γ;
    const ticksSp = Math.floor(t_prop);

    if (clockSpT)     clockSpT.textContent     = `${t_prop.toFixed(2)} s`;
    if (clockSpTicks) clockSpTicks.textContent = `${ticksSp} ticks`;
    if (clockST)      clockST.textContent      = `${t_lab.toFixed(2)} s`;
  }

  function drawClock() {
    if (!clockCtx || !clockCanvas) return;
    const W = clockCanvas.width;
    const H = clockCanvas.height;
    const β = state.beta;
    const γ = Lorentz.gamma(β);

    clockCtx.fillStyle = COL.bg;
    clockCtx.fillRect(0, 0, W, H);

    // Grilla de fondo
    clockCtx.strokeStyle = COL.grid;
    clockCtx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 18) {
      clockCtx.beginPath(); clockCtx.moveTo(x, 0); clockCtx.lineTo(x, H); clockCtx.stroke();
    }
    for (let y = 0; y <= H; y += H / 8) {
      clockCtx.beginPath(); clockCtx.moveTo(0, y); clockCtx.lineTo(W, y); clockCtx.stroke();
    }

    // División vertical: Izquierda (32% = S' en reposo) | Derecha (68% = S en movimiento)
    const xSplit = Math.round(W * 0.32);
    clockCtx.save();
    clockCtx.strokeStyle = COL.sep;
    clockCtx.lineWidth = 1.5;
    clockCtx.setLineDash([6, 4]);
    clockCtx.beginPath();
    clockCtx.moveTo(xSplit, 10);
    clockCtx.lineTo(xSplit, H - 28);
    clockCtx.stroke();
    clockCtx.restore();

    // Alturas comunes de los espejos (compartidas entre S' y S para mostrar que L vertical es invariante)
    const yTop    = 72;
    const yBot    = H - 64;
    const mirrorH = yBot - yTop; // Altura L en px
    const mirrorW = 56;

    // Líneas guía horizontales tenues que conectan los espejos de S' y S (demostrando L' = L)
    clockCtx.save();
    clockCtx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
    clockCtx.setLineDash([3, 5]);
    clockCtx.beginPath();
    clockCtx.moveTo(24, yTop); clockCtx.lineTo(W - 24, yTop);
    clockCtx.moveTo(24, yBot); clockCtx.lineTo(W - 24, yBot);
    clockCtx.stroke();
    clockCtx.restore();

    const t_lab  = state.clock.time;
    const t_prop = t_lab / γ;

    // ── 1. PANEL IZQUIERDO: RELOJ S' EN REPOSO PROPIO (Δx' = 0) ─────────
    const xSp = Math.round(xSplit * 0.52);

    clockCtx.fillStyle = COL.purple;
    clockCtx.font = 'bold 12px Segoe UI, sans-serif';
    clockCtx.textAlign = 'left';
    clockCtx.fillText("⏱ S' en Reposo Propio (Δx' = 0)", 14, 22);
    clockCtx.fillStyle = COL.textMuted;
    clockCtx.font = '11px Consolas, monospace';
    clockCtx.fillText(`t' = ${t_prop.toFixed(2)} s · Δt₀ = 2L/c`, 14, 40);

    drawMirror(xSp, yTop, mirrorW, COL.purple);
    drawMirror(xSp, yBot, mirrorW, COL.purple);
    drawHeightIndicator(xSp - mirrorW / 2 - 16, yTop, yBot, "L = c·Δt₀/2");

    // Rayo vertical fijo
    clockCtx.save();
    clockCtx.strokeStyle = 'rgba(253, 224, 71, 0.35)';
    clockCtx.lineWidth = 2.2;
    clockCtx.beginPath();
    clockCtx.moveTo(xSp, yBot);
    clockCtx.lineTo(xSp, yTop);
    clockCtx.stroke();
    clockCtx.restore();

    // Posición del fotón en S' (1 unidad de t_prop = 1 subida o bajada)
    const phaseSp   = t_prop % 2; // 0..1 sube, 1..2 baja
    const yPhotonSp = (phaseSp <= 1)
      ? yBot - phaseSp * mirrorH
      : yTop + (phaseSp - 1) * mirrorH;

    drawPhoton(xSp, yPhotonSp);

    // ── 2. PANEL DERECHO: RELOJ S EN MOVIMIENTO (v = βc) ────────────────
    const rightLeft  = xSplit + 44;
    const rightWidth = Math.max(180, W - rightLeft - 46);

    clockCtx.fillStyle = COL.accent;
    clockCtx.font = 'bold 12px Segoe UI, sans-serif';
    clockCtx.textAlign = 'left';
    clockCtx.fillText(`⏱ S en Laboratorio (Reloj moviéndose a v = ${β.toFixed(4)}c)`, xSplit + 16, 22);
    clockCtx.fillStyle = COL.textMuted;
    clockCtx.font = '11px Consolas, monospace';
    clockCtx.fillText(`t = ${t_lab.toFixed(2)} s · Δt = γ·Δt₀ (γ = ${γ.toFixed(4)})`, xSplit + 16, 40);

    // Geometría de un ciclo completo de ida y vuelta en S:
    // En 1 subida (mitad de ciclo), el espejo avanza dxHalf.
    // Escalamos dxHalf visualmente para que 1 ciclo completo (2 * dxHalf) quepa siempre en rightWidth.
    const maxHalfDx = rightWidth * 0.44;
    const rawHalfDx = β * mirrorH * Math.min(γ, 2.8);
    const dxHalf    = β > 0.0001 ? Math.min(maxHalfDx, Math.max(24 * β, rawHalfDx)) : 0;

    const x0 = rightLeft + (rightWidth - 2 * dxHalf) * 0.5; // Inicio subida (espejo inferior)
    const x1 = x0 + dxHalf;                                 // Rebote superior (espejo superior)
    const x2 = x0 + 2 * dxHalf;                             // Fin bajada (espejo inferior)

    // Fase del fotón en el laboratorio S (un rebote tarda γ veces más que en S')
    const phaseS = (t_lab / γ) % 2; // 0..1 subida, 1..2 bajada
    const xCur   = x0 + phaseS * dxHalf;
    const yCur   = (phaseS <= 1)
      ? yBot - phaseS * mirrorH
      : yTop + (phaseS - 1) * mirrorH;

    // Espejos fantasma en t=0 (x0) y en rebote medio (x1) para mostrar el triángulo de Pitágoras
    if (β > 0.01) {
      drawGhostMirror(x0, yBot, mirrorW);
      drawGhostMirror(x1, yTop, mirrorW);
      drawGhostMirror(x2, yBot, mirrorW);

      // Triángulo rectángulo de Pitágoras (mitad de ciclo: de x0 a x1)
      clockCtx.save();
      clockCtx.fillStyle = 'rgba(251, 191, 36, 0.06)';
      clockCtx.strokeStyle = COL.triangle;
      clockCtx.lineWidth = 1.6;
      clockCtx.setLineDash([5, 4]);
      clockCtx.beginPath();
      clockCtx.moveTo(x0, yBot);
      clockCtx.lineTo(x1, yTop);
      clockCtx.lineTo(x1, yBot);
      clockCtx.closePath();
      clockCtx.fill();
      clockCtx.stroke();
      clockCtx.setLineDash([]);

      // Ángulo recto en (x1, yBot)
      clockCtx.strokeStyle = COL.amber;
      clockCtx.lineWidth = 1.2;
      clockCtx.strokeRect(x1 - 10, yBot - 10, 10, 10);

      // Etiquetas de los 3 lados del triángulo de Pitágoras
      clockCtx.fillStyle = COL.amber;
      clockCtx.font = 'bold 11px Consolas, monospace';
      clockCtx.textAlign = 'right';
      clockCtx.fillText('Hipotenusa: c·Δt/2', (x0 + x1) / 2 - 8, (yTop + yBot) / 2 - 6);

      clockCtx.textAlign = 'center';
      clockCtx.fillText('Base: v·Δt/2', (x0 + x1) / 2, yBot + 20);

      clockCtx.fillStyle = COL.text;
      clockCtx.textAlign = 'left';
      clockCtx.fillText('Altura: L = c·Δt₀/2', x1 + 8, (yTop + yBot) / 2 + 4);

      // Segunda diagonal de bajada (x1, yTop) -> (x2, yBot) punteada
      clockCtx.strokeStyle = 'rgba(253, 224, 71, 0.22)';
      clockCtx.setLineDash([4, 4]);
      clockCtx.beginPath();
      clockCtx.moveTo(x1, yTop);
      clockCtx.lineTo(x2, yBot);
      clockCtx.stroke();
      clockCtx.restore();
    }

    // Rastro activo del fotón en el ciclo actual
    clockCtx.save();
    clockCtx.strokeStyle = 'rgba(253, 224, 71, 0.75)';
    clockCtx.lineWidth = 2.4;
    clockCtx.beginPath();
    clockCtx.moveTo(x0, yBot);
    if (phaseS <= 1) {
      clockCtx.lineTo(xCur, yCur);
    } else {
      clockCtx.lineTo(x1, yTop);
      clockCtx.lineTo(xCur, yCur);
    }
    clockCtx.stroke();
    clockCtx.restore();

    // Espejos móviles en su posición actual xCur
    drawMirror(xCur, yTop, mirrorW, COL.accent);
    drawMirror(xCur, yBot, mirrorW, COL.accent);

    // Fotón actual en S
    drawPhoton(xCur, yCur);

    // Barra inferior de estado
    clockCtx.fillStyle = 'rgba(255,255,255,0.48)';
    clockCtx.font = '10.5px Consolas, monospace';
    clockCtx.textAlign = 'center';
    clockCtx.fillText(
      `β = ${β.toFixed(4)} · γ = ${γ.toFixed(4)} · Ritmo móvil: 1/γ = ${(1 / γ * 100).toFixed(1)}% · Doppler Transversal (90°): f = ${ (1 / γ).toFixed(4) }·f₀`,
      W / 2, H - 10
    );
  }

  function drawMirror(xCenter, y, width, accentColor) {
    clockCtx.save();
    clockCtx.fillStyle = COL.mirror;
    clockCtx.strokeStyle = accentColor || COL.mirrorBorder;
    clockCtx.lineWidth = 1.8;
    clockCtx.fillRect(xCenter - width / 2, y - 3.5, width, 7);
    clockCtx.strokeRect(xCenter - width / 2, y - 3.5, width, 7);
    clockCtx.restore();
  }

  function drawGhostMirror(xCenter, y, width) {
    clockCtx.save();
    clockCtx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    clockCtx.lineWidth = 1;
    clockCtx.setLineDash([3, 3]);
    clockCtx.strokeRect(xCenter - width / 2, y - 3, width, 6);
    clockCtx.restore();
  }

  function drawPhoton(x, y) {
    clockCtx.save();
    clockCtx.fillStyle = COL.gold;
    clockCtx.shadowColor = COL.gold;
    clockCtx.shadowBlur = 14;
    clockCtx.beginPath();
    clockCtx.arc(x, y, 6, 0, Math.PI * 2);
    clockCtx.fill();
    clockCtx.restore();
  }

  function drawHeightIndicator(x, y0, y1, text) {
    clockCtx.save();
    clockCtx.strokeStyle = 'rgba(255,255,255,0.35)';
    clockCtx.lineWidth = 1.2;
    clockCtx.beginPath();
    clockCtx.moveTo(x, y0); clockCtx.lineTo(x, y1);
    clockCtx.moveTo(x - 4, y0); clockCtx.lineTo(x + 4, y0);
    clockCtx.moveTo(x - 4, y1); clockCtx.lineTo(x + 4, y1);
    clockCtx.stroke();
    clockCtx.fillStyle = COL.textMuted;
    clockCtx.font = '10px Consolas, monospace';
    clockCtx.textAlign = 'center';
    clockCtx.save();
    clockCtx.translate(x - 10, (y0 + y1) / 2);
    clockCtx.rotate(-Math.PI / 2);
    clockCtx.fillText(text, 0, 0);
    clockCtx.restore();
    clockCtx.restore();
  }

  function clockLoop(timestamp) {
    if (!state.clock.running || state.clock.paused) return;
    if (!state.clock.lastStamp) state.clock.lastStamp = timestamp;
    const delta = (timestamp - state.clock.lastStamp) / 1000;
    state.clock.lastStamp = timestamp;
    state.clock.time += delta;

    drawClock();
    updateClockReadouts();
    state.clock.animId = requestAnimationFrame(clockLoop);
  }

  if (btnClockPlay) {
    btnClockPlay.addEventListener('click', () => {
      if (state.clock.running && !state.clock.paused) return;
      if (state.clock.paused) {
        state.clock.paused = false;
        state.clock.running = true;
        state.clock.lastStamp = performance.now();
      } else {
        state.clock.time = 0;
        state.clock.running = true;
        state.clock.paused = false;
        state.clock.lastStamp = performance.now();
      }
      btnClockPlay.disabled = true;
      btnClockPlay.innerHTML = '<span class="btn-icon">⏸</span> Fotones en vuelo…';
      if (btnClockPause) {
        btnClockPause.disabled = false;
        btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      }
      state.clock.animId = requestAnimationFrame(clockLoop);
    });
  }

  if (btnClockPause) {
    btnClockPause.addEventListener('click', () => {
      if (!state.clock.running || state.clock.paused) return;
      state.clock.paused = true;
      cancelAnimationFrame(state.clock.animId);
      if (btnClockPlay) {
        btnClockPlay.disabled = false;
        btnClockPlay.innerHTML = '<span class="btn-icon">▶</span> Reanudar';
      }
      btnClockPause.disabled = true;
      btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausado';
    });
  }

  if (btnClockReset) {
    btnClockReset.addEventListener('click', () => {
      cancelAnimationFrame(state.clock.animId);
      state.clock.running = false;
      state.clock.paused  = false;
      state.clock.time    = 0;
      if (btnClockPlay) {
        btnClockPlay.disabled = false;
        btnClockPlay.innerHTML = '<span class="btn-icon">▶</span> Iniciar fotones';
      }
      if (btnClockPause) {
        btnClockPause.disabled = true;
        btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      }
      drawClock();
      updateClockReadouts();
    });
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO D.2: ESCÁNER DE CONTRACCIÓN DE LONGITUD
  ══════════════════════════════════════════════════════════ */
  function drawContraction() {
    if (!scanCtx || !scanCanvas) return;
    const W = scanCanvas.width;
    const H = scanCanvas.height;
    const β = state.beta;
    const γ = Lorentz.gamma(β);

    const valL0 = parseFloat(inputL0 ? inputL0.value : 100) || 100;
    const uL    = unitL0 ? unitL0.value : 'm';
    const valL  = valL0 / γ;

    scanCtx.fillStyle = COL.bg;
    scanCtx.fillRect(0, 0, W, H);

    // Grilla tenue
    scanCtx.strokeStyle = COL.grid;
    scanCtx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 16) {
      scanCtx.beginPath(); scanCtx.moveTo(x, 0); scanCtx.lineTo(x, H); scanCtx.stroke();
    }
    for (let y = 0; y <= H; y += H / 6) {
      scanCtx.beginPath(); scanCtx.moveTo(0, y); scanCtx.lineTo(W, y); scanCtx.stroke();
    }

    const yCenter = H * 0.50;
    const L0_px   = Math.min(W * 0.52, 360);
    const L_px    = Math.max(8, L0_px / γ);
    const H_obj   = 50;
    const xCenter = W * 0.48;

    // 1. Silueta punteada de longitud propia L₀ en S'
    scanCtx.save();
    scanCtx.strokeStyle = 'rgba(79, 158, 255, 0.42)';
    scanCtx.lineWidth = 1.6;
    scanCtx.setLineDash([6, 4]);
    scanCtx.beginPath();
    scanCtx.roundRect(xCenter - L0_px / 2, yCenter - H_obj / 2, L0_px, H_obj, 6);
    scanCtx.stroke();
    scanCtx.setLineDash([]);

    // Cota superior L₀
    const yTopCaliper = yCenter - H_obj / 2 - 14;
    scanCtx.strokeStyle = 'rgba(79, 158, 255, 0.55)';
    scanCtx.beginPath();
    scanCtx.moveTo(xCenter - L0_px / 2, yTopCaliper);
    scanCtx.lineTo(xCenter + L0_px / 2, yTopCaliper);
    scanCtx.moveTo(xCenter - L0_px / 2, yTopCaliper - 4);
    scanCtx.lineTo(xCenter - L0_px / 2, yTopCaliper + 4);
    scanCtx.moveTo(xCenter + L0_px / 2, yTopCaliper - 4);
    scanCtx.lineTo(xCenter + L0_px / 2, yTopCaliper + 4);
    scanCtx.stroke();

    scanCtx.fillStyle = COL.accent;
    scanCtx.font = 'bold 11px Consolas, monospace';
    scanCtx.textAlign = 'center';
    scanCtx.fillText(`En reposo S': Longitud propia L₀ = ${valL0} ${uL} (100%)`, xCenter, yTopCaliper - 8);
    scanCtx.restore();

    // 2. Nave contraída en dirección x (altura H_obj invariante)
    const x0 = xCenter - L_px / 2;
    const x1 = xCenter + L_px / 2;
    const y0 = yCenter - H_obj / 2;
    const y1 = yCenter + H_obj / 2;

    scanCtx.save();
    scanCtx.shadowColor = 'rgba(167, 139, 250, 0.35)';
    scanCtx.shadowBlur = 12;
    scanCtx.fillStyle = 'rgba(109, 40, 217, 0.85)';
    scanCtx.strokeStyle = '#a78bfa';
    scanCtx.lineWidth = 2;

    scanCtx.beginPath();
    scanCtx.moveTo(x0, yCenter - H_obj * 0.3);
    scanCtx.lineTo(x0 + L_px * 0.2, y0);
    scanCtx.lineTo(x1 - L_px * 0.25, y0);
    scanCtx.lineTo(x1, yCenter);
    scanCtx.lineTo(x1 - L_px * 0.25, y1);
    scanCtx.lineTo(x0 + L_px * 0.2, y1);
    scanCtx.lineTo(x0, yCenter + H_obj * 0.3);
    scanCtx.closePath();
    scanCtx.fill();
    scanCtx.stroke();
    scanCtx.shadowBlur = 0;

    // Cabina cian
    scanCtx.fillStyle = '#38bdf8';
    scanCtx.beginPath();
    scanCtx.roundRect(x1 - L_px * 0.45, yCenter - H_obj * 0.25, Math.max(2, L_px * 0.3), H_obj * 0.5, 3);
    scanCtx.fill();

    // Propulsor
    scanCtx.fillStyle = '#f43f5e';
    scanCtx.shadowColor = '#f43f5e';
    scanCtx.shadowBlur = 10;
    scanCtx.beginPath();
    scanCtx.arc(x0 - 4, yCenter, H_obj * 0.18, 0, Math.PI * 2);
    scanCtx.fill();
    scanCtx.restore();

    // 3. Cota de altura transversal invariante H = H₀
    drawHeightIndicatorScan(xCenter + L0_px / 2 + 18, y0, y1, "H = H₀ (Invariante)");

    // 4. Calibrador inferior de medición simultánea en S (Δt = 0): L = L₀/γ
    scanCtx.save();
    scanCtx.strokeStyle = COL.amber;
    scanCtx.lineWidth = 2;
    const yCaliper = yCenter + H_obj / 2 + 18;
    scanCtx.beginPath();
    scanCtx.moveTo(x0, yCaliper);
    scanCtx.lineTo(x1, yCaliper);
    scanCtx.moveTo(x0, yCaliper - 5); scanCtx.lineTo(x0, yCaliper + 5);
    scanCtx.moveTo(x1, yCaliper - 5); scanCtx.lineTo(x1, yCaliper + 5);
    scanCtx.stroke();

    const pct = ((1 / γ) * 100).toFixed(1);
    scanCtx.fillStyle = COL.amber;
    scanCtx.font = 'bold 11px Consolas, monospace';
    scanCtx.textAlign = 'center';
    scanCtx.fillText(
      `En movimiento S (Δt = 0, β = ${β.toFixed(4)}): L = L₀/γ = ${valL.toFixed(2)} ${uL} (${pct}% de L₀ · γ = ${γ.toFixed(3)})`,
      xCenter, yCaliper + 18
    );

    scanCtx.fillStyle = 'rgba(255,255,255,0.4)';
    scanCtx.font = '10px Consolas, monospace';
    scanCtx.fillText('⟷ Arrastra horizontalmente sobre este lienzo o usa la barra superior para variar β', W / 2, H - 8);
    scanCtx.restore();
  }

  function drawHeightIndicatorScan(x, y0, y1, text) {
    scanCtx.save();
    scanCtx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
    scanCtx.lineWidth = 1.4;
    scanCtx.beginPath();
    scanCtx.moveTo(x, y0); scanCtx.lineTo(x, y1);
    scanCtx.moveTo(x - 4, y0); scanCtx.lineTo(x + 4, y0);
    scanCtx.moveTo(x - 4, y1); scanCtx.lineTo(x + 4, y1);
    scanCtx.stroke();
    scanCtx.fillStyle = COL.green;
    scanCtx.font = '10px Consolas, monospace';
    scanCtx.textAlign = 'left';
    scanCtx.fillText(text, x + 8, (y0 + y1) / 2 + 3);
    scanCtx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO D.3: GRÁFICA E = γmc² VS ENERGÍA CLÁSICA
  ══════════════════════════════════════════════════════════ */
  function drawEnergyCanvas() {
    if (!energyCtx || !energyCanvas) return;
    const W = energyCanvas.width;
    const H = energyCanvas.height;
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const pObj = PARTICLES[state.particle] || PARTICLES.electron;

    energyCtx.fillStyle = COL.bg;
    energyCtx.fillRect(0, 0, W, H);

    const padL = 68;
    const padR = 38;
    const padT = 34;
    const padB = 42;
    const plotW = Math.max(100, W - padL - padR);
    const plotH = Math.max(100, H - padT - padB);

    // Escala vertical dinámica: muestra hasta γ = 6 (o se adapta suavemente si β es muy alto)
    const maxY = Math.min(30, Math.max(6, Math.ceil(γ * 1.18)));
    const xOfBeta  = (b) => padL + Math.min(1, Math.max(0, b)) * plotW;
    const yOfGamma = (g) => padT + plotH - (Math.min(maxY, Math.max(0, g)) / maxY) * plotH;

    // 1. Grilla y ejes
    energyCtx.strokeStyle = COL.grid;
    energyCtx.lineWidth = 1;
    energyCtx.fillStyle = COL.textMuted;
    energyCtx.font = '10px Consolas, monospace';

    for (let i = 0; i <= 10; i++) {
      const bVal = i / 10;
      const x = xOfBeta(bVal);
      energyCtx.beginPath();
      energyCtx.moveTo(x, padT);
      energyCtx.lineTo(x, padT + plotH);
      energyCtx.stroke();

      energyCtx.textAlign = 'center';
      energyCtx.fillText(bVal.toFixed(1), x, padT + plotH + 15);
    }

    const yStep = maxY <= 8 ? 1 : (maxY <= 16 ? 2 : 5);
    for (let gVal = 0; gVal <= maxY; gVal += yStep) {
      const y = yOfGamma(gVal);
      energyCtx.beginPath();
      energyCtx.moveTo(padL, y);
      energyCtx.lineTo(padL + plotW, y);
      energyCtx.stroke();

      energyCtx.textAlign = 'right';
      energyCtx.fillText(`${gVal} E₀`, padL - 8, y + 3);
    }

    // Leyenda superior con el nombre de la partícula activa y su energía en reposo E₀
    const fmtVal = (v) => pObj.sci ? `${v.toExponential(2)} ${pObj.unit}` : `${v.toFixed(pObj.dec)} ${pObj.unit}`;
    energyCtx.fillStyle = COL.text;
    energyCtx.font = 'bold 11.5px Segoe UI, sans-serif';
    energyCtx.textAlign = 'left';
    energyCtx.fillText(
      `Sistema activo: ${pObj.name} (E₀ = ${fmtVal(pObj.e0)})  ·  Haz clic o arrastra en la gráfica para mover β`,
      padL, 19
    );

    // Etiqueta del eje X
    energyCtx.fillStyle = COL.text;
    energyCtx.font = 'bold 11px Segoe UI, sans-serif';
    energyCtx.textAlign = 'center';
    energyCtx.fillText('Velocidad normalizada β = v / c', padL + plotW / 2, H - 8);

    // 2. Línea horizontal de Energía en Reposo E₀ = mc² (γ = 1)
    const yE0 = yOfGamma(1);
    energyCtx.save();
    energyCtx.strokeStyle = 'rgba(79, 158, 255, 0.45)';
    energyCtx.lineWidth = 1.5;
    energyCtx.setLineDash([4, 4]);
    energyCtx.beginPath();
    energyCtx.moveTo(padL, yE0);
    energyCtx.lineTo(padL + plotW, yE0);
    energyCtx.stroke();
    energyCtx.fillStyle = COL.accent;
    energyCtx.font = '10px Consolas, monospace';
    energyCtx.textAlign = 'left';
    energyCtx.fillText(`Energía en reposo E₀ = mc² = ${fmtVal(pObj.e0)}`, padL + 8, yE0 - 6);
    energyCtx.restore();

    // 3. Barrera de la luz en β = 1.0 (asíntota vertical)
    const xLight = xOfBeta(1.0);
    energyCtx.save();
    energyCtx.strokeStyle = COL.amber;
    energyCtx.lineWidth = 2;
    energyCtx.setLineDash([6, 4]);
    energyCtx.beginPath();
    energyCtx.moveTo(xLight, padT);
    energyCtx.lineTo(xLight, padT + plotH);
    energyCtx.stroke();
    energyCtx.fillStyle = COL.amber;
    energyCtx.font = 'bold 10px Consolas, monospace';
    energyCtx.textAlign = 'right';
    energyCtx.fillText('Muro de la luz v = c (E → ∞)', xLight - 6, padT + 14);
    energyCtx.restore();

    // 4. Curva Clásica: E_cl / E₀ = 1 + ½ β² (rojo punteado)
    energyCtx.save();
    energyCtx.strokeStyle = COL.red;
    energyCtx.lineWidth = 2;
    energyCtx.setLineDash([6, 4]);
    energyCtx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const b = i / 200;
      const eClas = 1 + 0.5 * b * b;
      const x = xOfBeta(b);
      const y = yOfGamma(eClas);
      if (i === 0) energyCtx.moveTo(x, y);
      else energyCtx.lineTo(x, y);
    }
    energyCtx.stroke();
    energyCtx.restore();

    // 5. Curva Relativista: E / E₀ = γ(β) = 1 / √(1 − β²) (verde sólido)
    energyCtx.save();
    energyCtx.strokeStyle = COL.green;
    energyCtx.lineWidth = 2.6;
    energyCtx.beginPath();
    for (let i = 0; i <= 350; i++) {
      const b = (i / 350) * 0.9992;
      const g = 1 / Math.sqrt(1 - b * b);
      const x = xOfBeta(b);
      const y = yOfGamma(g);
      if (i === 0) energyCtx.moveTo(x, y);
      else energyCtx.lineTo(x, y);
      if (g > maxY * 1.05) break;
    }
    energyCtx.stroke();
    energyCtx.restore();

    // 6. Marcador interactivo en el β actual
    const xCur     = xOfBeta(β);
    const yCurRel  = yOfGamma(γ);
    const yCurClas = yOfGamma(1 + 0.5 * β * β);

    // Segmento vertical de energía cinética K = (γ - 1)E₀
    energyCtx.save();
    energyCtx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
    energyCtx.lineWidth = 2.2;
    energyCtx.beginPath();
    energyCtx.moveTo(xCur, yE0);
    energyCtx.lineTo(xCur, yCurRel);
    energyCtx.stroke();

    // Punto clásico
    energyCtx.fillStyle = COL.red;
    energyCtx.beginPath();
    energyCtx.arc(xCur, yCurClas, 4.5, 0, Math.PI * 2);
    energyCtx.fill();

    // Punto relativista
    energyCtx.fillStyle = COL.green;
    energyCtx.shadowColor = COL.green;
    energyCtx.shadowBlur = 12;
    energyCtx.beginPath();
    energyCtx.arc(xCur, yCurRel, 6.5, 0, Math.PI * 2);
    energyCtx.fill();
    energyCtx.restore();

    // Etiqueta flotante del punto actual con valores en unidades reales
    const EtotVal = γ * pObj.e0;
    const KVal    = (γ - 1) * pObj.e0;
    energyCtx.save();
    energyCtx.fillStyle = COL.green;
    energyCtx.font = 'bold 11px Consolas, monospace';
    const alignRight = β > 0.62;
    energyCtx.textAlign = alignRight ? 'right' : 'left';
    const labelX = alignRight ? xCur - 12 : xCur + 12;
    const labelY = Math.max(padT + 22, yCurRel - 8);
    energyCtx.fillText(`E = ${γ.toFixed(2)} E₀ = ${fmtVal(EtotVal)}`, labelX, labelY);
    energyCtx.fillStyle = COL.amber;
    energyCtx.fillText(`K = ${(γ - 1).toFixed(2)} E₀ = ${fmtVal(KVal)}`, labelX, labelY + 14);
    energyCtx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     INTERACCIÓN DIRECTA EN CANVASES (ARRASTRAR PARA CAMBIAR β)
  ══════════════════════════════════════════════════════════ */
  function attachBetaDrag(canvasEl, getBetaFromX) {
    if (!canvasEl) return;
    let dragging = false;

    const handlePointer = (clientX) => {
      const rect = canvasEl.getBoundingClientRect();
      const relX = clientX - rect.left;
      const newBeta = getBetaFromX(relX, rect.width);
      setGlobalBeta(newBeta);
    };

    canvasEl.addEventListener('mousedown', (e) => {
      dragging = true;
      handlePointer(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      handlePointer(e.clientX);
    });
    window.addEventListener('mouseup', () => { dragging = false; });

    canvasEl.addEventListener('touchstart', (e) => {
      if (e.touches.length > 0) {
        dragging = true;
        handlePointer(e.touches[0].clientX);
      }
    }, { passive: true });
    canvasEl.addEventListener('touchmove', (e) => {
      if (!dragging || e.touches.length === 0) return;
      handlePointer(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', () => { dragging = false; });
  }

  // Arrastrar en el Escáner de Contracción (D.2)
  attachBetaDrag(scanCanvas, (x, w) => {
    const norm = (x - 40) / Math.max(100, w - 80);
    return Math.min(0.998, Math.max(0, norm));
  });

  // Arrastrar en la Gráfica de Energía (D.3)
  attachBetaDrag(energyCanvas, (x, w) => {
    const padL = 68;
    const padR = 38;
    const norm = (x - padL) / Math.max(100, w - padL - padR);
    return Math.min(0.995, Math.max(0, norm));
  });

  /* ══════════════════════════════════════════════════════════
     EVENTOS DE CONTROLES Y PRESETS
  ══════════════════════════════════════════════════════════ */
  function setGlobalBeta(newBeta) {
    state.beta = Math.min(0.9995, Math.max(0, Number(newBeta.toFixed(4))));
    if (betaSlider) betaSlider.value = state.beta;

    // Sincronizar botón activo en D.1, D.2 y D.3
    [presetsD1, presetsD2, presetsD3Beta].forEach(group => {
      if (!group) return;
      group.querySelectorAll('.preset-btn').forEach(btn => {
        const b = parseFloat(btn.dataset.beta);
        if (Math.abs(b - state.beta) < 0.0004) btn.classList.add('active-preset');
        else btn.classList.remove('active-preset');
      });
    });

    updateAll();
    drawAll();
  }

  if (betaSlider) {
    betaSlider.addEventListener('input', () => {
      setGlobalBeta(parseFloat(betaSlider.value));
    });
  }

  // Presets Tab D.1
  if (presetsD1) {
    presetsD1.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const b  = parseFloat(btn.dataset.beta);
        const t0 = parseFloat(btn.dataset.t0);
        if (inputT0 && !isNaN(t0)) inputT0.value = t0;
        if (unitT0) {
          if (b >= 0.99) unitT0.value = 'μs';
          else if (t0 >= 10) unitT0.value = 'años';
          else unitT0.value = 's';
        }
        setGlobalBeta(b);
      });
    });
  }

  // Presets Tab D.2
  if (presetsD2) {
    presetsD2.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const b  = parseFloat(btn.dataset.beta);
        const l0 = parseFloat(btn.dataset.l0);
        const ul = btn.dataset.ul;
        if (inputL0 && !isNaN(l0)) inputL0.value = l0;
        if (unitL0 && ul) unitL0.value = ul;
        setGlobalBeta(b);
      });
    });
  }

  // Presets de Partícula Tab D.3
  if (presetsD3Part) {
    presetsD3Part.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsD3Part.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');
        state.particle = btn.dataset.part || 'electron';
        updateAll();
        drawEnergyCanvas();
      });
    });
  }

  // Presets de Velocidad Tab D.3
  if (presetsD3Beta) {
    presetsD3Beta.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = parseFloat(btn.dataset.beta);
        if (!isNaN(b)) setGlobalBeta(b);
      });
    });
  }

  // Inputs numéricos directos
  if (inputT0) inputT0.addEventListener('input', updateAll);
  if (unitT0)  unitT0.addEventListener('change', updateAll);
  if (inputL0) inputL0.addEventListener('input', () => { updateAll(); drawContraction(); });
  if (unitL0)  unitL0.addEventListener('change', () => { updateAll(); drawContraction(); });

  /* ══════════════════════════════════════════════════════════
     INICIALIZACIÓN
  ══════════════════════════════════════════════════════════ */
  resizeCanvases();
  updateAll();
  drawAll();

})();
