/**
 * panel-c.js -- Panel C: Diagrama de Minkowski
 *
 * C.1 Eventos       -- evento A draggable, coordenadas K y K', ds2, hiperbola invariante
 * C.2 Cono de Luz   -- cono desde A con regiones coloreadas, vector A->B clasificado
 * C.3 Simultaneidad -- lineas de simultaneidad K (horizontal) y K' (inclinada beta)
 *
 * Depende de: js/physics/lorentz.js  (Lorentz.gamma, .transform, .spacetimeInterval, .classifyInterval)
 * Unidades naturales c = 1  =>  eje vertical = ct
 */

(function () {
  'use strict';

  /* =====================================================================
     UTILIDADES
  ===================================================================== */
  const el    = id => document.getElementById(id);
  const fmt   = (v, d) => { d = d === undefined ? 3 : d; return (isNaN(v) || !isFinite(v)) ? '\u2014' : v.toFixed(d); };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const bondik = b => Math.sqrt((1 + b) / (1 - b));

  /* =====================================================================
     PALETA  -- funciones helper que devuelven strings CSS completas
  ===================================================================== */
  const PAL = {
    bg:      '#09111e',
    kAxis:   '#60a5fa',
    kpAxis:  '#c084fc',
    light:   '#fde047',
    white:   '#f0f4ff',
    overlay: 'rgba(9,17,30,0.82)',
  };
  /* rgba helpers con alpha: evita strings rgba incompletas */
  const K   = function(a) { return 'rgba(96,165,250,'  + a + ')'; };
  const KP  = function(a) { return 'rgba(192,132,252,' + a + ')'; };
  const LT  = function(a) { return 'rgba(253,224,71,'  + a + ')'; };
  const PST = function(a) { return 'rgba(100,110,140,' + a + ')'; };

  /* =====================================================================
     ESTADO
  ===================================================================== */
  const state = {
    beta: 0.6,
    A: { x: -2, ct: 1 },
    B: { x:  1, ct: 3 },
  };

  /* =====================================================================
     CANVASES
  ===================================================================== */
  const c1 = el('c1-canvas'), ctx1 = c1.getContext('2d');
  const c2 = el('c2-canvas'), ctx2 = c2.getContext('2d');
  const c3 = el('c3-canvas'), ctx3 = c3.getContext('2d');

  const CANVAS_H = 460;
  const RANGE    = 5.5;

  /* -- Sistema de coordenadas ----------------------------------------- */
  function dCtx(canvas) {
    const W = canvas.width, H = canvas.height;
    const scale = Math.min(W, H) / (2 * RANGE);
    return { W: W, H: H, cx: W / 2, cy: H / 2, scale: scale };
  }
  function toCanvas(d, x, ct) { return { px: d.cx + x * d.scale, py: d.cy - ct * d.scale }; }
  function toPhys(d, px, py)  { return { x: (px - d.cx) / d.scale, ct: -(py - d.cy) / d.scale }; }

  /* =====================================================================
     HELPERS DE DIBUJO
  ===================================================================== */

  /** Cabeza de flecha desde (x1,y1) apuntando a (x2,y2) */
  function arrowHead(ctx, x1, y1, x2, y2, sz) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - sz * Math.cos(ang - 0.4), y2 - sz * Math.sin(ang - 0.4));
    ctx.lineTo(x2 - sz * Math.cos(ang + 0.4), y2 - sz * Math.sin(ang + 0.4));
    ctx.closePath();
    ctx.fill();
  }

  /** Fondo semiopaco detras del texto para legibilidad */
  function labelBg(ctx, text, x, y, font, padX, padH) {
    ctx.save();
    ctx.font = font;
    var w = ctx.measureText(text).width;
    ctx.fillStyle = PAL.overlay;
    ctx.beginPath();
    ctx.roundRect(x - padX, y - padH, w + padX * 2, padH + 5, 3);
    ctx.fill();
    ctx.restore();
  }

  /* =====================================================================
     CAPAS BASE
  ===================================================================== */

  function drawBackground(ctx, d) {
    ctx.fillStyle = PAL.bg;
    ctx.fillRect(0, 0, d.W, d.H);
  }

  function drawGrid(ctx, d) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (var i = -Math.ceil(RANGE); i <= Math.ceil(RANGE); i++) {
      if (i === 0) continue;
      var px = d.cx + i * d.scale;
      var py = d.cy - i * d.scale;
      if (px >= 0 && px <= d.W) { ctx.beginPath(); ctx.moveTo(px, 0);   ctx.lineTo(px, d.H);  ctx.stroke(); }
      if (py >= 0 && py <= d.H) { ctx.beginPath(); ctx.moveTo(0, py);   ctx.lineTo(d.W, py);  ctx.stroke(); }
    }
    ctx.restore();
  }

  /* -- Ejes K (azul) -------------------------------------------------- */
  function drawKAxes(ctx, d) {
    var W = d.W, H = d.H, cx = d.cx, cy = d.cy, scale = d.scale;
    var ARR = 10;
    ctx.save();

    ctx.strokeStyle = PAL.kAxis;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(6, cy); ctx.lineTo(W - ARR - 4, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, H - 6); ctx.lineTo(cx, ARR + 4); ctx.stroke();

    ctx.fillStyle = PAL.kAxis;
    arrowHead(ctx, 0, cy, W - 2, cy, ARR);
    arrowHead(ctx, cx, H, cx, 2, ARR);

    ctx.font = 'bold 14px Consolas, monospace';
    ctx.fillText('x', W - 18, cy - 10);
    ctx.fillText('ct', cx + 8, 16);

    ctx.strokeStyle = K(0.35);
    ctx.lineWidth = 1;
    ctx.font = '10px Consolas, monospace';

    for (var i = -5; i <= 5; i++) {
      if (i === 0) continue;
      var px = cx + i * scale;
      var py = cy - i * scale;
      if (px >= 4 && px <= W - 4) {
        ctx.beginPath(); ctx.moveTo(px, cy - 4); ctx.lineTo(px, cy + 4); ctx.stroke();
        ctx.fillStyle = K(0.65);
        ctx.fillText(i, px - (i < 0 ? 10 : 3), cy + 15);
      }
      if (py >= 4 && py <= H - 4) {
        ctx.beginPath(); ctx.moveTo(cx - 4, py); ctx.lineTo(cx + 4, py); ctx.stroke();
        ctx.fillStyle = K(0.65);
        ctx.fillText(i, cx - 20, py + 4);
      }
    }
    ctx.restore();
  }

  /* -- Ejes K' (violeta) ---------------------------------------------- */
  function drawKprimeAxes(ctx, d, beta) {
    if (beta < 0.005) return;
    var W = d.W, H = d.H, cx = d.cx, cy = d.cy;
    var ext = Math.max(W, H) * 1.5;
    var gamma = Lorentz.gamma(beta);
    var ARR = 10;

    ctx.save();
    ctx.strokeStyle = PAL.kpAxis;
    ctx.lineWidth = 2;

    /* Eje ct': direccion fisica (beta, 1) */
    var ct_end_px = cx + beta * Math.min(cy - ARR - 4, ext);
    var ct_end_py = cy - Math.min(cy - ARR - 4, ext);
    ctx.beginPath();
    ctx.moveTo(cx - beta * Math.min(cy, ext) * 0.8, cy + Math.min(cy, ext) * 0.8);
    ctx.lineTo(ct_end_px, ct_end_py);
    ctx.stroke();
    ctx.fillStyle = PAL.kpAxis;
    arrowHead(ctx, cx, cy, ct_end_px, ct_end_py, ARR);

    /* Eje x': direccion fisica (1, beta) */
    var xp_end_px = cx + Math.min(W - cx - ARR - 4, ext);
    var xp_end_py = cy - beta * Math.min(W - cx - ARR - 4, ext);
    ctx.beginPath();
    ctx.moveTo(cx - Math.min(cx, ext) * 0.8, cy + beta * Math.min(cx, ext) * 0.8);
    ctx.lineTo(xp_end_px, xp_end_py);
    ctx.stroke();
    arrowHead(ctx, cx, cy, xp_end_px, xp_end_py, ARR);

    /* Etiquetas K' — solo nombres de ejes */
    ctx.fillStyle = PAL.kpAxis;
    ctx.font = 'bold 13px Consolas, monospace';
    ctx.fillText("ct'", clamp(ct_end_px + 6, 6, W - 36), clamp(ct_end_py - 4, 14, H - 10));
    ctx.fillText("x'",  clamp(xp_end_px - 4, 6, W - 24), clamp(xp_end_py - 10, 14, H - 10));

    /* Marcas de calibracion hiperbólica: solo puntos, sin numeros */
    ctx.fillStyle = KP(0.70);
    for (var n = -4; n <= 4; n++) {
      if (n === 0) continue;
      var pCt = toCanvas(d, n * gamma * beta, n * gamma);
      if (pCt.px >= 10 && pCt.px <= W - 10 && pCt.py >= 10 && pCt.py <= H - 10) {
        ctx.beginPath(); ctx.arc(pCt.px, pCt.py, 2.5, 0, Math.PI * 2); ctx.fill();
      }
      var pX = toCanvas(d, n * gamma, n * gamma * beta);
      if (pX.px >= 10 && pX.px <= W - 10 && pX.py >= 10 && pX.py <= H - 10) {
        ctx.beginPath(); ctx.arc(pX.px, pX.py, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* =====================================================================
     C.1 -- CONO DEL ORIGEN con regiones y etiquetas
  ===================================================================== */
  function drawOriginLightCone(ctx, d) {
    var cx = d.cx, cy = d.cy, W = d.W, H = d.H;
    ctx.save();

    /* -- Rellenos de region -- */
    /* Futuro (amarillo muy tenue) */
    ctx.fillStyle = LT(0.07);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(0, cy - cx); ctx.lineTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, cy - (W - cx));
    ctx.closePath(); ctx.fill();

    /* Pasado (gris tenue) */
    ctx.fillStyle = PST(0.07);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(0, cy + cx); ctx.lineTo(0, H); ctx.lineTo(W, H); ctx.lineTo(W, cy + (W - cx));
    ctx.closePath(); ctx.fill();

    /* Zona espacial izquierda (violeta tenue) */
    ctx.fillStyle = KP(0.06);
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(0, cy - cx); ctx.lineTo(0, cy + cx);
    ctx.closePath(); ctx.fill();

    /* Zona espacial derecha */
    ctx.beginPath();
    ctx.moveTo(cx, cy); ctx.lineTo(W, cy - (W - cx)); ctx.lineTo(W, cy + (W - cx));
    ctx.closePath(); ctx.fill();

    /* -- Lineas del cono: solidas, amarillo -- */
    ctx.strokeStyle = PAL.light;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.80;
    ctx.beginPath(); ctx.moveTo(0, cy + cx);        ctx.lineTo(W, cy - (W - cx)); ctx.stroke(); /* ct = +x */
    ctx.beginPath(); ctx.moveTo(0, cy - cx);        ctx.lineTo(W, cy + (W - cx)); ctx.stroke(); /* ct = -x */
    ctx.globalAlpha = 1;

    /* -- Etiquetas sobre las lineas del cono -- */
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.fillStyle = LT(0.90);
    var lx1 = W * 0.73, ly1 = cy - (W * 0.73 - cx);
    labelBg(ctx, 'ct = x  (luz)', lx1, ly1 - 2, 'bold 10px Consolas, monospace', 3, 11);
    ctx.fillText('ct = x  (luz)', lx1, ly1 - 2);

    var lx2 = W * 0.27, ly2 = cy - (cx - W * 0.27);
    var ltxt2 = 'ct = \u2212x  (luz)';
    ctx.textAlign = 'right';
    labelBg(ctx, ltxt2, lx2, ly2 - 2, 'bold 10px Consolas, monospace', 3, 11);
    ctx.fillText(ltxt2, lx2, ly2 - 2);
    ctx.textAlign = 'left';

    /* -- Etiquetas de region -- */
    ctx.textAlign = 'center';

    /* FUTURO */
    ctx.font = 'bold 11px Consolas, monospace';
    ctx.fillStyle = LT(0.60);
    ctx.fillText('\u25b2 FUTURO', cx, 20);

    /* PASADO */
    ctx.fillStyle = PST(0.55);
    ctx.fillText('\u25bc PASADO', cx, H - 12);

    /* ZONA ESPACIAL izquierda */
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.fillStyle = KP(0.55);
    ctx.save(); ctx.translate(16, cy); ctx.rotate(-Math.PI / 2);
    ctx.fillText('ESPACIAL', 0, 0); ctx.restore();

    /* ZONA ESPACIAL derecha */
    ctx.save(); ctx.translate(W - 16, cy); ctx.rotate(Math.PI / 2);
    ctx.fillText('ESPACIAL', 0, 0); ctx.restore();

    ctx.textAlign = 'left';
    ctx.restore();
  }

  /* -- Punto de evento con halo --------------------------------------- */
  function drawEventDot(ctx, d, event, label, color) {
    var p = toCanvas(d, event.x, event.ct);
    var px = p.px, py = p.py;
    if (px < -30 || px > d.W + 30 || py < -30 || py > d.H + 30) return;
    ctx.save();

    /* Halo */
    var grd = ctx.createRadialGradient(px, py, 0, px, py, 18);
    grd.addColorStop(0, color + 'cc'); grd.addColorStop(1, color + '00');
    ctx.fillStyle = grd;
    ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();

    /* Punto */
    ctx.fillStyle = color; ctx.strokeStyle = PAL.white; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    /* Etiqueta con fondo */
    var coordTxt = '(' + event.x.toFixed(1) + ', ' + event.ct.toFixed(1) + ')';
    var lFont = 'bold 11px Consolas, monospace';
    var cFont = '10px Consolas, monospace';
    ctx.font = lFont;
    var lw = Math.max(ctx.measureText(label).width, ctx.measureText(coordTxt).width);
    ctx.fillStyle = PAL.overlay;
    ctx.beginPath(); ctx.roundRect(px + 10, py - 20, lw + 8, 30, 3); ctx.fill();
    ctx.fillStyle = PAL.white; ctx.font = lFont;
    ctx.fillText(label, px + 14, py - 8);
    ctx.fillStyle = color; ctx.font = cFont;
    ctx.fillText(coordTxt, px + 14, py + 5);

    ctx.restore();
  }

  /* =====================================================================
     C.1 -- HIPERBOLA INVARIANTE
  ===================================================================== */
  function drawCalibrationHyperbola(ctx, d, event) {
    var ds2 = event.ct * event.ct - event.x * event.x;
    if (Math.abs(ds2) < 0.08) return;
    ctx.save();
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 5]);

    if (ds2 > 0) {
      ctx.strokeStyle = K(0.45);
      ctx.beginPath();
      var first1 = true;
      for (var x = -RANGE; x <= RANGE; x += 0.08) {
        var ct1 = Math.sign(event.ct >= 0 ? 1 : -1) * Math.sqrt(x * x + ds2);
        var p1 = toCanvas(d, x, ct1);
        if (p1.px < -10 || p1.px > d.W + 10 || p1.py < -10 || p1.py > d.H + 10) { first1 = true; continue; }
        if (first1) { ctx.moveTo(p1.px, p1.py); first1 = false; } else { ctx.lineTo(p1.px, p1.py); }
      }
      ctx.stroke();
      /* Etiqueta de hiperbola */
      var hp = toCanvas(d, 0, Math.sqrt(ds2));
      if (hp.px > 0 && hp.px < d.W && hp.py > 10 && hp.py < d.H - 10) {
        var htxt = '\u0394s\u00b2 = ' + fmt(ds2, 2);
        ctx.fillStyle = K(0.65);
        ctx.font = '9px Consolas, monospace';
        ctx.fillText(htxt, hp.px + 6, hp.py);
      }
    } else {
      ctx.strokeStyle = KP(0.45);
      var absDs2 = -ds2;
      ctx.beginPath();
      var first2 = true;
      for (var ct = -RANGE; ct <= RANGE; ct += 0.08) {
        var x2 = Math.sign(event.x >= 0 ? 1 : -1) * Math.sqrt(ct * ct + absDs2);
        var p2 = toCanvas(d, x2, ct);
        if (p2.px < -10 || p2.px > d.W + 10 || p2.py < -10 || p2.py > d.H + 10) { first2 = true; continue; }
        if (first2) { ctx.moveTo(p2.px, p2.py); first2 = false; } else { ctx.lineTo(p2.px, p2.py); }
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* -- Proyecciones de A sobre los ejes K y K' ----------------------- */
  function drawEventProjections(ctx, d, event, beta) {
    var ep = toCanvas(d, event.x, event.ct);
    var epx = ep.px, epy = ep.py;
    var p0 = toCanvas(d, 0, 0);
    var px0 = p0.px, py0 = p0.py;

    ctx.save();

    /* Proyecciones K (punteado azul) */
    ctx.strokeStyle = K(0.55);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(epx, epy); ctx.lineTo(epx, py0); ctx.stroke(); /* vertical al eje x */
    ctx.beginPath(); ctx.moveTo(epx, epy); ctx.lineTo(px0, epy); ctx.stroke(); /* horizontal al eje ct */
    ctx.setLineDash([]);

    /* Puntos de pie en K */
    ctx.fillStyle = K(0.90);
    ctx.beginPath(); ctx.arc(epx, py0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(px0, epy, 4, 0, Math.PI * 2); ctx.fill();

    /* Etiquetas K — valores de coordenadas */
    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = K(0.85);
    ctx.fillText(fmt(event.x,  2), epx + 3, py0 + 13);
    ctx.fillText(fmt(event.ct, 2), px0 + 4, epy - 3);

    /* Proyecciones K' (punteado violeta) */
    if (beta > 0.005) {
      var gamma = Lorentz.gamma(beta);
      var xp  = gamma * (event.x  - beta * event.ct);
      var ctp = gamma * (event.ct - beta * event.x);

      /* Pie sobre eje x' */
      var x_int_xp  = gamma * xp;
      var ct_int_xp = beta * x_int_xp;
      var pxp = toCanvas(d, x_int_xp, ct_int_xp);

      /* Pie sobre eje ct' */
      var ct_int_ctp = gamma * ctp;
      var x_int_ctp  = beta * ct_int_ctp;
      var pctp = toCanvas(d, x_int_ctp, ct_int_ctp);

      ctx.strokeStyle = KP(0.60);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(epx, epy); ctx.lineTo(pxp.px,  pxp.py);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(epx, epy); ctx.lineTo(pctp.px, pctp.py); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = KP(0.95);
      ctx.beginPath(); ctx.arc(pxp.px,  pxp.py,  4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(pctp.px, pctp.py, 4, 0, Math.PI * 2); ctx.fill();

      /* Etiquetas K' — valores de coordenadas */
      ctx.font = '10px Consolas, monospace';
      ctx.fillStyle = KP(0.90);
      ctx.fillText(fmt(xp,  2), pxp.px  + 4, pxp.py  + 13);
      ctx.fillText(fmt(ctp, 2), pctp.px + 4, pctp.py - 3);
    }
    ctx.restore();
  }

  /* -- Linea de mundo del origen de K' -------------------------------- */
  function drawWorldlineKprime(ctx, d, beta) {
    if (beta < 0.005) return;
    var cx = d.cx, cy = d.cy;
    var ext = Math.max(d.W, d.H) * 1.5;
    ctx.save();
    ctx.strokeStyle = KP(0.30);
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - beta * ext, cy + ext);
    ctx.lineTo(cx + beta * ext, cy - ext);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  /* =====================================================================
     C.2 -- CONO DE LUZ CENTRADO EN A (relleno por regiones)
  ===================================================================== */
  function drawLightConeAtEvent(ctx, d, event) {
    var op = toCanvas(d, event.x, event.ct);
    var ox = op.px, oy = op.py;
    var W = d.W, H = d.H;
    var ext = Math.max(W, H) * 2.5;

    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();

    /* Futuro (gradiente radial azul) */
    var gradFut = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(W, H));
    gradFut.addColorStop(0,   'rgba(96,165,250,0.18)');
    gradFut.addColorStop(0.5, 'rgba(96,165,250,0.08)');
    gradFut.addColorStop(1,   'rgba(96,165,250,0.02)');
    ctx.fillStyle = gradFut;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox - ext, oy - ext); ctx.lineTo(ox + ext, oy - ext);
    ctx.closePath(); ctx.fill();

    /* Pasado (gradiente radial gris) */
    var gradPast = ctx.createRadialGradient(ox, oy, 0, ox, oy, Math.max(W, H));
    gradPast.addColorStop(0,   'rgba(100,110,140,0.16)');
    gradPast.addColorStop(0.5, 'rgba(100,110,140,0.07)');
    gradPast.addColorStop(1,   'rgba(100,110,140,0.01)');
    ctx.fillStyle = gradPast;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox - ext, oy + ext); ctx.lineTo(ox + ext, oy + ext);
    ctx.closePath(); ctx.fill();

    /* Zona espacial (violeta tenue) */
    ctx.fillStyle = 'rgba(192,132,252,0.07)';
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - ext, oy - ext); ctx.lineTo(ox - ext, oy + ext); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ext, oy - ext); ctx.lineTo(ox + ext, oy + ext); ctx.closePath(); ctx.fill();

    /* Lineas del cono: solidas, amarillo */
    ctx.strokeStyle = PAL.light;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.90;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ext, oy - ext); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - ext, oy - ext); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + ext, oy + ext); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox - ext, oy + ext); ctx.stroke();
    ctx.globalAlpha = 1;

    /* Puntito en el vertice A */
    ctx.fillStyle = PAL.light;
    ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill();

    /* Etiquetas de region -- una sola linea por region */
    ctx.textAlign = 'center';

    /* Futuro */
    var fy = clamp(oy - 50, 14, H - 20);
    if (fy < oy - 20) {
      ctx.font = 'bold 11px Consolas, monospace';
      ctx.fillStyle = K(0.85);
      ctx.fillText('FUTURO  \u0394s\u00b2 > 0', ox, fy);
    }

    /* Pasado */
    var py2 = clamp(oy + 60, 14, H - 10);
    if (py2 > oy + 20) {
      ctx.font = 'bold 11px Consolas, monospace';
      ctx.fillStyle = 'rgba(160,165,200,0.80)';
      ctx.fillText('PASADO  \u0394s\u00b2 > 0', ox, py2);
    }

    /* Zonas espaciales */
    var szLx = clamp(ox - 72, 10, W * 0.45 - 10);
    var szRx = clamp(ox + 72, W * 0.55 + 10, W - 10);
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.fillStyle = KP(0.70);
    ctx.fillText('\u0394s\u00b2 < 0', szLx, oy);
    ctx.fillText('\u0394s\u00b2 < 0', szRx, oy);

    ctx.textAlign = 'left';
    ctx.restore();
  }

  /* -- Vector A->B con flecha y badge de ds2 ------------------------- */
  function drawIntervalLine(ctx, d, A, B) {
    var pa = toCanvas(d, A.x, A.ct);
    var pb = toCanvas(d, B.x, B.ct);
    var ax = pa.px, ay = pa.py, bx = pb.px, by = pb.py;

    var dx  = B.x  - A.x;
    var dct = B.ct - A.ct;
    var ds2 = Lorentz.spacetimeInterval(dx, dct);
    var type = Lorentz.classifyInterval(ds2);

    var color = type === 'temporal' ? '#60a5fa'
              : type === 'luz'      ? '#fde047'
              :                       '#c084fc';

    var typeName = type === 'temporal' ? 'TIPO TEMPORAL'
                 : type === 'luz'      ? 'TIPO LUZ (Nulo)'
                 :                       'TIPO ESPACIAL';

    ctx.save();

    /* Linea A->B con flecha */
    ctx.strokeStyle = color;
    ctx.lineWidth   = 3;
    ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    arrowHead(ctx, ax, ay, bx, by, 11);

    /* Badge con fondo en la mitad del segmento */
    var mx = (ax + bx) / 2;
    var my = (ay + by) / 2;

    var l1 = typeName + '  \u0394s\u00b2 = ' + fmt(ds2, 3);
    var l2 = type === 'temporal' ? '\u0394\u03c4 = ' + fmt(Math.sqrt(Math.max(0, ds2)), 2)
           : type === 'espacial' ? '\u0394L = '    + fmt(Math.sqrt(Math.max(0, -ds2)), 2)
           : '\u0394\u03c4 = 0  (fot\u00f3n)';

    ctx.font = 'bold 10px Consolas, monospace';
    var bw = Math.max(ctx.measureText(l1).width, ctx.measureText(l2).width) + 20;
    var bh = 34;
    ctx.fillStyle = PAL.overlay;
    ctx.beginPath(); ctx.roundRect(mx - bw / 2, my - bh / 2, bw, bh, 5); ctx.fill();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.font = 'bold 10px Consolas, monospace';
    ctx.fillText(l1, mx, my - 7);
    ctx.font = '10px Consolas, monospace';
    ctx.fillText(l2, mx, my + 7);
    ctx.textAlign = 'left';

    ctx.restore();
  }

  /* =====================================================================
     C.3 -- LINEAS DE SIMULTANEIDAD
  ===================================================================== */
  function drawSimulLines(ctx, d, beta, A, B) {
    var W = d.W, H = d.H;
    var ext = Math.max(W, H) * 1.5;

    var EPS    = 0.05;
    var dtK    = B.ct - A.ct;
    var trA    = Lorentz.transform(A.x, A.ct, beta);
    var trB    = Lorentz.transform(B.x, B.ct, beta);
    var dtKp   = trB.t - trA.t;
    var gamma  = Lorentz.gamma(beta);

    var simultK  = Math.abs(dtK)  < EPS;
    var simultKp = Math.abs(dtKp) < EPS;

    ctx.save();

    /* == LINEAS K  (horizontales, azul) == */
    var evList = [A, B];
    var lblList = ['A', 'B'];
    for (var ki = 0; ki < evList.length; ki++) {
      var ev = evList[ki];
      var pK = toCanvas(d, 0, ev.ct);
      var pyK = pK.py;
      if (pyK < 0 || pyK > H) continue;

      var isSameK = simultK && ki === 1;
      if (isSameK) {
        ctx.strokeStyle = PAL.kAxis;
        ctx.lineWidth   = 3.5;
        ctx.shadowColor = PAL.kAxis;
        ctx.shadowBlur  = 12;
      } else {
        ctx.strokeStyle = ki === 0 ? K(0.70) : K(0.50);
        ctx.lineWidth   = ki === 0 ? 2.5 : 2;
        ctx.shadowBlur  = 0;
      }
      ctx.setLineDash([10, 6]);
      ctx.beginPath(); ctx.moveTo(0, pyK); ctx.lineTo(W, pyK); ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      ctx.font = 'bold 10px Consolas, monospace';
      ctx.fillStyle = K(0.90);
      ctx.fillText('t_' + lblList[ki] + ' = ' + ev.ct.toFixed(2), 8, pyK - 3);
    }

    /* Mensaje simultaneos K */
    if (simultK) {
      var pyKs = toCanvas(d, 0, A.ct).py;
      var msgK = '\u2713 Simult\u00e1neos en K';
      var mfontK = 'bold 11px Consolas, monospace';
      ctx.font = mfontK;
      var mwK = ctx.measureText(msgK).width;
      var mxK = W / 2 - mwK / 2;
      var myK = clamp(pyKs - 18, 14, H - 14);
      ctx.fillStyle = PAL.overlay;
      ctx.beginPath(); ctx.roundRect(mxK - 6, myK - 13, mwK + 12, 18, 4); ctx.fill();
      ctx.fillStyle = PAL.kAxis;
      ctx.fillText(msgK, mxK, myK);
    }

    /* == LINEAS K'  (inclinadas, violeta) == */
    if (beta > 0.005) {
      for (var kpi = 0; kpi < evList.length; kpi++) {
        var evKP = evList[kpi];
        var epKP = toCanvas(d, evKP.x, evKP.ct);
        var epxKP = epKP.px, epyKP = epKP.py;
        var ctpKP = Lorentz.transform(evKP.x, evKP.ct, beta).t;

        var isSameKp = simultKp && kpi === 1;
        if (isSameKp) {
          ctx.strokeStyle = PAL.kpAxis;
          ctx.lineWidth   = 3.5;
          ctx.shadowColor = PAL.kpAxis;
          ctx.shadowBlur  = 12;
        } else {
          ctx.strokeStyle = kpi === 0 ? KP(0.70) : KP(0.50);
          ctx.lineWidth   = kpi === 0 ? 2.5 : 2;
          ctx.shadowBlur  = 0;
        }
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(epxKP - ext, epyKP + beta * ext);
        ctx.lineTo(epxKP + ext, epyKP - beta * ext);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.shadowBlur = 0;

        var lxKP = clamp(epxKP + 30, 6, W - 180);
        var lyKP = clamp(epyKP - beta * 30 - 2, 14, H - 10);
        ctx.font = 'bold 10px Consolas, monospace';
        ctx.fillStyle = KP(0.90);
        ctx.fillText("t'_" + lblList[kpi] + ' = ' + ctpKP.toFixed(2), lxKP, lyKP);
      }

      /* Mensaje simultaneos K' */
      if (simultKp) {
        var msgKP = "\u2713 Simult\u00e1neos en K'";
        var mfontKP = 'bold 11px Consolas, monospace';
        ctx.font = mfontKP;
        var mwKP = ctx.measureText(msgKP).width;
        var mxKP = W / 2 - mwKP / 2;
        var epAKP = toCanvas(d, A.x, A.ct);
        var myKP = clamp(epAKP.py + 22, 14, H - 14);
        ctx.fillStyle = PAL.overlay;
        ctx.beginPath(); ctx.roundRect(mxKP - 6, myKP - 13, mwKP + 12, 18, 4); ctx.fill();
        ctx.fillStyle = PAL.kpAxis;
        ctx.fillText(msgKP, mxKP, myKP);
      }
    }

    /* == Panel de formula (esquina superior derecha) == */
    var panW = 240, panH = 54;
    ctx.fillStyle = PAL.overlay;
    ctx.beginPath(); ctx.roundRect(W - panW - 6, 6, panW, panH, 5); ctx.fill();

    ctx.font = '10px Consolas, monospace';
    ctx.fillStyle = KP(0.95);
    ctx.fillText("\u0394t' = \u03b3(\u0394t \u2212 \u03b2\u00b7\u0394x)   \u03b2=" + fmt(beta,2) + ' \u03b3=' + fmt(gamma,2), W - panW + 4, 24);

    ctx.fillStyle = K(0.90);
    ctx.fillText('\u0394t  = ' + fmt(dtK,  3), W - panW + 4, 42);
    ctx.fillStyle = KP(0.90);
    ctx.fillText("\u0394t' = " + fmt(dtKp, 3), W - panW + 4 + panW / 2 - 10, 42);

    /* Segmento A-B tenue */
    var paAB = toCanvas(d, A.x, A.ct);
    var pbAB = toCanvas(d, B.x, B.ct);
    ctx.strokeStyle = 'rgba(255,255,255,0.20)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(paAB.px, paAB.py); ctx.lineTo(pbAB.px, pbAB.py); ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  /* =====================================================================
     DISPATCHER PRINCIPAL
  ===================================================================== */
  function drawDiagram(canvas, ctx, mode) {
    if (canvas.width === 0 || canvas.height === 0) return;
    var d = dCtx(canvas);
    var beta = state.beta;
    var A = state.A, B = state.B;

    drawBackground(ctx, d);
    drawGrid(ctx, d);

    switch (mode) {

      case 'events':
        drawOriginLightCone(ctx, d);
        drawKAxes(ctx, d);
        if (beta > 0.005) drawKprimeAxes(ctx, d, beta);
        drawCalibrationHyperbola(ctx, d, A);
        drawWorldlineKprime(ctx, d, beta);
        drawEventProjections(ctx, d, A, beta);
        drawEventDot(ctx, d, A, 'A', PAL.kAxis);
        break;

      case 'causal':
        drawKAxes(ctx, d);
        if (beta > 0.005) drawKprimeAxes(ctx, d, beta);
        drawLightConeAtEvent(ctx, d, A);
        drawIntervalLine(ctx, d, A, B);
        drawEventDot(ctx, d, A, 'A', PAL.kAxis);
        drawEventDot(ctx, d, B, 'B', PAL.kpAxis);
        break;

      case 'simul':
        drawKAxes(ctx, d);
        if (beta > 0.005) drawKprimeAxes(ctx, d, beta);
        drawOriginLightCone(ctx, d);
        drawSimulLines(ctx, d, beta, A, B);
        drawEventDot(ctx, d, A, 'A', PAL.kAxis);
        drawEventDot(ctx, d, B, 'B', PAL.kpAxis);
        break;
    }
  }

  /* =====================================================================
     DRAG & DROP
  ===================================================================== */
  var drag = null;

  function hitRadius(d, px, py, event) {
    var e = toCanvas(d, event.x, event.ct);
    return Math.sqrt((px - e.px) * (px - e.px) + (py - e.py) * (py - e.py)) < 18;
  }

  function setupDrag(canvas, mode) {
    function pos(e) {
      var r = canvas.getBoundingClientRect();
      return {
        px: (e.clientX - r.left) * (canvas.width  / r.width),
        py: (e.clientY - r.top)  * (canvas.height / r.height),
      };
    }

    canvas.addEventListener('mousedown', function(e) {
      var p = pos(e), d = dCtx(canvas);
      if (hitRadius(d, p.px, p.py, state.A)) {
        drag = { target: 'A', canvas: canvas, mode: mode }; canvas.style.cursor = 'grabbing';
      } else if (mode !== 'events' && hitRadius(d, p.px, p.py, state.B)) {
        drag = { target: 'B', canvas: canvas, mode: mode }; canvas.style.cursor = 'grabbing';
      }
    });

    canvas.addEventListener('mousemove', function(e) {
      var p = pos(e), d = dCtx(canvas);
      if (!drag || drag.canvas !== canvas) {
        var overA = hitRadius(d, p.px, p.py, state.A);
        var overB = mode !== 'events' && hitRadius(d, p.px, p.py, state.B);
        canvas.style.cursor = (overA || overB) ? 'grab' : 'default';
        return;
      }
      var phys = toPhys(d, p.px, p.py);
      var mg = 0.3;
      phys.x  = clamp(phys.x,  -RANGE + mg, RANGE - mg);
      phys.ct = clamp(phys.ct, -RANGE + mg, RANGE - mg);
      if (drag.target === 'A') { state.A.x = phys.x; state.A.ct = phys.ct; syncInputs('A'); }
      else                     { state.B.x = phys.x; state.B.ct = phys.ct; syncInputs('B'); }
      updateAll();
    });

    window.addEventListener('mouseup', function() {
      if (drag) { drag.canvas.style.cursor = 'default'; drag = null; }
    });

    canvas.addEventListener('touchstart', function(e) {
      e.preventDefault();
      var t = e.touches[0];
      var p = pos({ clientX: t.clientX, clientY: t.clientY });
      var d = dCtx(canvas);
      if (hitRadius(d, p.px, p.py, state.A))                      drag = { target: 'A', canvas: canvas, mode: mode };
      else if (mode !== 'events' && hitRadius(d, p.px, p.py, state.B)) drag = { target: 'B', canvas: canvas, mode: mode };
    }, { passive: false });

    canvas.addEventListener('touchmove', function(e) {
      if (!drag || drag.canvas !== canvas) return;
      e.preventDefault();
      var t = e.touches[0];
      var p = pos({ clientX: t.clientX, clientY: t.clientY });
      var d = dCtx(canvas);
      var phys = toPhys(d, p.px, p.py);
      var mg = 0.3;
      phys.x  = clamp(phys.x,  -RANGE + mg, RANGE - mg);
      phys.ct = clamp(phys.ct, -RANGE + mg, RANGE - mg);
      if (drag.target === 'A') { state.A.x = phys.x; state.A.ct = phys.ct; syncInputs('A'); }
      else                     { state.B.x = phys.x; state.B.ct = phys.ct; syncInputs('B'); }
      updateAll();
    }, { passive: false });

    window.addEventListener('touchend', function() { drag = null; });
  }

  function syncInputs(target) {
    if (target === 'A') {
      ['c1', 'c2', 'c3'].forEach(function(prefix) {
        var xi  = el(prefix + '-ax');
        var cti = el(prefix + '-act');
        if (xi)  xi.value  = state.A.x.toFixed(2);
        if (cti) cti.value = state.A.ct.toFixed(2);
      });
    } else {
      ['c2', 'c3'].forEach(function(prefix) {
        var xi  = el(prefix + '-bx');
        var cti = el(prefix + '-bct');
        if (xi)  xi.value  = state.B.x.toFixed(2);
        if (cti) cti.value = state.B.ct.toFixed(2);
      });
    }
  }

  /* =====================================================================
     READOUTS
  ===================================================================== */
  function updateVelocityBar() {
    var beta = state.beta;
    var gamma = Lorentz.gamma(beta);
    var k = bondik(beta);
    el('beta-label').textContent  = '\u03b2 = ' + beta.toFixed(3);
    el('gamma-label').textContent = gamma.toFixed(4);
    el('k-label').textContent     = 'k = ' + k.toFixed(4);
  }

  function causalInfo(type) {
    if (type === 'temporal') return { name: 'Tipo temporal', label: 'Temporal', cls: 'annotation-blue',  color: '#60a5fa', cardCls: 'causal-temporal', desc: 'Interior del cono de luz. Conexion causal posible (v < c). Orden temporal absoluto.' };
    if (type === 'luz')      return { name: 'Tipo luz (nulo)', label: 'Luz',    cls: 'annotation-yellow', color: '#fde047', cardCls: 'causal-light',    desc: 'Superficie del cono. Conectados por señal luminosa. Tiempo propio nulo.' };
    return                          { name: 'Tipo espacial', label: 'Espacial', cls: 'annotation-purple', color: '#c084fc', cardCls: 'causal-spatial',  desc: 'Exterior del cono. No causal. El orden temporal puede invertirse.' };
  }

  function updateEventsTab() {
    var beta = state.beta, A = state.A;
    var gamma = Lorentz.gamma(beta);
    var k = bondik(beta);
    var Ap  = Lorentz.transform(A.x, A.ct, beta);
    var ds2 = Lorentz.spacetimeInterval(A.x, A.ct);
    var type = Lorentz.classifyInterval(ds2);
    var ti = causalInfo(type);

    el('c1-ax-k').textContent   = fmt(A.x);
    el('c1-act-k').textContent  = fmt(A.ct);
    el('c1-axp-k').textContent  = fmt(Ap.x);
    el('c1-actp-k').textContent = fmt(Ap.t);
    el('c1-ds2').textContent    = fmt(ds2, 4);
    el('c1-type').textContent   = ti.label;
    el('c1-type').className     = 'annotation ' + ti.cls;
    el('c1-beta').textContent   = fmt(beta, 3);
    el('c1-gamma').textContent  = fmt(gamma, 4);
    el('c1-k').textContent      = fmt(k, 4);
  }

  function updateCausalTab() {
    var A = state.A, B = state.B;
    var dx = B.x - A.x, dct = B.ct - A.ct;
    var ds2  = Lorentz.spacetimeInterval(dx, dct);
    var type = Lorentz.classifyInterval(ds2);
    var info = causalInfo(type);

    el('c2-dx').textContent  = fmt(dx);
    el('c2-dct').textContent = fmt(dct);
    el('c2-ds2').textContent = fmt(ds2, 4);
    el('c2-causal-icon').textContent = '\u25cf';
    el('c2-causal-type').textContent = info.name;
    el('c2-causal-desc').textContent = info.desc;
    el('c2-causal-card').className   = 'causal-badge-card ' + info.cardCls;
    el('c2-causal-icon').style.color = info.color;
  }

  function updateSimulTab() {
    var beta = state.beta, A = state.A, B = state.B;
    var Ap = Lorentz.transform(A.x, A.ct, beta);
    var Bp = Lorentz.transform(B.x, B.ct, beta);
    var dtK  = B.ct - A.ct;
    var dtKp = Bp.t - Ap.t;
    var EPS  = 1e-9;

    el('c3-dt-k').textContent  = fmt(dtK);
    el('c3-dt-kp').textContent = fmt(dtKp);

    var vK  = el('c3-verdict-k');
    var vKp = el('c3-verdict-kp');
    vK.textContent  = Math.abs(dtK)  < EPS ? 'Simult\u00e1neos \u2713' : '\u0394t = ' + fmt(dtK) + ' \u2260 0';
    vK.className    = 'sim-verdict ' + (Math.abs(dtK)  < EPS ? 'simultaneous' : 'not-simultaneous');
    vKp.textContent = Math.abs(dtKp) < EPS ? "Simult\u00e1neos en K' \u2713" : "\u0394t' = " + fmt(dtKp) + ' \u2260 0';
    vKp.className   = 'sim-verdict ' + (Math.abs(dtKp) < EPS ? 'simultaneous' : 'not-simultaneous');
  }

  /* =====================================================================
     RESIZE
  ===================================================================== */
  function resizeCanvas(canvas) {
    var pw = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
    if (pw > 0) { canvas.width = pw; canvas.height = CANVAS_H; }
  }
  function resizeAll() { resizeCanvas(c1); resizeCanvas(c2); resizeCanvas(c3); }
  window.addEventListener('resize', function() { requestAnimationFrame(resizeAll); });

  /* =====================================================================
     TABS
  ===================================================================== */
  document.querySelectorAll('.tab-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
      document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
      btn.classList.add('active');
      el(btn.dataset.tab).classList.add('active');
      requestAnimationFrame(function() { resizeAll(); updateAll(); });
    });
  });

  /* =====================================================================
     SLIDER beta + INPUTS
  ===================================================================== */
  el('global-beta-slider').addEventListener('input', function(e) {
    state.beta = parseFloat(e.target.value);
    updateAll();
  });

  function bindInput(id, sk, coord) {
    var inp = el(id);
    if (!inp) return;
    inp.addEventListener('input', function() {
      var v = parseFloat(inp.value);
      if (!isNaN(v)) {
        state[sk][coord] = clamp(v, -RANGE + 0.3, RANGE - 0.3);
        syncInputs(sk);
        updateAll();
      }
    });
  }
  bindInput('c1-ax',  'A', 'x');  bindInput('c1-act', 'A', 'ct');
  bindInput('c2-ax',  'A', 'x');  bindInput('c2-act', 'A', 'ct');
  bindInput('c2-bx',  'B', 'x');  bindInput('c2-bct', 'B', 'ct');
  bindInput('c3-ax',  'A', 'x');  bindInput('c3-act', 'A', 'ct');
  bindInput('c3-bx',  'B', 'x');  bindInput('c3-bct', 'B', 'ct');

  /* =====================================================================
     PRESETS
  ===================================================================== */
  function setupPresets(containerId, hasB) {
    var container = el(containerId);
    if (!container) return;
    container.querySelectorAll('.preset-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        container.querySelectorAll('.preset-btn').forEach(function(b) { b.classList.remove('active-preset'); });
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

  /* =====================================================================
     UPDATE ALL
  ===================================================================== */
  function updateAll() {
    updateVelocityBar();
    updateEventsTab();
    updateCausalTab();
    updateSimulTab();
    drawDiagram(c1, ctx1, 'events');
    drawDiagram(c2, ctx2, 'causal');
    drawDiagram(c3, ctx3, 'simul');
  }

  /* =====================================================================
     INIT
  ===================================================================== */
  setupDrag(c1, 'events');
  setupDrag(c2, 'causal');
  setupDrag(c3, 'simul');
  resizeAll();
  syncInputs('A');
  syncInputs('B');
  updateAll();

})();
