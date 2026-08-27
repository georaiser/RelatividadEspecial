/**
 * panel-a.js — Panel A: Postulados de Einstein
 *
 * Animación dual-lane:
 *   Lane S (arriba, azul):    perspectiva del sistema en reposo.
 *                             — S fijo a la izquierda
 *                             — S' se desplaza a la derecha con velocidad β
 *                             — Pulso de luz avanza al 100% de la pista
 *
 *   Lane S' (abajo, violeta): perspectiva del sistema en movimiento.
 *                             — S' fijo a la izquierda
 *                             — S se desplaza a la IZQUIERDA con velocidad β
 *                             — Pulso de luz avanza a velocidad c (100% de la pista)
 *                             — Línea punteada roja: predicción galileana (c − β·c)
 *
 * Correcciones sobre versión anterior:
 *   - x' calculado con transformación de Lorentz correcta: x' = γ(1−β)·t
 *   - t' calculado correctamente: t' = γ(1−β)·t
 *   - Ratio x/t y x'/t' mostrados dinámicamente (siempre = c)
 *   - Canvas auto-escala sin desbordamiento
 *   - Añadida calculadora de adición de velocidades
 *   - Añadido botón Pausar
 *
 * Depende de: js/physics/lorentz.js
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONSTANTES Y PALETA
  ══════════════════════════════════════════════════════════ */
  const N_TICKS = 160;   // número de ticks para recorrer la pista completa en S

  const COL = {
    bg:        '#09111e',
    grid:      'rgba(255,255,255,0.04)',
    trackS:    'rgba(79,158,255,0.6)',
    trackSp:   'rgba(167,139,250,0.6)',
    light:     '#fde047',
    galilean:  'rgba(248,113,113,0.7)',
    accent:    '#4f9eff',
    purple:    '#a78bfa',
    sep:       'rgba(255,255,255,0.08)',
    text:      'rgba(255,255,255,0.55)',
  };

  /* ══════════════════════════════════════════════════════════
     ESTADO
  ══════════════════════════════════════════════════════════ */
  let state = {
    beta:    0.6,
    running: false,
    paused:  false,
    tick:    0,
    animId:  null,
  };

  /* ══════════════════════════════════════════════════════════
     DOM
  ══════════════════════════════════════════════════════════ */
  const canvas     = document.getElementById('anim-canvas');
  const ctx        = canvas.getContext('2d');
  const sliderEl   = document.getElementById('speed-slider');
  const betaRd     = document.getElementById('beta-readout');
  const gammaVal   = document.getElementById('gamma-val');
  const btnPlay    = document.getElementById('btn-play');
  const btnPause   = document.getElementById('btn-pause');
  const btnReset   = document.getElementById('btn-reset');

  // Observer readouts
  const obsSX      = document.getElementById('obs-s-x');
  const obsST      = document.getElementById('obs-s-t');
  const obsSSpd    = document.getElementById('obs-s-speed');
  const obsSVerd   = document.getElementById('obs-s-verdict');
  const obsSpX     = document.getElementById('obs-sp-x');
  const obsSpT     = document.getElementById('obs-sp-t');
  const obsSpSpd   = document.getElementById('obs-sp-speed');
  const obsSpVerd  = document.getElementById('obs-sp-verdict');

  // Velocity addition
  const uSlider    = document.getElementById('u-slider');
  const uReadout   = document.getElementById('u-readout');
  const vaddG      = document.getElementById('vadd-galileo');
  const vaddL      = document.getElementById('vadd-lorentz');
  const vaddBarG   = document.getElementById('vadd-bar-g');
  const vaddBarL   = document.getElementById('vadd-bar-l');
  const vaddGWarn  = document.getElementById('vadd-g-warn');
  const vaddLNote  = document.getElementById('vadd-l-note');

  /* ══════════════════════════════════════════════════════════
     CANVAS RESIZE
  ══════════════════════════════════════════════════════════ */
  function resizeCanvas() {
    canvas.width  = canvas.parentElement.clientWidth;
    canvas.height = 380;
    draw();
  }
  window.addEventListener('resize', resizeCanvas);

  /* ══════════════════════════════════════════════════════════
     LAYOUT HELPERS
     El canvas se divide en dos bandas horizontales iguales.
  ══════════════════════════════════════════════════════════ */
  function layout() {
    const W = canvas.width;
    const H = canvas.height;
    const PAD_L = 64;          // margen izquierdo para labels
    const PAD_R = 20;
    const trackW = W - PAD_L - PAD_R;
    const bandH  = H / 2;
    return { W, H, PAD_L, PAD_R, trackW, bandH };
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: FONDO Y GRILLA
  ══════════════════════════════════════════════════════════ */
  function drawBackground() {
    const { W, H } = layout();
    ctx.fillStyle = COL.bg;
    ctx.fillRect(0, 0, W, H);

    // grilla
    ctx.strokeStyle = COL.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 16) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y <= H; y += H / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // separador central
    ctx.strokeStyle = COL.sep;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: PISTA DE UN SISTEMA
  ══════════════════════════════════════════════════════════ */
  function drawLane(yMid, color, labelSys, isMoving) {
    const { W, PAD_L, PAD_R, trackW } = layout();
    const trackY = yMid;
    const trackX0 = PAD_L;
    const trackX1 = PAD_L + trackW;

    // Fondo de la banda (color tenue)
    ctx.save();
    ctx.fillStyle = isMoving ? 'rgba(167,139,250,0.025)' : 'rgba(79,158,255,0.025)';
    ctx.fillRect(0, yMid - 80, W, 160);
    ctx.restore();

    // Label del sistema
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'bold 13px Segoe UI, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(labelSys, PAD_L - 8, yMid + 5);
    ctx.restore();

    // Pista horizontal punteada
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(trackX0, trackY);
    ctx.lineTo(trackX1, trackY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: FIGURA DE OBSERVADOR (stickman)
  ══════════════════════════════════════════════════════════ */
  function drawObserver(x, y, color, label, beta_label, movingLeft) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 1.5;

    // cabeza
    ctx.beginPath(); ctx.arc(x, y - 16, 7, 0, Math.PI * 2); ctx.fill();
    // cuerpo
    ctx.beginPath(); ctx.moveTo(x, y - 9); ctx.lineTo(x, y + 7); ctx.stroke();
    // brazos
    ctx.beginPath(); ctx.moveTo(x - 9, y - 2); ctx.lineTo(x + 9, y - 2); ctx.stroke();
    // piernas
    ctx.beginPath();
    ctx.moveTo(x, y + 7); ctx.lineTo(x - 7, y + 18);
    ctx.moveTo(x, y + 7); ctx.lineTo(x + 7, y + 18);
    ctx.stroke();

    // label con velocidad
    ctx.fillStyle = color;
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 30);
    if (beta_label) {
      ctx.font = '9px Consolas, monospace';
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.fillText(beta_label, x, y + 41);
    }

    // flecha de movimiento
    if (beta_label && beta_label !== '') {
      const arrowX = movingLeft ? x - 22 : x + 22;
      const arrowTip = movingLeft ? x - 14 : x + 14;
      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(movingLeft ? x - 10 : x + 10, y - 2);
      ctx.lineTo(arrowX, y - 2);
      ctx.stroke();
      // arrowhead
      ctx.fillStyle = color;
      ctx.beginPath();
      if (movingLeft) {
        ctx.moveTo(arrowTip, y - 2);
        ctx.lineTo(arrowTip + 7, y - 5);
        ctx.lineTo(arrowTip + 7, y + 1);
      } else {
        ctx.moveTo(arrowTip, y - 2);
        ctx.lineTo(arrowTip - 7, y - 5);
        ctx.lineTo(arrowTip - 7, y + 1);
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: FRENTE DEL PULSO DE LUZ
  ══════════════════════════════════════════════════════════ */
  function drawWaveFront(xPx, yMid, bandH, solid) {
    if (xPx <= 0) return;
    const { PAD_L, trackW } = layout();
    const x = PAD_L + xPx;
    const y0 = yMid - bandH * 0.45;
    const y1 = yMid + bandH * 0.45;

    ctx.save();
    if (solid) {
      // Glow
      const grad = ctx.createLinearGradient(x - 30, 0, x + 15, 0);
      grad.addColorStop(0, 'rgba(253,224,71,0)');
      grad.addColorStop(0.7, 'rgba(253,224,71,0.15)');
      grad.addColorStop(1, 'rgba(253,224,71,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(x - 30, y0, 45, y1 - y0);

      // Línea sólida amarilla
      ctx.strokeStyle = COL.light;
      ctx.lineWidth = 2.5;
      ctx.globalAlpha = 0.95;
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();

      // Etiqueta c
      ctx.fillStyle = COL.light;
      ctx.font = 'bold 12px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('c', x + 10, yMid - 8);

    } else {
      // Línea punteada roja = predicción galileana
      ctx.strokeStyle = COL.galilean;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.65;
      ctx.setLineDash([5, 4]);
      ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = COL.galilean;
      ctx.font = '9px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('c−v', x - 12, yMid + 20);
    }
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: PUNTO DE ORIGEN (antes de emitir)
  ══════════════════════════════════════════════════════════ */
  function drawOrigin(x, y) {
    ctx.save();
    ctx.fillStyle = 'rgba(253,224,71,0.6)';
    ctx.strokeStyle = COL.light;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.light;
    ctx.font = '9px Consolas, monospace';
    ctx.textAlign = 'left';
    ctx.fillText('t = 0', x + 10, y + 4);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     DIBUJO: LEYENDA DE BANDA
  ══════════════════════════════════════════════════════════ */
  function drawBandLabel(yTop, color, text) {
    const { W } = layout();
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'left';
    ctx.fillText(text, 4, yTop + 14);
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     FUNCIÓN PRINCIPAL DE DIBUJO
  ══════════════════════════════════════════════════════════ */
  function draw() {
    const { W, H, PAD_L, trackW, bandH } = layout();
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const t_norm = state.running || state.paused ? state.tick / N_TICKS : 0;

    drawBackground();

    // ── Centro de cada banda ──────────────────────────────
    const yS  = bandH * 0.5;   // centro de banda S
    const ySp = bandH * 1.5;   // centro de banda S'

    // ── Labels de banda ──────────────────────────────────
    drawBandLabel(0, COL.trackS, 'Perspectiva S (en reposo)');
    drawBandLabel(bandH, COL.trackSp, "Perspectiva S' (en movimiento)");

    // ── BANDA S (arriba): perspectiva de S ────────────────
    drawLane(yS, COL.trackS, 'S', false);

    // Observador S: fijo en PAD_L
    drawObserver(PAD_L, yS, COL.accent, 'S', '', false);

    // Observador S': se mueve a la derecha con velocidad β
    if (state.running || state.paused || t_norm > 0) {
      const xSpInS = t_norm * β * trackW;
      const clampedSp = Math.min(xSpInS, trackW - 30);
      drawObserver(PAD_L + clampedSp, yS, COL.purple, "S'", `β=${β.toFixed(2)}`, false);
    } else {
      drawObserver(PAD_L, yS, COL.purple, "S'", `β=${β.toFixed(2)}`, false);
    }

    // Pulso de luz en S: x_S = t_norm * trackW
    if (t_norm > 0) {
      const xLightS = t_norm * trackW;
      drawWaveFront(xLightS, yS, bandH, true);
    } else {
      drawOrigin(PAD_L, yS);
    }

    // ── BANDA S' (abajo): perspectiva de S' ──────────────
    drawLane(ySp, COL.trackSp, "S'", true);

    // Observador S': fijo en PAD_L (S' está en reposo en su propio frame)
    drawObserver(PAD_L, ySp, COL.purple, "S'", '', false);

    // Observador S: se mueve a la IZQUIERDA en S' frame
    // En frame S': S tiene velocidad -β, posición = -β*t'_norm
    // t'_norm = γ*(1-β)*t_norm (S' proper time)
    // x'_S = -β*t'_norm — puede salir del canvas; lo mostramos solo si es visible
    if (t_norm > 0) {
      const tPrime = γ * (1 - β) * t_norm;  // S' proper time
      const xSInSp = -β * tPrime * trackW;    // S moves left
      const xSvis  = Math.max(xSInSp + PAD_L, PAD_L - 60); // clip
      if (xSvis > 0) {
        drawObserver(xSvis, ySp, COL.accent, 'S', `-β`, true);
      }
    } else {
      drawObserver(PAD_L, ySp, COL.accent, 'S', `−β`, true);
    }

    // Pulso de luz en S' frame:
    //   Lorentz: x' = γ*(1-β)*t_norm * trackW  (= t'_norm * trackW → speed c in S')
    //   Galilean: x'_G = (1-β)*t_norm * trackW  (speed c-v, wrong)
    if (t_norm > 0) {
      const xLightSp_galilean = (1 - β) * t_norm * trackW;
      const xLightSp_lorentz  = γ * (1 - β) * t_norm * trackW; // same as t'_norm * W

      // Galilean ghost first (behind)
      if (β > 0.001) {
        drawWaveFront(xLightSp_galilean, ySp, bandH, false);
      }
      // Lorentz (real) on top
      drawWaveFront(xLightSp_lorentz, ySp, bandH, true);
    } else {
      drawOrigin(PAD_L, ySp);
    }

    // ── Footer info bar ───────────────────────────────────
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.font = '10px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `β = ${β.toFixed(2)} · γ = ${γ.toFixed(3)} · k = ${Math.sqrt((1+β)/(1-β)).toFixed(3)} · t_anim = ${t_norm.toFixed(3)}`,
      W / 2, H - 7
    );
    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     ACTUALIZAR TARJETAS DE LECTURA
  ══════════════════════════════════════════════════════════ */
  function updateReadouts() {
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    const t_norm = state.tick / N_TICKS;

    if (t_norm === 0) {
      obsSX.textContent = obsST.textContent = obsSSpd.textContent = '—';
      obsSpX.textContent = obsSpT.textContent = obsSpSpd.textContent = '—';
      obsSVerd.textContent = 'Pulsa "Emitir pulso" para iniciar';
      obsSpVerd.textContent = 'Pulsa "Emitir pulso" para iniciar';
      obsSVerd.style.background  = 'rgba(255,255,255,0.04)';
      obsSVerd.style.color       = 'var(--color-text-dim)';
      obsSpVerd.style.background = 'rgba(255,255,255,0.04)';
      obsSpVerd.style.color      = 'var(--color-text-dim)';
      return;
    }

    // S frame (c=1, natural units)
    const xS = t_norm;             // light position in S
    const tS = t_norm;             // S time
    const speedS = (tS > 1e-9) ? xS / tS : 1;

    // S' frame (Lorentz)
    const xSp = γ * (1 - β) * t_norm;  // x' = γ*(1-β)*t
    const tSp = γ * (1 - β) * t_norm;  // t' = γ*(1-β)*t
    const speedSp = (tSp > 1e-9) ? xSp / tSp : 1;

    const fmt = (v, d=4) => Number(v.toFixed(d)).toString();

    obsSX.textContent   = fmt(xS, 4) + ' u.n.';
    obsST.textContent   = fmt(tS, 4) + ' u.n.';
    obsSSpd.textContent = fmt(speedS, 4);
    obsSVerd.textContent = `x/t = ${speedS.toFixed(4)} = c ✓`;
    obsSVerd.style.background = 'rgba(52,211,153,0.10)';
    obsSVerd.style.color      = 'var(--color-success)';

    obsSpX.textContent   = fmt(xSp, 4) + ' u.n.';
    obsSpT.textContent   = fmt(tSp, 4) + ' u.n.';
    obsSpSpd.textContent = fmt(speedSp, 4);
    obsSpVerd.textContent = `x'/t' = ${speedSp.toFixed(4)} = c ✓`;
    obsSpVerd.style.background = 'rgba(52,211,153,0.10)';
    obsSpVerd.style.color      = 'var(--color-success)';
  }

  /* ══════════════════════════════════════════════════════════
     LOOP DE ANIMACIÓN
  ══════════════════════════════════════════════════════════ */
  function animate() {
    if (!state.running || state.paused) return;

    state.tick += 1;
    draw();
    updateReadouts();

    if (state.tick < N_TICKS) {
      state.animId = requestAnimationFrame(animate);
    } else {
      state.running = false;
      btnPlay.disabled  = false;
      btnPause.disabled = true;
      btnPlay.innerHTML = '<span class="btn-icon">▶</span> Emitir pulso';
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
    }
  }

  /* ══════════════════════════════════════════════════════════
     VELOCIDAD BAR
  ══════════════════════════════════════════════════════════ */
  function updateVelocityBar() {
    const β = state.beta;
    const γ = Lorentz.gamma(β);
    betaRd.textContent  = `β = ${β.toFixed(2)}`;
    gammaVal.textContent = γ.toFixed(4);
  }

  sliderEl.addEventListener('input', () => {
    state.beta = parseFloat(sliderEl.value);
    updateVelocityBar();
    updateVelocityAddition();
    if (!state.running) draw();
  });

  /* ══════════════════════════════════════════════════════════
     CONTROL DE BOTONES
  ══════════════════════════════════════════════════════════ */
  btnPlay.addEventListener('click', () => {
    if (state.running && !state.paused) return;
    if (state.paused) {
      // Reanudar
      state.paused  = false;
      state.running = true;
      btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Emitir pulso';
      btnPlay.disabled   = true;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      btnPause.disabled  = false;
      state.animId = requestAnimationFrame(animate);
      return;
    }
    // Nuevo pulso
    state.tick    = 0;
    state.running = true;
    state.paused  = false;

    btnPlay.disabled   = true;
    btnPause.disabled  = false;
    btnPlay.innerHTML  = '<span class="btn-icon">⏸</span> En vuelo…';
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    state.animId = requestAnimationFrame(animate);
  });

  btnPause.addEventListener('click', () => {
    if (!state.running) return;
    if (!state.paused) {
      state.paused = true;
      cancelAnimationFrame(state.animId);
      btnPause.innerHTML = '<span class="btn-icon">▶</span> Reanudar';
      btnPlay.disabled   = false;
      btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Reanudar';
    } else {
      state.paused  = false;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      btnPlay.disabled   = true;
      btnPlay.innerHTML  = '<span class="btn-icon">⏸</span> En vuelo…';
      state.animId = requestAnimationFrame(animate);
    }
  });

  btnReset.addEventListener('click', () => {
    cancelAnimationFrame(state.animId);
    state.running = false;
    state.paused  = false;
    state.tick    = 0;

    btnPlay.disabled   = false;
    btnPause.disabled  = true;
    btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Emitir pulso';
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    draw();
    updateReadouts();
  });

  /* ══════════════════════════════════════════════════════════
     CALCULADORA DE ADICIÓN DE VELOCIDADES
  ══════════════════════════════════════════════════════════ */
  function updateVelocityAddition() {
    const u = parseFloat(uSlider.value);   // velocidad del objeto en S (0–1)
    const β = state.beta;                  // velocidad de S' (del slider principal)

    uReadout.textContent = `u = ${u.toFixed(2)}c`;

    // Galilean
    const uGalileo = u - β;
    const absG = Math.abs(uGalileo);
    vaddG.textContent = uGalileo.toFixed(4) + ' c';
    // bar: clip to ±1
    const barG = Math.min(Math.abs(uGalileo), 1) * 100;
    vaddBarG.style.width = barG + '%';

    if (Math.abs(u) > 0.9999) {
      vaddGWarn.innerHTML = `⚠ Para la luz: u' = c − v = <strong>${uGalileo.toFixed(3)} c</strong> &lt; c — viola el 2.° postulado!`;
    } else if (Math.abs(uGalileo) > 1.0001) {
      vaddGWarn.textContent = '⚠ Supera la velocidad de la luz — imposible.';
    } else {
      vaddGWarn.textContent = '';
    }

    // Lorentz: u' = (u − β)/(1 − u*β)
    const denom = 1 - u * β;
    const uLorentz = (denom !== 0) ? (u - β) / denom : NaN;
    const absL = Math.min(Math.abs(uLorentz), 1);
    vaddL.textContent = isNaN(uLorentz) ? '—' : uLorentz.toFixed(4) + ' c';
    vaddBarL.style.width = (absL * 100) + '%';

    if (Math.abs(u) > 0.9999) {
      vaddLNote.innerHTML = `✓ Para la luz: u' = (c − v)/(1 − c·v/c²) = c·(1−β)/(1−β) = <strong>c</strong> siempre.`;
    } else {
      vaddLNote.textContent = Math.abs(uLorentz) < 1.001 ? '✓ Siempre |u\'| < c' : '—';
    }
  }

  uSlider.addEventListener('input', updateVelocityAddition);

  /* ══════════════════════════════════════════════════════════
     INICIALIZACIÓN
  ══════════════════════════════════════════════════════════ */
  updateVelocityBar();
  updateVelocityAddition();
  resizeCanvas();
  updateReadouts();

})();
