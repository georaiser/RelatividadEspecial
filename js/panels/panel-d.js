/**
 * panel-d.js — Panel D: Dilatación Temporal y Contracción de Longitud
 *
 * 1. Simulación del Reloj de Luz (Light Clock):
 *    - Reloj S' (reposo): fotón rebotando verticalmente (Δt₀ = 2L/c).
 *    - Reloj S (movimiento): fotón recorriendo trayectoria diagonal a rapidez c (Δt = γ·Δt₀).
 *    - Triángulo de Pitágoras en tiempo real.
 *
 * 2. Escáner de Contracción de Longitud:
 *    - Contracción física del objeto a L = L₀/γ mientras las dimensiones transversales se conservan.
 *
 * 3. Calculadora Cinemática Relativista interactiva.
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
    grid:         'rgba(255,255,255,0.035)',
    sep:          'rgba(255,255,255,0.08)',
    accent:       '#4f9eff',
    purple:       '#a78bfa',
    gold:         '#fde047',
    goldGlow:     'rgba(253, 224, 71, 0.4)',
    mirror:       '#94a3b8',
    mirrorBorder: 'rgba(255, 255, 255, 0.4)',
    triangle:     'rgba(251, 191, 36, 0.6)',
    textMuted:    'rgba(255, 255, 255, 0.55)',
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO DEL RELOJ DE LUZ
  ══════════════════════════════════════════════════════════ */
  let clockState = {
    beta:      0.60,
    running:   false,
    paused:    false,
    time:      0,            // tiempo en segundos virtuales
    lastStamp: 0,
    animId:    null,
    ticksSp:   0,
    ticksS:    0,
  };

  /* ══════════════════════════════════════════════════════════
     DOM ELEMENTS — RELOJ DE LUZ
  ══════════════════════════════════════════════════════════ */
  const clockCanvas   = document.getElementById('canvas-light-clock');
  const clockCtx      = clockCanvas ? clockCanvas.getContext('2d') : null;
  const dSliderEl     = document.getElementById('d-speed-slider');
  const dBetaRd       = document.getElementById('d-beta-readout');
  const dGammaVal     = document.getElementById('d-gamma-val');
  const btnClockPlay  = document.getElementById('btn-clock-play');
  const btnClockPause = document.getElementById('btn-clock-pause');
  const btnClockReset = document.getElementById('btn-clock-reset');
  const presetsDBeta  = document.getElementById('presets-d-beta');

  const clockSpT      = document.getElementById('clock-sp-t');
  const clockSpTicks  = document.getElementById('clock-sp-ticks');
  const clockST       = document.getElementById('clock-s-t');
  const clockSRatio   = document.getElementById('clock-s-ratio');

  /* ══════════════════════════════════════════════════════════
     DOM ELEMENTS — ESCÁNER DE CONTRACCIÓN
  ══════════════════════════════════════════════════════════ */
  const scanCanvas    = document.getElementById('canvas-contraction');
  const scanCtx       = scanCanvas ? scanCanvas.getContext('2d') : null;
  const cSliderEl     = document.getElementById('c-speed-slider');
  const cBetaRd       = document.getElementById('c-beta-readout');
  const cGammaVal     = document.getElementById('c-gamma-val');
  const cRatioVal     = document.getElementById('c-ratio-val');
  const scanL0        = document.getElementById('scan-l0');
  const scanL         = document.getElementById('scan-l');
  const scanPct       = document.getElementById('scan-pct');

  /* ══════════════════════════════════════════════════════════
     DOM ELEMENTS — CALCULADORA
  ══════════════════════════════════════════════════════════ */
  const calcBSlider   = document.getElementById('calc-b-slider');
  const calcBRd       = document.getElementById('calc-b-readout');
  const calcGVal      = document.getElementById('calc-g-val');
  const presetsDCalc  = document.getElementById('presets-d-calc');

  const inputT0       = document.getElementById('input-t0');
  const unitT0        = document.getElementById('unit-t0');
  const resT          = document.getElementById('res-t');
  const resDtDiff     = document.getElementById('res-dt-diff');

  const inputL0       = document.getElementById('input-l0');
  const unitL0        = document.getElementById('unit-l0');
  const resL          = document.getElementById('res-l');
  const resLPct       = document.getElementById('res-l-pct');

  /* ══════════════════════════════════════════════════════════
     RESIZE HANDLERS
  ══════════════════════════════════════════════════════════ */
  function resizeCanvases() {
    if (clockCanvas && clockCanvas.parentElement) {
      clockCanvas.width  = clockCanvas.parentElement.clientWidth;
      clockCanvas.height = clockCanvas.parentElement.clientWidth < 600 ? 320 : 380;
    }
    if (scanCanvas && scanCanvas.parentElement) {
      scanCanvas.width  = scanCanvas.parentElement.clientWidth;
      scanCanvas.height = scanCanvas.parentElement.clientWidth < 600 ? 240 : 280;
    }
    drawClock();
    drawContraction();
  }
  window.addEventListener('resize', () => requestAnimationFrame(resizeCanvases));

  /* ══════════════════════════════════════════════════════════
     DIBUJO: RELOJ DE LUZ (LIGHT CLOCK)
  ══════════════════════════════════════════════════════════ */
  function drawClock() {
    if (!clockCtx) return;
    const W = clockCanvas.width;
    const H = clockCanvas.height;
    const β = clockState.beta;
    const γ = Lorentz.gamma(β);

    // Fondo
    clockCtx.fillStyle = COL.bg;
    clockCtx.fillRect(0, 0, W, H);

    // Grilla tenue
    clockCtx.strokeStyle = COL.grid;
    clockCtx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 16) {
      clockCtx.beginPath(); clockCtx.moveTo(x, 0); clockCtx.lineTo(x, H); clockCtx.stroke();
    }
    for (let y = 0; y <= H; y += H / 8) {
      clockCtx.beginPath(); clockCtx.moveTo(0, y); clockCtx.lineTo(W, y); clockCtx.stroke();
    }

    // Separador horizontal central
    clockCtx.strokeStyle = COL.sep;
    clockCtx.lineWidth = 1.5;
    clockCtx.setLineDash([6, 4]);
    clockCtx.beginPath();
    clockCtx.moveTo(0, H / 2); clockCtx.lineTo(W, H / 2);
    clockCtx.stroke();
    clockCtx.setLineDash([]);

    const bandH = H / 2;
    const mirrorH = 80;       // Altura L entre espejos (px)
    const mirrorW = 50;       // Ancho del espejo (px)
    const cSpeed  = 80;       // Rapidez de la luz en px/s (1 segundo propio = 1 viaje vertical L)

    // Tiempo propio en S' (t' = t / γ)
    const t_lab = clockState.time;
    const t_prop = t_lab / γ;

    // ── 1. PISTA SUPERIOR: RELOJ S' (En reposo) ───────────
    const yMidSp = bandH * 0.5;
    const xCenterSp = W * 0.45;
    const yTopSp    = yMidSp - mirrorH / 2;
    const yBotSp    = yMidSp + mirrorH / 2;

    // Rótulo superior
    clockCtx.fillStyle = COL.purple;
    clockCtx.font = 'bold 12px Segoe UI, sans-serif';
    clockCtx.textAlign = 'left';
    clockCtx.fillText("⏱ Pista 1: Reloj S' (En reposo con el observador · Tiempo propio Δt₀)", 14, 20);

    // Espejos S'
    drawMirror(xCenterSp, yTopSp, mirrorW, "Espejo superior");
    drawMirror(xCenterSp, yBotSp, mirrorW, "Espejo inferior");

    // Flecha de distancia L
    drawHeightIndicator(xCenterSp - mirrorW / 2 - 14, yTopSp, yBotSp, "L");

    // Posición del fotón en S' (rebote vertical)
    // ciclo completo: 0 -> 1 sube, 1 -> 2 baja
    const cycleSp = (t_prop * (cSpeed / mirrorH)) % 2;
    let yPhotonSp = (cycleSp <= 1) ? yBotSp - cycleSp * mirrorH : yTopSp + (cycleSp - 1) * mirrorH;

    // Trazador del rayo vertical en S'
    clockCtx.strokeStyle = 'rgba(253, 224, 71, 0.25)';
    clockCtx.lineWidth = 2;
    clockCtx.beginPath();
    clockCtx.moveTo(xCenterSp, yBotSp);
    clockCtx.lineTo(xCenterSp, yTopSp);
    clockCtx.stroke();

    // Fotón S'
    drawPhoton(xCenterSp, yPhotonSp);

    // Lectura en vivo S'
    clockCtx.fillStyle = COL.purple;
    clockCtx.font = 'bold 11px Consolas, monospace';
    clockCtx.textAlign = 'right';
    clockCtx.fillText(`t' = ${t_prop.toFixed(2)} s (Propio)`, W - 14, 20);

    // ── 2. PISTA INFERIOR: RELOJ S (En movimiento a v = βc) ──
    const yMidS = bandH * 1.5;
    const yTopS = yMidS - mirrorH / 2;
    const yBotS = yMidS + mirrorH / 2;

    // Rótulo inferior
    clockCtx.fillStyle = COL.accent;
    clockCtx.font = 'bold 12px Segoe UI, sans-serif';
    clockCtx.textAlign = 'left';
    clockCtx.fillText(`⏱ Pista 2: Reloj S (Visto en movimiento a v = +${β.toFixed(2)}c · Tiempo dilatado Δt = γ·Δt₀)`, 14, bandH + 20);

    // Movimiento horizontal de los espejos en el laboratorio S
    const vLab = β * cSpeed;
    const xStartS = 60;
    const travelPeriod = (W - 120) / vLab || 10;
    const xOffset = (t_lab % travelPeriod) * vLab;
    const xCenterS = xStartS + xOffset;

    // Espejos móviles S
    drawMirror(xCenterS, yTopS, mirrorW, "Espejo");
    drawMirror(xCenterS, yBotS, mirrorW, "Espejo");

    // Posición del fotón en S (trayectoria diagonal a rapidez c)
    // El fotón viaja en diagonal. En el tiempo de laboratorio t_lab:
    const cycleS = (t_lab * (cSpeed / (mirrorH * γ))) % 2;
    let yPhotonS = (cycleS <= 1) ? yBotS - cycleS * mirrorH : yTopS + (cycleS - 1) * mirrorH;

    // Trazador del triángulo de Pitágoras
    const halfPeriodTime = (mirrorH * γ) / cSpeed;
    const dxHalfPeriod = vLab * halfPeriodTime;
    const xApex = xCenterS;

    // Triángulo rectángulo superpuesto
    clockCtx.save();
    clockCtx.strokeStyle = COL.triangle;
    clockCtx.lineWidth = 1.5;
    clockCtx.setLineDash([4, 3]);
    clockCtx.beginPath();
    clockCtx.moveTo(xCenterS - dxHalfPeriod * 0.5, yBotS);
    clockCtx.lineTo(xCenterS, yTopS);
    clockCtx.lineTo(xCenterS, yBotS);
    clockCtx.closePath();
    clockCtx.stroke();
    clockCtx.setLineDash([]);

    // Etiquetas del triángulo
    clockCtx.fillStyle = '#fbbf24';
    clockCtx.font = '10px Consolas, monospace';
    clockCtx.textAlign = 'center';
    clockCtx.fillText("c·Δt/2", xCenterS - dxHalfPeriod * 0.28, yMidS - 6);
    clockCtx.fillText("v·Δt/2", xCenterS - dxHalfPeriod * 0.25, yBotS + 14);
    clockCtx.fillText("L", xCenterS + 12, yMidS);
    clockCtx.restore();

    // Fotón S (en la posición actual del espejo móvil)
    drawPhoton(xCenterS, yPhotonS);

    // Lectura en vivo S
    clockCtx.fillStyle = COL.accent;
    clockCtx.font = 'bold 11px Consolas, monospace';
    clockCtx.textAlign = 'right';
    clockCtx.fillText(`t = ${t_lab.toFixed(2)} s (γ = ${γ.toFixed(4)})`, W - 14, bandH + 20);

    // Pie de estado
    clockCtx.save();
    clockCtx.fillStyle = 'rgba(255,255,255,0.35)';
    clockCtx.font = '10px Consolas, monospace';
    clockCtx.textAlign = 'center';
    clockCtx.fillText(
      `β = ${β.toFixed(2)} · γ = ${γ.toFixed(4)} · Factor dilatación = ${γ.toFixed(3)}x · Relación: Δt = ${γ.toFixed(2)} · Δt₀`,
      W / 2, H - 7
    );
    clockCtx.restore();
  }

  function drawMirror(xCenter, y, width, label) {
    clockCtx.save();
    clockCtx.fillStyle = COL.mirror;
    clockCtx.strokeStyle = COL.mirrorBorder;
    clockCtx.lineWidth = 2;
    clockCtx.fillRect(xCenter - width / 2, y - 3, width, 6);
    clockCtx.strokeRect(xCenter - width / 2, y - 3, width, 6);
    clockCtx.restore();
  }

  function drawPhoton(x, y) {
    clockCtx.save();
    clockCtx.fillStyle = COL.gold;
    clockCtx.shadowColor = COL.gold;
    clockCtx.shadowBlur = 14;
    clockCtx.beginPath();
    clockCtx.arc(x, y, 5, 0, Math.PI * 2);
    clockCtx.fill();
    clockCtx.shadowBlur = 0;
    clockCtx.restore();
  }

  function drawHeightIndicator(x, y0, y1, text) {
    clockCtx.save();
    clockCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    clockCtx.lineWidth = 1;
    clockCtx.beginPath();
    clockCtx.moveTo(x, y0);
    clockCtx.lineTo(x, y1);
    clockCtx.moveTo(x - 3, y0); clockCtx.lineTo(x + 3, y0);
    clockCtx.moveTo(x - 3, y1); clockCtx.lineTo(x + 3, y1);
    clockCtx.stroke();

    clockCtx.fillStyle = COL.textMuted;
    clockCtx.font = '10px Consolas, monospace';
    clockCtx.textAlign = 'right';
    clockCtx.fillText(text, x - 6, (y0 + y1) / 2 + 3);
    clockCtx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: ESCÁNER DE CONTRACCIÓN DE LONGITUD
  ══════════════════════════════════════════════════════════ */
  function drawContraction() {
    if (!scanCtx) return;
    const W = scanCanvas.width;
    const H = scanCanvas.height;
    const β = parseFloat(cSliderEl.value);
    const γ = Lorentz.gamma(β);

    // Fondo
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

    const yCenter = H * 0.52;
    const L0_px = Math.min(W * 0.40, 240);    // Longitud propia (px)
    const L_px  = L0_px / γ;                 // Longitud contraída (px)
    const H_obj = 44;                        // Altura transversal invariante (px)
    const xCenter = W * 0.50;

    // 1. Silueta fantasma de longitud propia L₀
    scanCtx.save();
    scanCtx.strokeStyle = 'rgba(79, 158, 255, 0.35)';
    scanCtx.lineWidth = 1.5;
    scanCtx.setLineDash([5, 4]);
    scanCtx.beginPath();
    scanCtx.roundRect(xCenter - L0_px / 2, yCenter - H_obj / 2, L0_px, H_obj, 6);
    scanCtx.stroke();
    scanCtx.setLineDash([]);
    scanCtx.fillStyle = 'rgba(79, 158, 255, 0.5)';
    scanCtx.font = '10px Consolas, monospace';
    scanCtx.textAlign = 'center';
    scanCtx.fillText(`Longitud en reposo: L₀ = 100 m`, xCenter, yCenter - H_obj / 2 - 24);
    scanCtx.restore();

    // 2. Nave espacial contraída en movimiento a velocidad v
    scanCtx.save();
    scanCtx.shadowColor = 'rgba(167, 139, 250, 0.35)';
    scanCtx.shadowBlur = 12;
    scanCtx.fillStyle = 'rgba(109, 40, 217, 0.85)';
    scanCtx.strokeStyle = '#a78bfa';
    scanCtx.lineWidth = 2;

    const x0 = xCenter - L_px / 2;
    const x1 = xCenter + L_px / 2;
    const y0 = yCenter - H_obj / 2;
    const y1 = yCenter + H_obj / 2;

    // Forma aerodinámica de la nave contraída
    scanCtx.beginPath();
    scanCtx.moveTo(x0, yCenter - H_obj * 0.3);
    scanCtx.lineTo(x0 + L_px * 0.2, y0);
    scanCtx.lineTo(x1 - L_px * 0.25, y0);
    scanCtx.lineTo(x1, yCenter);                 // punta delantera
    scanCtx.lineTo(x1 - L_px * 0.25, y1);
    scanCtx.lineTo(x0 + L_px * 0.2, y1);
    scanCtx.lineTo(x0, yCenter + H_obj * 0.3);
    scanCtx.closePath();
    scanCtx.fill();
    scanCtx.stroke();
    scanCtx.shadowBlur = 0;

    // Cabina de cristal cian
    scanCtx.fillStyle = '#38bdf8';
    scanCtx.beginPath();
    scanCtx.roundRect(x1 - L_px * 0.45, yCenter - H_obj * 0.25, L_px * 0.3, H_obj * 0.5, 4);
    scanCtx.fill();

    // Propulsor de plasma
    scanCtx.fillStyle = '#f43f5e';
    scanCtx.shadowColor = '#f43f5e';
    scanCtx.shadowBlur = 10;
    scanCtx.beginPath();
    scanCtx.arc(x0 - 4, yCenter, H_obj * 0.2, 0, Math.PI * 2);
    scanCtx.fill();
    scanCtx.shadowBlur = 0;
    scanCtx.restore();

    // 3. Calibrador de cota inferior para L contraída
    scanCtx.save();
    scanCtx.strokeStyle = '#fbbf24';
    scanCtx.lineWidth = 2;
    const yCaliper = yCenter + H_obj / 2 + 18;
    scanCtx.beginPath();
    scanCtx.moveTo(x0, yCaliper);
    scanCtx.lineTo(x1, yCaliper);
    scanCtx.moveTo(x0, yCaliper - 5); scanCtx.lineTo(x0, yCaliper + 5);
    scanCtx.moveTo(x1, yCaliper - 5); scanCtx.lineTo(x1, yCaliper + 5);
    scanCtx.stroke();

    scanCtx.fillStyle = '#fbbf24';
    scanCtx.font = 'bold 11px Consolas, monospace';
    scanCtx.textAlign = 'center';
    const pct = ((1 / γ) * 100).toFixed(1);
    scanCtx.fillText(`L = ${(100 / γ).toFixed(1)} m (${pct}% de L₀)`, xCenter, yCaliper + 16);
    scanCtx.restore();

    // Actualizar lecturas del DOM
    cBetaRd.textContent   = `β = ${β.toFixed(2)}`;
    cGammaVal.textContent = γ.toFixed(4);
    cRatioVal.textContent = `L = ${pct}% de L₀`;
    scanL.textContent     = `${(100 / γ).toFixed(1)} m`;
    scanPct.textContent   = `-${(100 - parseFloat(pct)).toFixed(1)}%`;
  }

  /* ══════════════════════════════════════════════════════════
     ANIMACIÓN Y LOOP DEL RELOJ DE LUZ
  ══════════════════════════════════════════════════════════ */
  function clockLoop(timestamp) {
    if (!clockState.running || clockState.paused) return;

    if (!clockState.lastStamp) clockState.lastStamp = timestamp;
    const delta = (timestamp - clockState.lastStamp) / 1000;
    clockState.lastStamp = timestamp;

    clockState.time += delta;

    drawClock();
    updateClockReadouts();

    clockState.animId = requestAnimationFrame(clockLoop);
  }

  function updateClockReadouts() {
    const β = clockState.beta;
    const γ = Lorentz.gamma(β);
    const t_lab = clockState.time;
    const t_prop = t_lab / γ;

    const ticksSp = Math.floor(t_prop);
    const ticksS  = Math.floor(t_lab);

    clockSpT.textContent     = `${t_prop.toFixed(2)} s`;
    clockSpTicks.textContent = `${ticksSp} ticks`;
    clockST.textContent      = `${t_lab.toFixed(2)} s`;
    clockSRatio.textContent  = `γ = ${γ.toFixed(4)}`;
  }

  /* ══════════════════════════════════════════════════════════
     CONTROLES DEL RELOJ DE LUZ
  ══════════════════════════════════════════════════════════ */
  function updateClockBeta() {
    const β = clockState.beta;
    const γ = Lorentz.gamma(β);
    dBetaRd.textContent   = `β = ${β.toFixed(2)}`;
    dGammaVal.textContent = γ.toFixed(4);
    drawClock();
    updateClockReadouts();
  }

  dSliderEl.addEventListener('input', () => {
    clockState.beta = parseFloat(dSliderEl.value);
    if (presetsDBeta) {
      presetsDBeta.querySelectorAll('.preset-btn').forEach(b => {
        if (Math.abs(parseFloat(b.dataset.beta) - clockState.beta) < 0.005) {
          b.classList.add('active-preset');
        } else {
          b.classList.remove('active-preset');
        }
      });
    }
    updateClockBeta();
  });

  if (presetsDBeta) {
    presetsDBeta.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsDBeta.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');
        clockState.beta = parseFloat(btn.dataset.beta);
        dSliderEl.value = clockState.beta;
        updateClockBeta();
      });
    });
  }

  btnClockPlay.addEventListener('click', () => {
    if (clockState.running && !clockState.paused) return;

    if (clockState.paused) {
      clockState.paused = false;
      clockState.running = true;
      clockState.lastStamp = performance.now();
      btnClockPlay.disabled = true;
      btnClockPlay.innerHTML = '<span class="btn-icon">⏸</span> Fotones en vuelo…';
      btnClockPause.disabled = false;
      btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      clockState.animId = requestAnimationFrame(clockLoop);
      return;
    }

    clockState.time = 0;
    clockState.running = true;
    clockState.paused = false;
    clockState.lastStamp = performance.now();

    btnClockPlay.disabled = true;
    btnClockPlay.innerHTML = '<span class="btn-icon">⏸</span> Fotones en vuelo…';
    btnClockPause.disabled = false;
    btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    clockState.animId = requestAnimationFrame(clockLoop);
  });

  btnClockPause.addEventListener('click', () => {
    if (!clockState.running) return;

    if (!clockState.paused) {
      clockState.paused = true;
      cancelAnimationFrame(clockState.animId);
      btnClockPlay.disabled = false;
      btnClockPlay.innerHTML = '<span class="btn-icon">▶</span> Reanudar';
      btnClockPause.disabled = true;
      btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausado';
    }
  });

  btnClockReset.addEventListener('click', () => {
    cancelAnimationFrame(clockState.animId);
    clockState.running = false;
    clockState.paused  = false;
    clockState.time    = 0;

    btnClockPlay.disabled = false;
    btnClockPlay.innerHTML = '<span class="btn-icon">▶</span> Iniciar fotones';
    btnClockPause.disabled = true;
    btnClockPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    drawClock();
    updateClockReadouts();
  });

  /* ══════════════════════════════════════════════════════════
     CONTROLES DEL ESCÁNER DE CONTRACCIÓN
  ══════════════════════════════════════════════════════════ */
  cSliderEl.addEventListener('input', () => {
    drawContraction();
  });

  /* ══════════════════════════════════════════════════════════
     CALCULADORA RELATIVISTA DE TIEMPO Y LONGITUD
  ══════════════════════════════════════════════════════════ */
  function updateCalculator() {
    const β = parseFloat(calcBSlider.value);
    const γ = Lorentz.gamma(β);

    calcBRd.textContent = `β = ${β.toFixed(4)}`;
    calcGVal.textContent = γ.toFixed(4);

    // 1. Tiempo
    const valT0 = parseFloat(inputT0.value) || 0;
    const uT = unitT0.value;
    const valT = valT0 * γ;
    const diffT = valT - valT0;

    resT.textContent = `${valT.toFixed(3)} ${uT}`;
    resDtDiff.textContent = `+${diffT.toFixed(3)} ${uT} (Atraso: ${(diffT / valT * 100).toFixed(1)}%)`;

    // 2. Longitud
    const valL0 = parseFloat(inputL0.value) || 0;
    const uL = unitL0.value;
    const valL = valL0 / γ;
    const pctContracted = (1 - 1 / γ) * 100;

    resL.textContent = `${valL.toFixed(3)} ${uL}`;
    resLPct.textContent = `-${pctContracted.toFixed(2)}% (Factor: ${(1/γ).toFixed(4)})`;
  }

  calcBSlider.addEventListener('input', () => {
    if (presetsDCalc) {
      const bVal = parseFloat(calcBSlider.value);
      presetsDCalc.querySelectorAll('.preset-btn').forEach(b => {
        if (Math.abs(parseFloat(b.dataset.b) - bVal) < 0.005) {
          b.classList.add('active-preset');
        } else {
          b.classList.remove('active-preset');
        }
      });
    }
    updateCalculator();
  });

  if (presetsDCalc) {
    presetsDCalc.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsDCalc.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');
        calcBSlider.value = btn.dataset.b;
        updateCalculator();
      });
    });
  }

  inputT0.addEventListener('input', updateCalculator);
  unitT0.addEventListener('change', updateCalculator);
  inputL0.addEventListener('input', updateCalculator);
  unitL0.addEventListener('change', updateCalculator);

  /* ══════════════════════════════════════════════════════════
     INICIALIZACIÓN
  ══════════════════════════════════════════════════════════ */
  updateClockBeta();
  resizeCanvases();
  updateCalculator();

})();
