/**
 * panel-a.js — Panel A: Postulados de Einstein y Simultaneidad Relativa
 *
 * Experimento del Vagón de Einstein (Simultaneidad Relativa):
 *   - Pista 1 (arriba): Perspectiva del Pasajero (Sistema S' en reposo propio).
 *       El vagón está inmóvil; los pulsos viajan a c hacia izquierda y derecha.
 *       Alcanzan el Detector A y el Detector B AL MISMO TIEMPO EXACTO (Δt' = 0).
 *
 *   - Pista 2 (abajo): Perspectiva del Andén (Sistema S en reposo, vagón a +β·c).
 *       El vagón avanza hacia la derecha. La luz viaja a rapidez c.
 *       El Detector A avanza hacia la luz (impacta antes: t_A = t₀ / k).
 *       El Detector B huye de la luz (impacta después: t_B = k · t₀).
 *       Resultado: NO SON SIMULTÁNEOS (Δt = t_B − t_A > 0).
 *
 * Dependencias: js/physics/lorentz.js
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONSTANTES FÍSICAS Y DE DIBUJO
  ══════════════════════════════════════════════════════════ */
  const T_EMIT = 1.0;            // tiempo propio del impacto en S' (segundos virtuales)
  const SECONDS_REAL = 4.0;      // duración en segundos reales de la animación

  const COL = {
    bg:           '#09111e',
    grid:         'rgba(255,255,255,0.035)',
    sep:          'rgba(255,255,255,0.08)',
    trackS:       '#4f9eff',
    trackSp:      '#a78bfa',
    wagonS:       '#1e293b',
    wagonBorderS: 'rgba(79, 158, 255, 0.6)',
    wagonSp:      '#241b35',
    wagonBorderSp:'rgba(167, 139, 250, 0.6)',
    light:        '#fde047',
    detectorOff:  '#ef4444',
    detectorOn:   '#34d399',
    textMuted:    'rgba(255, 255, 255, 0.55)',
  };

  const bondik = (β) => Math.sqrt((1 + β) / (1 - β));

  /* ══════════════════════════════════════════════════════════
     ESTADO
  ══════════════════════════════════════════════════════════ */
  let state = {
    beta:       0.60,
    running:    false,
    paused:     false,
    timeReal:   0,        // tiempo transcurrido en segundos
    lastStamp:  0,
    animReqId:  null,
  };

  /* ══════════════════════════════════════════════════════════
     ELEMENTOS DOM
  ══════════════════════════════════════════════════════════ */
  const canvas         = document.getElementById('anim-canvas');
  const ctx            = canvas.getContext('2d');
  const sliderEl       = document.getElementById('speed-slider');
  const betaRd         = document.getElementById('beta-readout');
  const gammaVal       = document.getElementById('gamma-val');
  const kReadout       = document.getElementById('k-readout');
  const btnPlay        = document.getElementById('btn-play');
  const btnPause       = document.getElementById('btn-pause');
  const btnReset       = document.getElementById('btn-reset');

  const presetsBetaEl  = document.getElementById('presets-a-beta');
  const presetsUEl     = document.getElementById('presets-a-u');

  // Tarjetas de lectura
  const obsSpA         = document.getElementById('obs-sp-a');
  const obsSpB         = document.getElementById('obs-sp-b');
  const obsSpDt        = document.getElementById('obs-sp-dt');
  const obsSpVerd      = document.getElementById('obs-sp-verdict');
  const badgeSp        = document.getElementById('badge-sp');

  const obsSA          = document.getElementById('obs-s-a');
  const obsSB          = document.getElementById('obs-s-b');
  const obsSDt         = document.getElementById('obs-s-dt');
  const obsSVerd       = document.getElementById('obs-s-verdict');
  const badgeS         = document.getElementById('badge-s');

  // Calculadora de suma de velocidades
  const uSlider        = document.getElementById('u-slider');
  const uReadout       = document.getElementById('u-readout');
  const vaddG          = document.getElementById('vadd-galileo');
  const vaddL          = document.getElementById('vadd-lorentz');
  const vaddBarG       = document.getElementById('vadd-bar-g');
  const vaddBarL       = document.getElementById('vadd-bar-l');
  const vaddGWarn      = document.getElementById('vadd-g-warn');
  const vaddLNote      = document.getElementById('vadd-l-note');

  /* ══════════════════════════════════════════════════════════
     CANVAS RESIZE
  ══════════════════════════════════════════════════════════ */
  function resizeCanvas() {
    if (!canvas || !canvas.parentElement) return;
    const parentW = canvas.parentElement.clientWidth;
    if (parentW <= 0) return;
    canvas.width  = parentW;
    canvas.height = parentW < 600 ? 360 : 420;
    draw();
  }
  window.addEventListener('resize', () => requestAnimationFrame(resizeCanvas));

  /* ══════════════════════════════════════════════════════════
     DIBUJO DE ELEMENTOS
  ══════════════════════════════════════════════════════════ */
  function drawWagon(xCenter, yMid, halfW, halfH, isMoving, label, betaVal) {
    const x0 = xCenter - halfW;
    const x1 = xCenter + halfW;
    const y0 = yMid - halfH;
    const h  = halfH * 2;

    ctx.save();

    // Sombra del vagón
    ctx.shadowColor = isMoving ? 'rgba(79,158,255,0.25)' : 'rgba(167,139,250,0.25)';
    ctx.shadowBlur = 12;

    // Cuerpo del vagón
    ctx.fillStyle = isMoving ? COL.wagonS : COL.wagonSp;
    ctx.strokeStyle = isMoving ? COL.wagonBorderS : COL.wagonBorderSp;
    ctx.lineWidth = 2;

    // Rectángulo redondeado
    ctx.beginPath();
    ctx.roundRect(x0, y0, halfW * 2, h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ventanillas
    const nWin = 4;
    const winW = (halfW * 2 - 30) / (nWin + 1);
    const winH = halfH * 0.45;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= nWin; i++) {
      const wx = x0 + 15 + (i - 1) * (winW + (halfW * 2 - 30 - nWin * winW) / (nWin - 1));
      ctx.beginPath();
      ctx.roundRect(wx, y0 + 6, winW, winH, 3);
      ctx.fill();
      ctx.stroke();
    }

    // Ruedas
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    const rWheel = 6;
    const wheelY = y0 + h + rWheel - 1;
    [x0 + 16, x0 + 32, x1 - 32, x1 - 16].forEach(wx => {
      ctx.beginPath();
      ctx.arc(wx, wheelY, rWheel, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Rieles de tren
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, wheelY + rWheel);
    ctx.lineTo(canvas.width, wheelY + rWheel);
    ctx.stroke();

    // Etiqueta del vagón
    ctx.fillStyle = isMoving ? COL.trackS : COL.trackSp;
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, xCenter, y0 - 8);

    if (isMoving && betaVal > 0.01) {
      // Flecha de velocidad
      ctx.fillStyle = COL.trackS;
      ctx.font = '10px Consolas, monospace';
      ctx.fillText(`v = +${betaVal.toFixed(2)}c →`, xCenter, y0 + h + 24);
    }

    ctx.restore();
  }

  function drawDetector(x, y, isHit, label) {
    ctx.save();
    const color = isHit ? COL.detectorOn : COL.detectorOff;

    if (isHit) {
      // Resplandor de impacto
      ctx.shadowColor = COL.detectorOn;
      ctx.shadowBlur = 16;
      ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // Punto central del detector
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Etiqueta
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 18);
    ctx.restore();
  }

  function drawBulb(x, y, isEmitted) {
    ctx.save();
    if (isEmitted) {
      ctx.shadowColor = '#fde047';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#fde047';
    } else {
      ctx.fillStyle = '#64748b';
    }
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawObserverFigure(x, y, color, label) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;

    // cabeza
    ctx.beginPath(); ctx.arc(x, y - 14, 5, 0, Math.PI * 2); ctx.fill();
    // cuerpo
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 5); ctx.stroke();
    // brazos
    ctx.beginPath(); ctx.moveTo(x - 7, y - 3); ctx.lineTo(x + 7, y - 3); ctx.stroke();
    // piernas
    ctx.beginPath();
    ctx.moveTo(x, y + 5); ctx.lineTo(x - 5, y + 14);
    ctx.moveTo(x, y + 5); ctx.lineTo(x + 5, y + 14);
    ctx.stroke();

    ctx.font = 'bold 10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 26);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     FUNCIÓN PRINCIPAL DE RENDERIZADO
  ══════════════════════════════════════════════════════════ */
  function draw() {
    const W = canvas.width;
    const H = canvas.height;
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const k = bondik(β);

    // Fondo
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    // Grilla tenue
    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 16) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += H / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Separador horizontal central entre Pista 1 y Pista 2
    ctx.strokeStyle = COL.sep;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    const bandH = H / 2;
    const ySp   = bandH * 0.45;    // Centro Pista 1 (Vagón S')
    const yS    = bandH * 1.45;    // Centro Pista 2 (Andén S)

    // Parámetros de escala
    const L0 = Math.min(W * 0.22, 130);           // Semilongitud del vagón en reposo (px)
    const L  = L0 / γ;                            // Semilongitud contraída en S (px)
    const speedC = L0 / T_EMIT;                   // Rapidez de la luz en px/segundo virtual
    const maxSimTime = Math.max(k * 1.3, 2.5);   // Tiempo virtual máximo para la animación

    // Tiempo virtual actual transcurrido
    const simTime = (state.timeReal / SECONDS_REAL) * maxSimTime;
    const hasEmitted = simTime > 0.001;

    // ── 1. PISTA SUPERIOR: PERSPECTIVA DEL VAGÓN (S' en reposo) ──
    const xCenterSp = W * 0.50;
    const halfHSp = 24;

    // Rótulo superior
    ctx.fillStyle = COL.trackSp;
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText("🚀 Pista 1: Perspectiva de S' (Dentro del vagón en reposo propio)", 14, 20);

    // Vagón S' fijo en el centro
    drawWagon(xCenterSp, ySp, L0, halfHSp, false, "Vagón S' (en reposo)", 0);

    // Pasajero en el centro del vagón
    drawObserverFigure(xCenterSp, ySp - 2, COL.trackSp, "Pasajero S'");

    // Bombilla en el centro
    drawBulb(xCenterSp, ySp - 8, hasEmitted);

    // Detectores A (trasero, izq) y B (delantero, der)
    const xDetSpA = xCenterSp - L0;
    const xDetSpB = xCenterSp + L0;
    const isHitSpA = simTime >= T_EMIT;
    const isHitSpB = simTime >= T_EMIT;
    drawDetector(xDetSpA, ySp, isHitSpA, "Det. A");
    drawDetector(xDetSpB, ySp, isHitSpB, "Det. B");

    // Pulsos de luz en S'
    if (hasEmitted) {
      const dLuzSp = Math.min(simTime * speedC, L0);
      const xPulseSpLeft  = xCenterSp - dLuzSp;
      const xPulseSpRight = xCenterSp + dLuzSp;

      ctx.save();
      ctx.fillStyle = COL.light;
      ctx.shadowColor = COL.light;
      ctx.shadowBlur = 10;

      // Pulso hacia la izquierda
      ctx.beginPath(); ctx.arc(xPulseSpLeft, ySp, 4, 0, Math.PI * 2); ctx.fill();
      // Pulso hacia la derecha
      ctx.beginPath(); ctx.arc(xPulseSpRight, ySp, 4, 0, Math.PI * 2); ctx.fill();

      // Rayo trazador
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xPulseSpLeft, ySp); ctx.lineTo(xPulseSpRight, ySp);
      ctx.stroke();
      ctx.restore();
    }

    // Cronómetro S' en pantalla
    ctx.fillStyle = isHitSpA && isHitSpB ? COL.detectorOn : COL.textMuted;
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'right';
    const statusTextSp = (isHitSpA && isHitSpB) ? "¡Impacto Simultáneo en A y B!" : `t' = ${simTime.toFixed(2)} s`;
    ctx.fillText(statusTextSp, W - 14, 20);

    // ── 2. PISTA INFERIOR: PERSPECTIVA DEL ANDÉN (S en reposo, vagón a +βc) ──
    const xOrigS = W * 0.28;                      // Posición del andén / origen de emisión en S
    const vS     = β * speedC;                    // Rapidez del vagón en S (px/s)
    const xCenterS = xOrigS + vS * simTime;       // Posición del centro del vagón en S
    const halfHS = 24;

    // Rótulo inferior
    ctx.fillStyle = COL.trackS;
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🏢 Pista 2: Perspectiva de S (Desde el andén · Vagón pasando a +${β.toFixed(2)}c)`, 14, bandH + 20);

    // Observador en el andén (fijo en xOrigS)
    drawObserverFigure(xOrigS, yS + 32, COL.trackS, "Observador S (Andén)");

    // Marca del punto de emisión en el andén (x = 0)
    ctx.save();
    ctx.strokeStyle = 'rgba(79, 158, 255, 0.35)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xOrigS, yS - halfHS - 12);
    ctx.lineTo(xOrigS, yS + halfHS + 12);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(79, 158, 255, 0.6)';
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Origen emisión (x=0)', xOrigS, yS - halfHS - 16);
    ctx.restore();

    // Vagón contraído moviéndose hacia la derecha
    drawWagon(xCenterS, yS, L, halfHS, true, `Vagón S' contraído (L = L₀/γ)`, β);

    // Detectores A (trasero) y B (delantero) en el vagón móvil
    const xDetSA = xCenterS - L;
    const xDetSB = xCenterS + L;

    // Tiempos físicos de impacto en S
    const tImpactSA = T_EMIT / k;       // Impacta antes: t_A = 1 / k
    const tImpactSB = T_EMIT * k;       // Impacta después: t_B = k

    const isHitSA = simTime >= tImpactSA;
    const isHitSB = simTime >= tImpactSB;
    drawDetector(xDetSA, yS, isHitSA, "Det. A");
    drawDetector(xDetSB, yS, isHitSB, "Det. B");

    // Pulsos de luz en S (se propagan esféricamente desde el punto fijo de emisión xOrigS a rapidez c)
    if (hasEmitted) {
      // Posición del pulso hacia la izquierda
      const dLuzLeftS = Math.min(simTime, tImpactSA) * speedC;
      const xPulseSLeft = xOrigS - dLuzLeftS;

      // Posición del pulso hacia la derecha
      const dLuzRightS = Math.min(simTime, tImpactSB) * speedC;
      const xPulseSRight = xOrigS + dLuzRightS;

      ctx.save();
      ctx.fillStyle = COL.light;
      ctx.shadowColor = COL.light;
      ctx.shadowBlur = 10;

      // Pulso izquierdo
      if (!isHitSA || simTime <= tImpactSA + 0.3) {
        ctx.beginPath(); ctx.arc(xPulseSLeft, yS, 4, 0, Math.PI * 2); ctx.fill();
      }
      // Pulso derecho
      if (!isHitSB || simTime <= tImpactSB + 0.3) {
        ctx.beginPath(); ctx.arc(xPulseSRight, yS, 4, 0, Math.PI * 2); ctx.fill();
      }

      // Trazador desde el punto de emisión
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xPulseSLeft, yS); ctx.lineTo(xPulseSRight, yS);
      ctx.stroke();
      ctx.restore();
    }

    // Cronómetro S en pantalla
    ctx.fillStyle = isHitSB ? '#fbbf24' : (isHitSA ? '#38bdf8' : COL.textMuted);
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'right';
    let statusTextS = `t = ${simTime.toFixed(2)} s`;
    if (isHitSB) {
      statusTextS = `¡NO simultáneos! (A impactó a ${tImpactSA.toFixed(2)}s, B a ${tImpactSB.toFixed(2)}s)`;
    } else if (isHitSA) {
      statusTextS = `1.er Impacto en Det. A (t = ${tImpactSA.toFixed(2)}s) · B aún huyendo...`;
    }
    ctx.fillText(statusTextS, W - 14, bandH + 20);

    // ── Pie de información ────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    ctx.font = '10px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(
      `β = ${β.toFixed(2)} · γ = ${γ.toFixed(4)} · Factor Bondi k = ${k.toFixed(3)} · Δt_andén = ${(tImpactSB - tImpactSA).toFixed(2)} s`,
      W / 2, H - 7
    );
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     ACTUALIZAR TARJETAS DE LECTURA (S y S')
  ══════════════════════════════════════════════════════════ */
  function updateReadouts() {
    const β = state.beta;
    const k = bondik(β);
    const simTime = (state.timeReal / SECONDS_REAL) * Math.max(k * 1.3, 2.5);

    const tImpactSpA = T_EMIT;
    const tImpactSpB = T_EMIT;
    const dtSp       = 0.00;

    const tImpactSA  = T_EMIT / k;
    const tImpactSB  = T_EMIT * k;
    const dtS        = tImpactSB - tImpactSA;

    if (state.timeReal === 0) {
      obsSpA.textContent = obsSpB.textContent = obsSpDt.textContent = '—';
      obsSA.textContent  = obsSB.textContent  = obsSDt.textContent  = '—';
      obsSpVerd.textContent = 'Pulsa "Emitir flash" para iniciar';
      obsSVerd.textContent  = 'Pulsa "Emitir flash" para iniciar';
      obsSpVerd.style.background = 'rgba(255,255,255,0.04)';
      obsSpVerd.style.color      = 'var(--color-text-dim)';
      obsSVerd.style.background  = 'rgba(255,255,255,0.04)';
      obsSVerd.style.color       = 'var(--color-text-dim)';
      badgeSp.className = 'train-status-badge waiting';
      badgeSp.textContent = 'En espera';
      badgeS.className = 'train-status-badge waiting';
      badgeS.textContent = 'En espera';
      return;
    }

    // ── Tarjeta S' (Vagón) ────────────────────────────────
    const isHitSp = simTime >= T_EMIT;
    obsSpA.textContent  = isHitSp ? `${tImpactSpA.toFixed(2)} s` : `en vuelo (${simTime.toFixed(2)}s)`;
    obsSpB.textContent  = isHitSp ? `${tImpactSpB.toFixed(2)} s` : `en vuelo (${simTime.toFixed(2)}s)`;
    obsSpDt.textContent = isHitSp ? `${dtSp.toFixed(2)} s` : '—';

    if (isHitSp) {
      obsSpVerd.textContent = '✓ SIMULTÁNEOS: Ambos detectores impactados a t\' = 1.00 s';
      obsSpVerd.style.background = 'rgba(52, 211, 153, 0.12)';
      obsSpVerd.style.color      = 'var(--color-success)';
      badgeSp.className = 'train-status-badge simultaneous';
      badgeSp.textContent = '✓ Simultáneo';
    } else {
      obsSpVerd.textContent = 'Pulsos de luz viajando hacia los detectores a rapidez c...';
      obsSpVerd.style.background = 'rgba(167, 139, 250, 0.08)';
      obsSpVerd.style.color      = 'var(--color-accent-2)';
      badgeSp.className = 'train-status-badge waiting';
      badgeSp.textContent = 'En vuelo...';
    }

    // ── Tarjeta S (Andén) ─────────────────────────────────
    const isHitSA = simTime >= tImpactSA;
    const isHitSB = simTime >= tImpactSB;

    obsSA.textContent  = isHitSA ? `${tImpactSA.toFixed(2)} s (Primero)` : `en vuelo (${simTime.toFixed(2)}s)`;
    obsSB.textContent  = isHitSB ? `${tImpactSB.toFixed(2)} s (Segundo)` : `en vuelo (${simTime.toFixed(2)}s)`;
    obsSDt.textContent = isHitSB ? `${dtS.toFixed(2)} s` : (isHitSA ? `esperando impacto B...` : '—');

    if (isHitSB) {
      obsSVerd.textContent = `⚡ NO SIMULTÁNEOS: Det. A impactó a ${tImpactSA.toFixed(2)}s y Det. B a ${tImpactSB.toFixed(2)}s (Δt = ${dtS.toFixed(2)}s)`;
      obsSVerd.style.background = 'rgba(251, 191, 36, 0.12)';
      obsSVerd.style.color      = '#fbbf24';
      badgeS.className = 'train-status-badge non-simultaneous';
      badgeS.textContent = '⚡ No simultáneo';
    } else if (isHitSA) {
      obsSVerd.textContent = `⚡ 1.er Impacto en Det. A (t = ${tImpactSA.toFixed(2)}s) · La luz sigue persiguiendo al Det. B`;
      obsSVerd.style.background = 'rgba(79, 158, 255, 0.12)';
      obsSVerd.style.color      = 'var(--color-accent)';
      badgeS.className = 'train-status-badge waiting';
      badgeS.textContent = 'Impacto A ocurrido';
    } else {
      obsSVerd.textContent = 'Observando el paso del vagón y la propagación de la luz a rapidez c...';
      obsSVerd.style.background = 'rgba(79, 158, 255, 0.08)';
      obsSVerd.style.color      = 'var(--color-accent)';
      badgeS.className = 'train-status-badge waiting';
      badgeS.textContent = 'En vuelo...';
    }
  }

  /* ══════════════════════════════════════════════════════════
     LOOP DE ANIMACIÓN
  ══════════════════════════════════════════════════════════ */
  function animLoop(timestamp) {
    if (!state.running || state.paused) return;

    if (!state.lastStamp) state.lastStamp = timestamp;
    const delta = (timestamp - state.lastStamp) / 1000;
    state.lastStamp = timestamp;

    state.timeReal += delta;

    draw();
    updateReadouts();

    if (state.timeReal < SECONDS_REAL) {
      state.animReqId = requestAnimationFrame(animLoop);
    } else {
      state.timeReal = SECONDS_REAL;
      state.running  = false;
      state.paused   = false;
      btnPlay.disabled   = false;
      btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Emitir de nuevo';
      btnPause.disabled  = true;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      draw();
      updateReadouts();
    }
  }

  /* ══════════════════════════════════════════════════════════
     CONTROLES DE VELOCIDAD Y PRESETS
  ══════════════════════════════════════════════════════════ */
  function updateVelocityBar() {
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const k = bondik(β);
    if (betaRd)   betaRd.textContent   = `β = ${β.toFixed(2)}`;
    if (gammaVal) gammaVal.textContent = γ.toFixed(4);
    if (kReadout) kReadout.textContent = `k = ${k.toFixed(3)}`;
  }

  sliderEl.addEventListener('input', () => {
    state.beta = parseFloat(sliderEl.value);
    if (presetsBetaEl) {
      presetsBetaEl.querySelectorAll('.preset-btn').forEach(b => {
        if (Math.abs(parseFloat(b.dataset.beta) - state.beta) < 0.005) {
          b.classList.add('active-preset');
        } else {
          b.classList.remove('active-preset');
        }
      });
    }
    updateVelocityBar();
    updateVelocityAddition();
    draw();
    updateReadouts();
  });

  if (presetsBetaEl) {
    presetsBetaEl.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsBetaEl.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');
        state.beta = parseFloat(btn.dataset.beta);
        sliderEl.value = state.beta;
        updateVelocityBar();
        updateVelocityAddition();
        draw();
        updateReadouts();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     BOTONES PLAY / PAUSE / RESET
  ══════════════════════════════════════════════════════════ */
  btnPlay.addEventListener('click', () => {
    if (state.running && !state.paused) return;

    if (state.paused) {
      state.paused    = false;
      state.running   = true;
      state.lastStamp = performance.now();
      btnPlay.disabled   = true;
      btnPlay.innerHTML  = '<span class="btn-icon">⏸</span> En vuelo…';
      btnPause.disabled  = false;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      state.animReqId = requestAnimationFrame(animLoop);
      return;
    }

    // Nuevo flash
    state.timeReal  = 0;
    state.running   = true;
    state.paused    = false;
    state.lastStamp = performance.now();

    btnPlay.disabled   = true;
    btnPlay.innerHTML  = '<span class="btn-icon">⏸</span> En vuelo…';
    btnPause.disabled  = false;
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    state.animReqId = requestAnimationFrame(animLoop);
  });

  btnPause.addEventListener('click', () => {
    if (!state.running) return;

    if (!state.paused) {
      state.paused = true;
      cancelAnimationFrame(state.animReqId);
      btnPlay.disabled   = false;
      btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Reanudar';
      btnPause.disabled  = true;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausado';
    }
  });

  btnReset.addEventListener('click', () => {
    cancelAnimationFrame(state.animReqId);
    state.running  = false;
    state.paused   = false;
    state.timeReal = 0;

    btnPlay.disabled   = false;
    btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Emitir flash';
    btnPause.disabled  = true;
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    draw();
    updateReadouts();
  });

  /* ══════════════════════════════════════════════════════════
     CALCULADORA DE ADICIÓN DE VELOCIDADES
  ══════════════════════════════════════════════════════════ */
  function updateVelocityAddition() {
    const u = parseFloat(uSlider.value);
    const β = state.beta;

    uReadout.textContent = `u = ${u.toFixed(2)}c`;

    // Galilean
    const uGalileo = u - β;
    vaddG.textContent = uGalileo.toFixed(4) + ' c';
    const barG = Math.min(Math.abs(uGalileo), 1) * 100;
    vaddBarG.style.width = barG + '%';

    if (Math.abs(u) > 0.9999) {
      vaddGWarn.innerHTML = `⚠ Para la luz: u' = c − v = <strong>${uGalileo.toFixed(3)} c</strong> &lt; c — ¡viola el 2.° postulado!`;
    } else if (uGalileo < 0) {
      vaddGWarn.innerHTML = `← Sentido hacia la izquierda en S' (porque S' viaja más rápido hacia la derecha).`;
    } else {
      vaddGWarn.innerHTML = `→ Sentido hacia la derecha en S'.`;
    }

    // Lorentz: u' = (u − β)/(1 − u*β)
    const denom = 1 - u * β;
    const uLorentz = (denom !== 0) ? (u - β) / denom : NaN;
    const absL = Math.min(Math.abs(uLorentz), 1);
    vaddL.textContent = isNaN(uLorentz) ? '—' : uLorentz.toFixed(4) + ' c';
    vaddBarL.style.width = (absL * 100) + '%';

    if (Math.abs(u) > 0.9999) {
      vaddLNote.innerHTML = `✓ Para la luz: u' = (c − v)/(1 − c·v/c²) = c·(1−β)/(1−β) = <strong>1.0000 c</strong> siempre.`;
    } else {
      vaddLNote.textContent = Math.abs(uLorentz) < 1.001 ? '✓ Rapidez siempre menor que c (|u\'| < c)' : '—';
    }
  }

  uSlider.addEventListener('input', () => {
    const uVal = parseFloat(uSlider.value);
    if (presetsUEl) {
      presetsUEl.querySelectorAll('.preset-btn').forEach(b => {
        if (Math.abs(parseFloat(b.dataset.u) - uVal) < 0.005) {
          b.classList.add('active-preset');
        } else {
          b.classList.remove('active-preset');
        }
      });
    }
    updateVelocityAddition();
  });

  if (presetsUEl) {
    presetsUEl.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsUEl.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');
        uSlider.value = btn.dataset.u;
        updateVelocityAddition();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     INICIALIZACIÓN
  ══════════════════════════════════════════════════════════ */
  updateVelocityBar();
  updateVelocityAddition();
  resizeCanvas();
  updateReadouts();

})();
