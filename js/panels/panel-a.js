/**
 * panel-a.js — Animación interactiva del Panel A
 *
 * Muestra dos sistemas de referencia (S y S') y una señal luminosa.
 * Ambos observadores miden la misma velocidad c para la luz,
 * independientemente de la velocidad relativa entre los sistemas.
 *
 * Responsabilidades:
 *  - Dibujar la escena (fondo, rieles, observadores, frente de luz)
 *  - Controlar el slider de velocidad
 *  - Actualizar las lecturas de los observadores
 *  - Gestionar play/reset
 */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     Constantes y configuración
  ────────────────────────────────────────────────────────── */
  const C_DISPLAY = 1;          // velocidad de la luz (unidades de la animación)
  const TRACK_Y_S  = 0.35;     // fracción vertical de la pista de S
  const TRACK_Y_SP = 0.70;     // fracción vertical de la pista de S'

  const COLORS = {
    trackS:    '#4f9eff',       // azul: sistema S
    trackSp:   '#a78bfa',       // violeta: sistema S'
    light:     '#fde047',       // amarillo: señal de luz
    lightGlow: 'rgba(253,224,71,0.25)',
    obsS:      '#4f9eff',
    obsSp:     '#a78bfa',
    grid:      'rgba(255,255,255,0.04)',
    bg:        '#09111e',
  };

  /* ──────────────────────────────────────────────────────────
     Estado de la animación
  ────────────────────────────────────────────────────────── */
  let state = {
    beta:       0,          // v/c del sistema S'
    running:    false,      // ¿está la señal en vuelo?
    lightXNorm: 0,          // posición normalizada del frente de luz (0..1)
    t:          0,          // tiempo de animación (ticks)
    animId:     null,
  };

  /* ──────────────────────────────────────────────────────────
     Elementos del DOM
  ────────────────────────────────────────────────────────── */
  const canvas      = document.getElementById('anim-canvas');
  const ctx         = canvas.getContext('2d');
  const sliderEl    = document.getElementById('speed-slider');
  const betaDisplay = document.getElementById('beta-display');
  const betaReadout = document.getElementById('beta-readout');
  const btnPlay     = document.getElementById('btn-play');
  const btnReset    = document.getElementById('btn-reset');
  const obsSPos     = document.getElementById('obs-s-pos');
  const obsSpPos    = document.getElementById('obs-sp-pos');
  const obsSpSpeed  = document.getElementById('obs-sp-speed');

  /* ──────────────────────────────────────────────────────────
     Dimensiones del canvas (responsive)
  ────────────────────────────────────────────────────────── */
  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = Math.floor(rect.width);
    canvas.height = 280;
    draw();
  }

  window.addEventListener('resize', resizeCanvas);

  /* ──────────────────────────────────────────────────────────
     Dibujo de la escena
  ────────────────────────────────────────────────────────── */

  /** Dibuja la grilla de fondo */
  function drawGrid() {
    const W = canvas.width, H = canvas.height;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;

    // líneas verticales
    for (let x = 0; x <= W; x += W / 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    // líneas horizontales
    for (let y = 0; y <= H; y += H / 6) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
  }

  /** Dibuja un observador estilizado en (cx, cy) con el color dado */
  function drawObserver(cx, cy, color, label) {
    // Cuerpo
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle   = color;
    ctx.lineWidth   = 2;

    // Cabeza
    ctx.beginPath();
    ctx.arc(cx, cy - 18, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo (línea)
    ctx.beginPath();
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();

    // Brazos
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 2);
    ctx.lineTo(cx + 10, cy - 2);
    ctx.stroke();

    // Piernas
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx - 8, cy + 22);
    ctx.moveTo(cx, cy + 8);
    ctx.lineTo(cx + 8, cy + 22);
    ctx.stroke();

    // Etiqueta
    ctx.fillStyle = color;
    ctx.font = 'bold 12px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, cx, cy + 36);

    ctx.restore();
  }

  /** Dibuja la pista (riel) horizontal para un sistema de referencia */
  function drawTrack(yFrac, color, systemLabel) {
    const W = canvas.width, H = canvas.height;
    const y = H * yFrac;

    // Línea de la pista
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.25;
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(60, y);
    ctx.lineTo(W - 20, y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Etiqueta del sistema
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = 'bold 11px Segoe UI, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(systemLabel, 8, y + 4);
    ctx.restore();
  }

  /** Dibuja el frente de la señal de luz */
  function drawLightFront(xNorm) {
    if (xNorm <= 0) return;
    const W = canvas.width, H = canvas.height;

    // Rango de dibujo (de x=60 a x=W-20)
    const xDraw = 60 + (W - 80) * xNorm;

    // Glow
    const grad = ctx.createRadialGradient(xDraw, H * 0.5, 2, xDraw, H * 0.5, 80);
    grad.addColorStop(0, 'rgba(253,224,71,0.35)');
    grad.addColorStop(1, 'rgba(253,224,71,0)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(xDraw - 80, 0, 160, H);
    ctx.restore();

    // Línea de frente de onda
    ctx.save();
    ctx.strokeStyle = COLORS.light;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(xDraw, 0);
    ctx.lineTo(xDraw, H);
    ctx.stroke();

    // Flecha en la mitad
    const ay = H * 0.5;
    ctx.fillStyle = COLORS.light;
    ctx.beginPath();
    ctx.moveTo(xDraw + 10, ay);
    ctx.lineTo(xDraw - 4, ay - 7);
    ctx.lineTo(xDraw - 4, ay + 7);
    ctx.closePath();
    ctx.fill();

    // Label
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.fillStyle = COLORS.light;
    ctx.textAlign = 'center';
    ctx.fillText('c', xDraw + 18, ay - 12);
    ctx.restore();
  }

  /** Dibuja el observador móvil S' en su posición desplazada */
  function drawMovingObserver(beta, yFrac) {
    const W = canvas.width, H = canvas.height;
    const tNorm = state.running ? state.t / 120 : 0;
    // Posición X del observador S' (sale de un punto base y avanza)
    const baseX   = 70;
    const travelX = (W - 120) * beta * tNorm;
    const cx      = Math.min(baseX + travelX, W - 60);
    const cy      = H * yFrac;
    drawObserver(cx, cy, COLORS.obsSp, "S'");
  }

  /** Función principal de dibujo */
  function draw() {
    const W = canvas.width, H = canvas.height;

    // Fondo
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, W, H);

    drawGrid();

    // Pistas
    drawTrack(TRACK_Y_S,  COLORS.trackS,  'S');
    drawTrack(TRACK_Y_SP, COLORS.trackSp, "S'");

    // Observador S fijo
    drawObserver(70, H * TRACK_Y_S, COLORS.obsS, 'S');

    // Observador S' en movimiento
    drawMovingObserver(state.beta, TRACK_Y_SP);

    // Señal de luz
    if (state.running || state.lightXNorm > 0) {
      drawLightFront(state.lightXNorm);
    } else {
      // Punto de origen
      ctx.save();
      ctx.fillStyle = 'rgba(253,224,71,0.6)';
      ctx.beginPath();
      ctx.arc(70, H * 0.5, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '11px Consolas, monospace';
      ctx.fillStyle = COLORS.light;
      ctx.textAlign = 'left';
      ctx.fillText('Fuente', 80, H * 0.5 + 4);
      ctx.restore();
    }

    // Leyenda inferior
    ctx.save();
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.textAlign = 'center';
    ctx.fillText(
      `S: en reposo  |  S': v/c = ${state.beta.toFixed(2)}  |  Luz: c medida por ambos = c`,
      W / 2, H - 8
    );
    ctx.restore();
  }

  /* ──────────────────────────────────────────────────────────
     Loop de animación
  ────────────────────────────────────────────────────────── */
  function animate() {
    if (!state.running) return;

    state.t += 1;
    // La luz avanza con velocidad normalizada 1 (= c)
    // En 120 ticks recorre todo el canvas
    state.lightXNorm = state.t / 120;

    // Actualiza lecturas
    const xS  = state.lightXNorm.toFixed(3);
    const xSp = ((state.lightXNorm - state.beta * (state.t / 120)) /
                 (1 - state.beta)).toFixed(3);

    obsSPos.textContent  = `x = ${xS} (u.n.)`;
    obsSpPos.textContent = `x' = ${xSp} (u.n.)`;

    draw();

    if (state.lightXNorm < 1) {
      state.animId = requestAnimationFrame(animate);
    } else {
      state.running = false;
      btnPlay.disabled = false;
      btnPlay.innerHTML = '<span class="btn-icon">▶</span> Emitir señal';
    }
  }

  /* ──────────────────────────────────────────────────────────
     Control de eventos
  ────────────────────────────────────────────────────────── */

  sliderEl.addEventListener('input', () => {
    state.beta = parseFloat(sliderEl.value);
    const label = `v/c = ${state.beta.toFixed(2)}`;
    betaDisplay.textContent = label;
    betaReadout.textContent = label;
    if (!state.running) draw();
  });

  btnPlay.addEventListener('click', () => {
    if (state.running) return;
    // Reinicia la señal
    state.lightXNorm = 0;
    state.t          = 0;
    state.running    = true;

    obsSPos.textContent  = 'midiendo…';
    obsSpPos.textContent = 'midiendo…';

    btnPlay.disabled = true;
    btnPlay.innerHTML = '<span class="btn-icon">⏸</span> En vuelo…';

    state.animId = requestAnimationFrame(animate);
  });

  btnReset.addEventListener('click', () => {
    cancelAnimationFrame(state.animId);
    state.running    = false;
    state.lightXNorm = 0;
    state.t          = 0;

    obsSPos.textContent  = 'x = —';
    obsSpPos.textContent = "x' = —";

    btnPlay.disabled = false;
    btnPlay.innerHTML = '<span class="btn-icon">▶</span> Emitir señal';
    draw();
  });

  /* ──────────────────────────────────────────────────────────
     Inicialización
  ────────────────────────────────────────────────────────── */
  resizeCanvas();

})();
