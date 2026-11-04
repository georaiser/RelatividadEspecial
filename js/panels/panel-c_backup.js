/**
 * panel-c.js — Panel C: Diagrama de Minkowski
 *
 * Submódulos:
 *  C.1 Eventos       — evento A draggable, coordenadas K y K', Δs²
 *  C.2 Cono de Luz   — eventos A y B, cono desde A, clasificación causal
 *  C.3 Simultaneidad — líneas de simultaneidad K (horizontal) y K' (inclinada)
 *
 * Depende de: js/physics/lorentz.js (IIFE: Lorentz.gamma, .transform, .spacetimeInterval, .classifyInterval)
 *
 * Física (unidades naturales c = 1):
 *  - Eje x: horizontal. Eje ct: vertical (hacia arriba = futuro)
 *  - Eje ct' en K: dirección canvas (β, −1) — worldline del origen de K'
 *  - Eje x' en K:  dirección canvas (1, −β) — líneas de simultaneidad de K'
 *  - Cono de luz:  diagonales ±45° (ct = ±x)
 *  - Δs² = Δ(ct)² − Δx²  (firma +−)
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     UTILIDADES
  ══════════════════════════════════════════════════════════ */
  const el  = id => document.getElementById(id);
  const fmt = (v, d = 3) => (isNaN(v) || !isFinite(v)) ? '—' : v.toFixed(d);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const bondik = β => Math.sqrt((1 + β) / (1 - β));

  /* ══════════════════════════════════════════════════════════
     ESTADO GLOBAL
  ══════════════════════════════════════════════════════════ */
  const state = {
    β: 0.6,
    A: { x: -2, ct: 1 },
    B: { x:  1, ct: 3 },
  };

  /* ══════════════════════════════════════════════════════════
     CANVASES (uno por tab)
  ══════════════════════════════════════════════════════════ */
  const c1 = el('c1-canvas'), ctx1 = c1.getContext('2d');
  const c2 = el('c2-canvas'), ctx2 = c2.getContext('2d');
  const c3 = el('c3-canvas'), ctx3 = c3.getContext('2d');

  const CANVAS_H = 460;
  const RANGE    = 5.5;   // unidades físicas visibles desde el centro

  /* ── Sistema de coordenadas ────────────────────────────── */
  function dCtx(canvas) {
    const W = canvas.width, H = canvas.height;
    const scale = Math.min(W, H) / (2 * RANGE);
    return { W, H, cx: W / 2, cy: H / 2, scale };
  }

  function toCanvas(d, x, ct) {
    return { px: d.cx + x * d.scale, py: d.cy - ct * d.scale };
  }

  function toPhys(d, px, py) {
    return {
      x:  (px - d.cx) / d.scale,
      ct: -(py - d.cy) / d.scale,
    };
  }

  /* ══════════════════════════════════════════════════════════
     CAPAS DE DIBUJO
  ══════════════════════════════════════════════════════════ */

  function drawBackground(ctx, d) {
    ctx.fillStyle = '#09111e';
    ctx.fillRect(0, 0, d.W, d.H);
  }

  function drawGrid(ctx, d) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let i = -Math.ceil(RANGE); i <= Math.ceil(RANGE); i++) {
      if (i === 0) continue;
      const px = d.cx + i * d.scale;
      if (px >= 0 && px <= d.W) {
        ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, d.H); ctx.stroke();
      }
      const py = d.cy - i * d.scale;
      if (py >= 0 && py <= d.H) {
        ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(d.W, py); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawLightConeRegions(ctx, d) {
    /* Rellena suavemente las regiones causales desde el ORIGEN */
    const { cx, cy, W, H } = d;
    ctx.save();

    // Región futura (ct > |x|): triángulo superior
    ctx.fillStyle = 'rgba(253,224,71,0.035)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(0,  clamp(cy + cx, 0, H));
    ctx.lineTo(0,  0); ctx.lineTo(W, 0);
    ctx.lineTo(W,  clamp(cy - (W - cx), 0, H));
    ctx.closePath();
    ctx.fill();

    // Región pasada (ct < -|x|): triángulo inferior
    ctx.fillStyle = 'rgba(253,224,71,0.02)';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(0,  clamp(cy - cx, 0, H));
    ctx.lineTo(0,  H); ctx.lineTo(W, H);
    ctx.lineTo(W,  clamp(cy + (W - cx), 0, H));
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function drawKAxes(ctx, d) {
    const { W, H, cx, cy, scale } = d;
    ctx.save();

    // Ejes principales
    ctx.strokeStyle = 'rgba(96,165,250,0.85)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();   // eje x
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();   // eje ct

    // Flechas
    const arr = 8;
    ctx.fillStyle = 'rgba(96,165,250,0.85)';
    ctx.beginPath(); ctx.moveTo(W - 2, cy); ctx.lineTo(W - 2 - arr, cy - arr/2);
    ctx.lineTo(W - 2 - arr, cy + arr/2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx, 2); ctx.lineTo(cx - arr/2, 2 + arr);
    ctx.lineTo(cx + arr/2, 2 + arr); ctx.closePath(); ctx.fill();

    // Etiquetas
    ctx.fillStyle = '#60a5fa';
    ctx.font = 'bold 13px Consolas, monospace';
    ctx.fillText('x', W - 18, cy - 8);
    ctx.fillText('ct', cx + 8, 18);

    // Marcas y números
    ctx.strokeStyle = 'rgba(96,165,250,0.4)';
    ctx.lineWidth = 1;
    ctx.fillStyle  = 'rgba(96,165,250,0.6)';
    ctx.font = '10px Consolas, monospace';

    for (let i = -5; i <= 5; i++) {
      if (i === 0) continue;
      const px = cx + i * scale;
      const py = cy - i * scale;
      if (px >= 0 && px <= W) {
        ctx.beginPath(); ctx.moveTo(px, cy - 4); ctx.lineTo(px, cy + 4); ctx.stroke();
        ctx.fillText(i, px - (i < 0 ? 8 : 3), cy + 15);
      }
      if (py >= 0 && py <= H) {
        ctx.beginPath(); ctx.moveTo(cx - 4, py); ctx.lineTo(cx + 4, py); ctx.stroke();
        ctx.fillText(i, cx - 18, py + 3);
      }
    }

    ctx.restore();
  }

  function drawKprimeAxes(ctx, d, β) {
    if (β < 0.005) return;
    const { W, H, cx, cy } = d;
    const ext = Math.max(W, H) * 1.5;
    const γ = Lorentz.gamma(β);

    ctx.save();
    ctx.strokeStyle = 'rgba(192,132,252,0.75)';
    ctx.lineWidth = 1.6;

    // Eje ct': dirección (β, 1) en espacio físico → (β·ext, -ext) en canvas
    ctx.beginPath();
    ctx.moveTo(cx - β * ext, cy + ext);
    ctx.lineTo(cx + β * ext, cy - ext);
    ctx.stroke();

    // Eje x': dirección (1, β) en espacio físico → (ext, -β·ext) en canvas
    ctx.beginPath();
    ctx.moveTo(cx - ext,     cy + β * ext);
    ctx.lineTo(cx + ext,     cy - β * ext);
    ctx.stroke();

    // ── Marcas de calibración hiperbólica en ejes K' ─────
    ctx.fillStyle = '#c084fc';
    ctx.font = 'bold 9px Consolas, monospace';

    for (let n = -4; n <= 4; n++) {
      if (n === 0) continue;
      // Marca en eje ct': (x = n·γ·β, ct = n·γ)
      const pCt = toCanvas(d, n * γ * β, n * γ);
      if (pCt.px >= 10 && pCt.px <= W - 10 && pCt.py >= 10 && pCt.py <= H - 10) {
        ctx.beginPath();
        ctx.arc(pCt.px, pCt.py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(n, pCt.px + 5, pCt.py + 3);
      }

      // Marca en eje x': (x = n·γ, ct = n·γ·β)
      const pX = toCanvas(d, n * γ, n * γ * β);
      if (pX.px >= 10 && pX.px <= W - 10 && pX.py >= 10 && pX.py <= H - 10) {
        ctx.beginPath();
        ctx.arc(pX.px, pX.py, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(n, pX.px - 3, pX.py + 13);
      }
    }

    // Etiquetas K'
    ctx.font = 'bold 13px Consolas, monospace';
    const ctp_lx = cx + β * Math.min(cy - 16, ext);
    const ctp_ly = 18;
    ctx.fillText("ct'", clamp(ctp_lx + 6, 6, W - 32), ctp_ly);

    const xp_rx = W - 6;
    const xp_ry = cy - β * (W - cx - 6);
    ctx.fillText("x'", xp_rx - 22, clamp(xp_ry - 6, 18, H - 6));

    ctx.restore();
  }

  function drawLightConeLines(ctx, d) {
    const { W, H, cx, cy } = d;
    ctx.save();
    ctx.strokeStyle = 'rgba(253,224,71,0.75)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);

    // ct = +x: de (0, cy+cx) a (W, cy-(W-cx))
    ctx.beginPath();
    ctx.moveTo(0, cy + cx);
    ctx.lineTo(W, cy - (W - cx));
    ctx.stroke();

    // ct = -x: de (0, cy-cx) a (W, cy+(W-cx))
    ctx.beginPath();
    ctx.moveTo(0, cy - cx);
    ctx.lineTo(W, cy + (W - cx));
    ctx.stroke();

    ctx.setLineDash([]);
    ctx.restore();
  }

  /* Hipérbola invariante que pasa por el Evento A: ct² - x² = Δs² */
  function drawCalibrationHyperbola(ctx, d, event) {
    const ds2 = event.ct * event.ct - event.x * event.x;
    if (Math.abs(ds2) < 0.08) return; // muy cerca del cono de luz

    ctx.save();
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 4]);

    if (ds2 > 0) {
      // Rama superior/inferior: ct = ±√(x² + ds2)
      ctx.strokeStyle = 'rgba(96,165,250,0.3)';
      const s = Math.sqrt(ds2);
      ctx.beginPath();
      let first = true;
      for (let x = -RANGE; x <= RANGE; x += 0.1) {
        const ct = Math.sign(event.ct >= 0 ? 1 : -1) * Math.sqrt(x * x + ds2);
        const { px, py } = toCanvas(d, x, ct);
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    } else {
      // Rama derecha/izquierda: x = ±√(ct² - ds2)
      ctx.strokeStyle = 'rgba(192,132,252,0.3)';
      const absDs2 = -ds2;
      ctx.beginPath();
      let first = true;
      for (let ct = -RANGE; ct <= RANGE; ct += 0.1) {
        const x = Math.sign(event.x >= 0 ? 1 : -1) * Math.sqrt(ct * ct + absDs2);
        const { px, py } = toCanvas(d, x, ct);
        if (first) { ctx.moveTo(px, py); first = false; }
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawEventProjections(ctx, d, event, β) {
    const { px: epx, py: epy } = toCanvas(d, event.x, event.ct);
    const { px: px0, py: py0 } = toCanvas(d, 0, 0);

    ctx.save();
    // ── Proyecciones K (Azul) ──
    ctx.strokeStyle = 'rgba(96,165,250,0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(epx, epy); ctx.lineTo(epx, py0); ctx.stroke(); // hacia eje x
    ctx.moveTo(epx, epy); ctx.lineTo(px0, epy); ctx.stroke(); // hacia eje ct
    ctx.setLineDash([]);

    // ── Proyecciones K' (Violeta) ──
    if (β > 0.005) {
      const γ = Lorentz.gamma(β);
      const xp  = γ * (event.x - β * event.ct);
      const ctp = γ * (event.ct - β * event.x);

      // Proyección paralela a ct' hacia eje x'
      const x_int_xp = γ * xp;
      const ct_int_xp = β * x_int_xp;
      const p_xp = toCanvas(d, x_int_xp, ct_int_xp);

      // Proyección paralela a x' hacia eje ct'
      const ct_int_ctp = γ * ctp;
      const x_int_ctp = β * ct_int_ctp;
      const p_ctp = toCanvas(d, x_int_ctp, ct_int_ctp);

      ctx.strokeStyle = 'rgba(192,132,252,0.55)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(epx, epy); ctx.lineTo(p_xp.px, p_xp.py); ctx.stroke();
      ctx.moveTo(epx, epy); ctx.lineTo(p_ctp.px, p_ctp.py); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#c084fc';
      ctx.beginPath(); ctx.arc(p_xp.px, p_xp.py, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(p_ctp.px, p_ctp.py, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  function drawEventDot(ctx, d, event, label, color) {
    const { px, py } = toCanvas(d, event.x, event.ct);
    if (px < -30 || px > d.W + 30 || py < -30 || py > d.H + 30) return;

    ctx.save();

    // Halo luminoso
    const grd = ctx.createRadialGradient(px, py, 0, px, py, 16);
    grd.addColorStop(0, color + 'ee');
    grd.addColorStop(1, color + '00');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fill();

    // Punto central
    ctx.fillStyle   = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    // Etiqueta
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Consolas, monospace';
    ctx.fillText(label, px + 10, py - 10);

    // Coordenadas mini
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.fillText(`(${event.x.toFixed(2)}, ${event.ct.toFixed(2)})`, px + 10, py + 4);

    ctx.restore();
  }

  function drawWorldlineKprime(ctx, d, β) {
    /* Línea de mundo del origen de K' = eje ct' */
    if (β < 0.005) return;
    const { W, H, cx, cy } = d;
    const ext = Math.max(W, H) * 1.5;

    ctx.save();
    ctx.strokeStyle = 'rgba(192,132,252,0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx - β * ext, cy + ext);
    ctx.lineTo(cx + β * ext, cy - ext);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawLightConeAtEvent(ctx, d, event) {
    const { px: ox, py: oy } = toCanvas(d, event.x, event.ct);
    const ext = Math.max(d.W, d.H) * 2;

    ctx.save();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.6;
    ctx.setLineDash([5, 4]);

    // Cono futuro
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ext, oy - ext); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - ext, oy - ext); ctx.stroke();
    // Cono pasado
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ext, oy + ext); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - ext, oy + ext); ctx.stroke();

    // Relleno sutil del cono futuro desde A
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox - ext, oy - ext);
    ctx.lineTo(ox + ext, oy - ext);
    ctx.closePath(); ctx.fill();

    ctx.setLineDash([]);
    ctx.restore();
  }

  function drawIntervalLine(ctx, d, A, B) {
    const { px: ax, py: ay } = toCanvas(d, A.x, A.ct);
    const { px: bx, py: by } = toCanvas(d, B.x, B.ct);

    const dx  = B.x  - A.x;
    const dct = B.ct - A.ct;
    const ds2 = Lorentz.spacetimeInterval(dx, dct);
    const type = Lorentz.classifyInterval(ds2);

    const color = type === 'temporal' ? '#60a5fa'
                : type === 'luz'      ? '#fde047'
                :                       '#c084fc';

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.globalAlpha = 0.85;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.setLineDash([]);

    // Badge informativo en el centro del vector A→B
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.textAlign = 'center';
    const extraLabel = type === 'temporal' ? `Δτ = ${fmt(Math.sqrt(Math.max(0, ds2)), 2)}`
                     : type === 'espacial' ? `ΔL = ${fmt(Math.sqrt(Math.max(0, -ds2)), 2)}`
                     : `Luz (Δτ = 0)`;
    ctx.fillText(`Δs² = ${fmt(ds2, 2)} · ${extraLabel}`, mx, my - 8);

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     FUNCIÓN PRINCIPAL DE DIBUJO
  ══════════════════════════════════════════════════════════ */
  function drawDiagram(canvas, ctx, mode) {
    if (canvas.width === 0 || canvas.height === 0) return;
    const d = dCtx(canvas);
    const { β, A, B } = state;

    // Capas base
    drawBackground(ctx, d);
    drawGrid(ctx, d);
    drawLightConeRegions(ctx, d);
    drawKAxes(ctx, d);
    if (β > 0.005) drawKprimeAxes(ctx, d, β);
    drawLightConeLines(ctx, d);

    // Capas específicas por modo
    switch (mode) {
      case 'events':
        drawCalibrationHyperbola(ctx, d, A);
        drawWorldlineKprime(ctx, d, β);
        drawEventProjections(ctx, d, A, β);
        drawEventDot(ctx, d, A, 'A', '#60a5fa');
        break;

      case 'causal':
        drawLightConeAtEvent(ctx, d, A);
        drawIntervalLine(ctx, d, A, B);
        drawEventDot(ctx, d, A, 'A', '#60a5fa');
        drawEventDot(ctx, d, B, 'B', '#c084fc');
        break;

      case 'simul':
        drawSimulLines(ctx, d, β, A, B);
        drawEventDot(ctx, d, A, 'A', '#60a5fa');
        drawEventDot(ctx, d, B, 'B', '#c084fc');
        break;
    }
  }

  /* Líneas de simultaneidad */
  function drawSimulLines(ctx, d, β, A, B) {
    const { W, H } = d;
    const ext = Math.max(W, H) * 1.5;

    ctx.save();
    const events = [A, B];
    const lblsK  = ['A', 'B'];

    // K: líneas horizontales
    events.forEach((ev, i) => {
      const { py } = toCanvas(d, 0, ev.ct);
      if (py < 0 || py > H) return;
      ctx.strokeStyle = i === 0 ? 'rgba(96,165,250,0.45)' : 'rgba(96,165,250,0.35)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(96,165,250,0.85)';
      ctx.font = 'bold 10px Consolas, monospace';
      ctx.fillText(`ct_${lblsK[i]} = ${ev.ct.toFixed(1)} (K)`, 6, py - 4);
    });

    // K': líneas inclinadas (pendiente β en ct vs x)
    if (β > 0.005) {
      events.forEach((ev, i) => {
        const { px: epx, py: epy } = toCanvas(d, ev.x, ev.ct);
        const ctp = Lorentz.transform(ev.x, ev.ct, β).t;
        ctx.strokeStyle = i === 0 ? 'rgba(192,132,252,0.5)' : 'rgba(192,132,252,0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(epx - ext, epy + β * ext);
        ctx.lineTo(epx + ext, epy - β * ext);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(192,132,252,0.9)';
        ctx.font = 'bold 10px Consolas, monospace';
        const lx = clamp(epx + 35, 6, W - 90);
        const ly = clamp(epy - β * 35 - 4, 14, H - 6);
        ctx.fillText(`ct'_${lblsK[i]} = ${ctp.toFixed(1)} (K')`, lx, ly);
      });
    }

    ctx.restore();
  }

  /* ══════════════════════════════════════════════════════════
     ARRASTRAR EVENTOS (drag & drop)
  ══════════════════════════════════════════════════════════ */
  let drag = null; // { target: 'A'|'B', canvas: canvas, mode: string }

  function hitRadius(d, px, py, event) {
    const { px: ex, py: ey } = toCanvas(d, event.x, event.ct);
    return Math.sqrt((px - ex) ** 2 + (py - ey) ** 2) < 16;
  }

  function setupDrag(canvas, mode) {
    function getCanvasPos(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width  / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        px: (e.clientX - rect.left) * scaleX,
        py: (e.clientY - rect.top)  * scaleY,
      };
    }

    canvas.addEventListener('mousedown', e => {
      const { px, py } = getCanvasPos(e);
      const d = dCtx(canvas);
      if (hitRadius(d, px, py, state.A)) {
        drag = { target: 'A', canvas, mode }; canvas.style.cursor = 'grabbing';
      } else if (mode !== 'events' && hitRadius(d, px, py, state.B)) {
        drag = { target: 'B', canvas, mode }; canvas.style.cursor = 'grabbing';
      }
    });

    canvas.addEventListener('mousemove', e => {
      if (!drag || drag.canvas !== canvas) {
        // Cambiar cursor al pasar sobre eventos
        const { px, py } = getCanvasPos(e);
        const d = dCtx(canvas);
        const overA = hitRadius(d, px, py, state.A);
        const overB = mode !== 'events' && hitRadius(d, px, py, state.B);
        canvas.style.cursor = (overA || overB) ? 'grab' : 'default';
        return;
      }
      const { px, py } = getCanvasPos(e);
      const d = dCtx(canvas);
      const phys = toPhys(d, px, py);
      const margin = 0.3;
      phys.x  = clamp(phys.x,  -RANGE + margin, RANGE - margin);
      phys.ct = clamp(phys.ct, -RANGE + margin, RANGE - margin);

      if (drag.target === 'A') {
        state.A.x = phys.x; state.A.ct = phys.ct;
        // Sincronizar inputs
        syncInputs('A');
      } else {
        state.B.x = phys.x; state.B.ct = phys.ct;
        syncInputs('B');
      }
      updateAll();
    });

    window.addEventListener('mouseup', () => {
      if (drag) { drag.canvas.style.cursor = 'default'; drag = null; }
    });

    // Touch support
    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const touch = e.touches[0];
      const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
      const { px, py } = getCanvasPos(fakeEvent);
      const d = dCtx(canvas);
      if (hitRadius(d, px, py, state.A)) drag = { target: 'A', canvas, mode };
      else if (mode !== 'events' && hitRadius(d, px, py, state.B)) drag = { target: 'B', canvas, mode };
    }, { passive: false });

    canvas.addEventListener('touchmove', e => {
      if (!drag || drag.canvas !== canvas) return;
      e.preventDefault();
      const touch = e.touches[0];
      const fakeEvent = { clientX: touch.clientX, clientY: touch.clientY };
      const { px, py } = getCanvasPos(fakeEvent);
      const d = dCtx(canvas);
      const phys = toPhys(d, px, py);
      const margin = 0.3;
      phys.x  = clamp(phys.x,  -RANGE + margin, RANGE - margin);
      phys.ct = clamp(phys.ct, -RANGE + margin, RANGE - margin);
      if (drag.target === 'A') { state.A.x = phys.x; state.A.ct = phys.ct; syncInputs('A'); }
      else                     { state.B.x = phys.x; state.B.ct = phys.ct; syncInputs('B'); }
      updateAll();
    }, { passive: false });

    window.addEventListener('touchend', () => { drag = null; });
  }

  function syncInputs(target) {
    if (target === 'A') {
      ['c1', 'c2', 'c3'].forEach(prefix => {
        const xi  = el(`${prefix}-ax`);
        const cti = el(`${prefix}-act`);
        if (xi)  xi.value  = state.A.x.toFixed(2);
        if (cti) cti.value = state.A.ct.toFixed(2);
      });
    } else {
      ['c2', 'c3'].forEach(prefix => {
        const xi  = el(`${prefix}-bx`);
        const cti = el(`${prefix}-bct`);
        if (xi)  xi.value  = state.B.x.toFixed(2);
        if (cti) cti.value = state.B.ct.toFixed(2);
      });
    }
  }

  /* ══════════════════════════════════════════════════════════
     ACTUALIZACIÓN DE READOUTS
  ══════════════════════════════════════════════════════════ */

  function updateVelocityBar() {
    const β = state.β;
    const γ = Lorentz.gamma(β);
    const k = bondik(β);
    el('beta-label').textContent  = `β = ${β.toFixed(3)}`;
    el('gamma-label').textContent = γ.toFixed(4);
    el('k-label').textContent     = `k = ${k.toFixed(4)}`;
  }

  function updateEventsTab() {
    const { β, A } = state;
    const γ = Lorentz.gamma(β);
    const k = bondik(β);
    const Ap = Lorentz.transform(A.x, A.ct, β);
    const ds2 = Lorentz.spacetimeInterval(A.x, A.ct);
    const type = Lorentz.classifyInterval(ds2);

    el('c1-ax-k').textContent   = fmt(A.x);
    el('c1-act-k').textContent  = fmt(A.ct);
    el('c1-axp-k').textContent  = fmt(Ap.x);
    el('c1-actp-k').textContent = fmt(Ap.t);

    const ds2El   = el('c1-ds2');
    const typeEl  = el('c1-type');
    ds2El.textContent  = fmt(ds2, 4);

    const typeInfo = causalInfo(type);
    typeEl.textContent  = typeInfo.label;
    typeEl.className    = `annotation ${typeInfo.cls}`;

    el('c1-beta').textContent  = fmt(β, 3);
    el('c1-gamma').textContent = fmt(γ, 4);
    el('c1-k').textContent     = fmt(k, 4);
  }

  function updateCausalTab() {
    const { β, A, B } = state;
    const dx  = B.x  - A.x;
    const dct = B.ct - A.ct;
    const ds2 = Lorentz.spacetimeInterval(dx, dct);
    const type = Lorentz.classifyInterval(ds2);

    el('c2-dx').textContent  = fmt(dx);
    el('c2-dct').textContent = fmt(dct);
    el('c2-ds2').textContent = fmt(ds2, 4);

    const info = causalInfo(type);
    const card = el('c2-causal-card');
    const icon = el('c2-causal-icon');
    const typeEl = el('c2-causal-type');
    const descEl = el('c2-causal-desc');

    icon.textContent   = '●';
    typeEl.textContent = info.name;
    descEl.textContent = info.desc;
    card.className     = `causal-badge-card ${info.cardCls}`;
    icon.style.color   = info.color;
  }

  function updateSimulTab() {
    const { β, A, B } = state;
    const Ap = Lorentz.transform(A.x, A.ct, β);
    const Bp = Lorentz.transform(B.x, B.ct, β);

    const dtK  = B.ct - A.ct;
    const dtKp = Bp.t  - Ap.t;
    const EPS  = 1e-9;

    el('c3-dt-k').textContent  = fmt(dtK);
    el('c3-dt-kp').textContent = fmt(dtKp);

    const vK  = el('c3-verdict-k');
    const vKp = el('c3-verdict-kp');

    if (Math.abs(dtK) < EPS) {
      vK.textContent = 'Simultáneos ✓'; vK.className = 'sim-verdict simultaneous';
    } else {
      vK.textContent = `Δt = ${fmt(dtK)} ≠ 0`; vK.className = 'sim-verdict not-simultaneous';
    }
    if (Math.abs(dtKp) < EPS) {
      vKp.textContent = "Simultáneos en K' ✓"; vKp.className = 'sim-verdict simultaneous';
    } else {
      vKp.textContent = `Δt' = ${fmt(dtKp)} ≠ 0`; vKp.className = 'sim-verdict not-simultaneous';
    }
  }

  function causalInfo(type) {
    switch (type) {
      case 'temporal':
        return {
          name: 'Tipo temporal', label: 'Temporal', cls: 'annotation-blue',
          color: '#60a5fa', cardCls: 'causal-temporal',
          desc: 'Interior del cono de luz. Conexión causal posible (v < c). Orden temporal absoluto.',
        };
      case 'luz':
        return {
          name: 'Tipo luz (nulo)', label: 'Luz', cls: 'annotation-yellow',
          color: '#fde047', cardCls: 'causal-light',
          desc: 'Superficie del cono. Conectados por señal luminosa. Tiempo propio nulo.',
        };
      default:
        return {
          name: 'Tipo espacial', label: 'Espacial', cls: 'annotation-purple',
          color: '#c084fc', cardCls: 'causal-spatial',
          desc: 'Exterior del cono. No causal. El orden temporal puede invertirse.',
        };
    }
  }

  /* ══════════════════════════════════════════════════════════
     REDIMENSIONAMIENTO
  ══════════════════════════════════════════════════════════ */
  function resizeCanvas(canvas) {
    const pw = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
    if (pw > 0) {
      canvas.width  = pw;
      canvas.height = CANVAS_H;
    }
  }

  function resizeAll() {
    resizeCanvas(c1);
    resizeCanvas(c2);
    resizeCanvas(c3);
  }

  window.addEventListener('resize', () => requestAnimationFrame(resizeAll));

  /* ══════════════════════════════════════════════════════════
     TABS
  ══════════════════════════════════════════════════════════ */
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      el(btn.dataset.tab).classList.add('active');
      requestAnimationFrame(() => { resizeAll(); updateAll(); });
    });
  });

  /* ══════════════════════════════════════════════════════════
     SLIDER β
  ══════════════════════════════════════════════════════════ */
  el('global-beta-slider').addEventListener('input', e => {
    state.β = parseFloat(e.target.value);
    updateAll();
  });

  /* ══════════════════════════════════════════════════════════
     INPUTS DE COORDENADAS
  ══════════════════════════════════════════════════════════ */
  function bindInput(id, stateKey, coord) {
    const input = el(id);
    if (!input) return;
    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      if (!isNaN(v)) {
        state[stateKey][coord] = clamp(v, -RANGE + 0.3, RANGE - 0.3);
        syncInputs(stateKey);
        updateAll();
      }
    });
  }

  // C.1 — solo evento A
  bindInput('c1-ax',  'A', 'x');
  bindInput('c1-act', 'A', 'ct');

  // C.2 — eventos A y B
  bindInput('c2-ax',  'A', 'x');
  bindInput('c2-act', 'A', 'ct');
  bindInput('c2-bx',  'B', 'x');
  bindInput('c2-bct', 'B', 'ct');

  // C.3 — eventos A y B
  bindInput('c3-ax',  'A', 'x');
  bindInput('c3-act', 'A', 'ct');
  bindInput('c3-bx',  'B', 'x');
  bindInput('c3-bct', 'B', 'ct');

  /* ══════════════════════════════════════════════════════════
     PRESETS
  ══════════════════════════════════════════════════════════ */
  function setupPresets(containerId, hasB) {
    const container = el(containerId);
    if (!container) return;
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active-preset'));
        btn.classList.add('active-preset');

        if (btn.dataset.ax !== undefined) {
          state.A.x  = parseFloat(btn.dataset.ax);
          state.A.ct = parseFloat(btn.dataset.act);
          syncInputs('A');
        }
        if (hasB && btn.dataset.bx !== undefined) {
          state.B.x  = parseFloat(btn.dataset.bx);
          state.B.ct = parseFloat(btn.dataset.bct);
          syncInputs('B');
        }
        updateAll();
      });
    });
  }

  setupPresets('presets-c1', false);
  setupPresets('presets-c2', true);
  setupPresets('presets-c3', true);

  /* ══════════════════════════════════════════════════════════
     UPDATE ALL
  ══════════════════════════════════════════════════════════ */
  function updateAll() {
    updateVelocityBar();
    updateEventsTab();
    updateCausalTab();
    updateSimulTab();
    drawDiagram(c1, ctx1, 'events');
    drawDiagram(c2, ctx2, 'causal');
    drawDiagram(c3, ctx3, 'simul');
  }

  /* ══════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════ */
  setupDrag(c1, 'events');
  setupDrag(c2, 'causal');
  setupDrag(c3, 'simul');

  resizeAll();
  syncInputs('A');
  syncInputs('B');
  updateAll();

})();
