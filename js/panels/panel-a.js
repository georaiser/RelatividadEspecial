/**
 * panel-a.js — Panel A: Postulados de Einstein y Simultaneidad Relativa en 3D
 *
 * Simulación 3D del Experimento del Vagón de Einstein (Three.js):
 *   - Vía férrea y Andén (Sistema S en reposo con observador en x = 0).
 *   - Vagón de pasajeros con paredes de cristal transparentes (Sistema S').
 *   - Pasajero en el centro, bombilla de flash y detectores A (trasero) y B (delantero).
 *   - 3 Modos de cámara interactivos:
 *       1. 🏢 Cámara Andén S: se observa el paso del tren a +βc y los impactos NO simultáneos.
 *       2. 🚀 Cámara Dentro del Vagón S': se observa desde el interior los impactos SIMULTÁNEOS a t' = 1.00s.
 *       3. 🌌 Vista 3D Libre (360°): control orbital libre con OrbitControls.
 *   - Sincronización en tiempo real con cronómetros y calculadora de adición de velocidades.
 *
 * Dependencias: js/lib/three.min.js, js/lib/OrbitControls.js, js/physics/lorentz.js
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════
     CONSTANTES FÍSICAS Y DE ESCALA 3D
  ══════════════════════════════════════════════════════════ */
  const L0 = 6.0;              // Semilongitud del vagón en reposo (unidades 3D)
  const T_EMIT = 1.0;          // Tiempo propio de impacto en S' (segundos virtuales)
  const SPEED_C = L0 / T_EMIT; // Rapidez de la luz (6.0 u/s)
  const SECONDS_REAL = 4.0;    // Duración de la animación en segundos reales

  const bondik = (β) => Math.sqrt((1 + β) / (1 - β));

  /* ══════════════════════════════════════════════════════════
     ESTADO
  ══════════════════════════════════════════════════════════ */
  let state = {
    beta:       0.60,
    camMode:    's',          // 's' | 'sp' | 'free'
    running:    false,
    paused:     false,
    timeReal:   0,            // tiempo en segundos reales
    lastStamp:  0,
    animReqId:  null,
  };

  /* ══════════════════════════════════════════════════════════
     DOM ELEMENTS
  ══════════════════════════════════════════════════════════ */
  const container      = document.getElementById('viewport-3d');
  const btnCamS        = document.getElementById('btn-cam-s');
  const btnCamSp       = document.getElementById('btn-cam-sp');
  const btnCamFree     = document.getElementById('btn-cam-free');
  const hudCamLabel    = document.getElementById('hud-cam-label');
  const hudCamIcon     = document.getElementById('hud-cam-icon');
  const hudCamName     = document.getElementById('hud-cam-name');
  const hudHint        = document.getElementById('hud-hint');

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
     THREE.JS ENGINE SETUP
  ══════════════════════════════════════════════════════════ */
  let scene, camera, renderer, controls;
  let wagonGroup, bulbMesh, bulbLight;
  let detectorAMesh, detectorBMesh, shockwaveA, shockwaveB;
  let pulseLeftMesh, pulseRightMesh, laserBeamLeft, laserBeamRight;
  let observerSGroup, starfield;

  function initThree() {
    if (!container) return;

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);
    scene.fog = new THREE.FogExp2(0x060b14, 0.010);

    // Renderer
    const w = container.clientWidth || 800;
    const h = container.clientHeight || 440;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild(renderer.domElement);

    // Cámara
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
    camera.position.set(10, 8, 22);

    // OrbitControls
    if (window.THREE && THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxDistance = 90;
      controls.minDistance = 2;
      controls.target.set(6, 1.2, 0);
      controls.enabled = true;
    }

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x4f9eff, 1.1);
    dirLight.position.set(20, 25, 20);
    scene.add(dirLight);

    const dirLight2 = new THREE.DirectionalLight(0xa78bfa, 0.5);
    dirLight2.position.set(-20, 10, -20);
    scene.add(dirLight2);

    // ── Entorno: Vías, Andén y Estrellas ──────────────────
    buildStarfield();
    buildRailwayAndPlatform();

    // ── El Vagón de Einstein (S') ─────────────────────────
    buildWagon();

    // ── Pulsos de Luz y Efectos de Impacto ────────────────
    buildLightPulses();

    // Establecer modo de cámara inicial
    setCameraMode('s');

    // Resize listener
    window.addEventListener('resize', onWindowResize);

    // Render loop
    requestAnimationFrame(renderLoop);
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  /* ══════════════════════════════════════════════════════════
     CONSTRUCCIÓN DEL ESCENARIO 3D
  ══════════════════════════════════════════════════════════ */
  function buildStarfield() {
    const starGeo = new THREE.BufferGeometry();
    const count = 500;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 3) {
      pos[i]     = (Math.random() - 0.5) * 200;
      pos[i + 1] = Math.random() * 80 + 5;
      pos[i + 2] = (Math.random() - 0.5) * 200;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      transparent: true,
      opacity: 0.5,
    });
    starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);
  }

  function buildRailwayAndPlatform() {
    // 1. Suelo de balasto y grilla
    const groundGeo = new THREE.PlaneGeometry(160, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    scene.add(ground);

    // 2. Rieles de acero a lo largo de X
    const railMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const railGeo = new THREE.BoxGeometry(140, 0.2, 0.15);

    const railLeft = new THREE.Mesh(railGeo, railMat);
    railLeft.position.set(20, 0.15, -1.1);
    scene.add(railLeft);

    const railRight = new THREE.Mesh(railGeo, railMat);
    railRight.position.set(20, 0.15, 1.1);
    scene.add(railRight);

    // Traviesas de madera entre los rieles
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const tieGeo = new THREE.BoxGeometry(0.5, 0.15, 2.8);
    for (let x = -40; x <= 80; x += 1.8) {
      const tie = new THREE.Mesh(tieGeo, tieMat);
      tie.position.set(x, 0.08, 0);
      scene.add(tie);
    }

    // 3. Andén de la Estación (Plataforma elevada a la derecha de las vías)
    const platGeo = new THREE.BoxGeometry(140, 0.6, 6);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(20, 0.3, 4.6);
    scene.add(platform);

    // Línea de seguridad amarilla del andén
    const lineGeo = new THREE.BoxGeometry(140, 0.02, 0.15);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const safeLine = new THREE.Mesh(lineGeo, lineMat);
    safeLine.position.set(20, 0.61, 1.9);
    scene.add(safeLine);

    // 4. Farolas en el fondo del andén (z = 7.2, lejos de las vías para no obstruir la vista)
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.6 });
    for (let lx = -25; lx <= 65; lx += 30) {
      const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4.5, 12);
      const pole = new THREE.Mesh(poleGeo, lampMat);
      pole.position.set(lx, 2.5, 7.2);
      scene.add(pole);

      const lampHeadGeo = new THREE.SphereGeometry(0.35, 16, 12);
      const lampHeadMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
      const lampHead = new THREE.Mesh(lampHeadGeo, lampHeadMat);
      lampHead.position.set(lx, 4.8, 7.2);
      scene.add(lampHead);
    }

    // 5. Observador S en el Andén (Parado en x = 0)
    observerSGroup = new THREE.Group();
    // Cabeza
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x4f9eff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    observerSGroup.add(head);
    // Cuerpo
    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.9, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.25;
    observerSGroup.add(body);
    // Piernas
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
    const legGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.7, 8);
    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.12, 0.45, 0);
    observerSGroup.add(legL);
    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.12, 0.45, 0);
    observerSGroup.add(legR);

    observerSGroup.position.set(0, 0.6, 3.2);
    scene.add(observerSGroup);

    // Marcador vertical de emisión en el andén (x = 0)
    const markerGeo = new THREE.CylinderGeometry(0.03, 0.03, 6, 8);
    const markerMat = new THREE.MeshBasicMaterial({ color: 0x4f9eff, transparent: true, opacity: 0.45 });
    const emitMarker = new THREE.Mesh(markerGeo, markerMat);
    emitMarker.position.set(0, 3.0, 0);
    scene.add(emitMarker);
  }

  function buildWagon() {
    wagonGroup = new THREE.Group();

    const wLen = L0 * 2; // 12.0 unidades de largo total
    const wWid = 2.2;    // Ancho
    const wHgt = 2.4;    // Altura

    // 1. Suelo y chasis del vagón
    const floorGeo = new THREE.BoxGeometry(wLen, 0.25, wWid);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = 0.5;
    wagonGroup.add(floor);

    // 2. Techo del vagón
    const roofGeo = new THREE.BoxGeometry(wLen, 0.2, wWid);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, metalness: 0.7, roughness: 0.25 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.5 + wHgt;
    wagonGroup.add(roof);

    // 3. Paredes delanteras y traseras sólidas (donde van los detectores)
    const endWallGeo = new THREE.BoxGeometry(0.25, wHgt, wWid);
    const endWallMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, metalness: 0.5, roughness: 0.4 });

    // Pared trasera (Detector A en x = -L0)
    const rearWall = new THREE.Mesh(endWallGeo, endWallMat);
    rearWall.position.set(-L0 + 0.125, 0.5 + wHgt / 2, 0);
    wagonGroup.add(rearWall);

    // Pared delantera (Detector B en x = +L0)
    const frontWall = new THREE.Mesh(endWallGeo, endWallMat);
    frontWall.position.set(L0 - 0.125, 0.5 + wHgt / 2, 0);
    wagonGroup.add(frontWall);

    // 4. Paredes laterales de CRISTAL TRANSPARENTE (para ver el interior)
    const glassGeo = new THREE.BoxGeometry(wLen - 0.5, wHgt - 0.2, 0.08);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      roughness: 0.1,
      metalness: 0.2,
      depthWrite: false,
    });

    const glassFront = new THREE.Mesh(glassGeo, glassMat);
    glassFront.position.set(0, 0.5 + wHgt / 2, wWid / 2 - 0.04);
    wagonGroup.add(glassFront);

    const glassBack = new THREE.Mesh(glassGeo, glassMat);
    glassBack.position.set(0, 0.5 + wHgt / 2, -wWid / 2 + 0.04);
    wagonGroup.add(glassBack);

    // Pilares de las ventanas
    const pillarGeo = new THREE.BoxGeometry(0.15, wHgt, 0.1);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9 });
    for (let px = -L0 + 2.4; px <= L0 - 2.4; px += 2.4) {
      const pFront = new THREE.Mesh(pillarGeo, pillarMat);
      pFront.position.set(px, 0.5 + wHgt / 2, wWid / 2);
      wagonGroup.add(pFront);

      const pBack = new THREE.Mesh(pillarGeo, pillarMat);
      pBack.position.set(px, 0.5 + wHgt / 2, -wWid / 2);
      wagonGroup.add(pBack);
    }

    // 5. Interior: Pasajero S' sentado en el centro (x = 0)
    const seatGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.85, 0);
    wagonGroup.add(seat);

    // Figura del Pasajero S'
    const passHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshStandardMaterial({ color: 0xa78bfa }));
    passHead.position.set(0, 1.8, 0);
    wagonGroup.add(passHead);

    const passBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 12), new THREE.MeshStandardMaterial({ color: 0x7c3aed }));
    passBody.position.set(0, 1.35, 0);
    wagonGroup.add(passBody);

    // 6. Bombilla / Lámpara de Flash en el centro del techo (x = 0)
    const bulbGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
    bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
    bulbMesh.position.set(0, 2.4, 0);
    wagonGroup.add(bulbMesh);

    bulbLight = new THREE.PointLight(0xfde047, 0, 15);
    bulbLight.position.set(0, 2.4, 0);
    wagonGroup.add(bulbLight);

    // 7. Detector A (Trasero, en x = -L0)
    const detGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16);
    detGeo.rotateZ(Math.PI / 2);
    const detAMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    detectorAMesh = new THREE.Mesh(detGeo, detAMat);
    detectorAMesh.position.set(-L0 + 0.3, 1.6, 0);
    wagonGroup.add(detectorAMesh);

    // Anillo de onda de choque para Detector A
    const shockGeo = new THREE.RingGeometry(0.4, 0.6, 24);
    shockGeo.rotateY(Math.PI / 2);
    const shockMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0, side: THREE.DoubleSide });
    shockwaveA = new THREE.Mesh(shockGeo, shockMat);
    shockwaveA.position.set(-L0 + 0.35, 1.6, 0);
    wagonGroup.add(shockwaveA);

    // 8. Detector B (Delantero, en x = +L0)
    const detBMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    detectorBMesh = new THREE.Mesh(detGeo, detBMat);
    detectorBMesh.position.set(L0 - 0.3, 1.6, 0);
    wagonGroup.add(detectorBMesh);

    // Anillo de onda de choque para Detector B
    shockwaveB = new THREE.Mesh(shockGeo, shockMat.clone());
    shockwaveB.position.set(L0 - 0.35, 1.6, 0);
    wagonGroup.add(shockwaveB);

    // 9. Ruedas del vagón
    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.18, 16);
    wheelGeo.rotateX(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 });

    [-L0 + 1.2, -L0 + 2.6, L0 - 2.6, L0 - 1.2].forEach(wx => {
      const wL = new THREE.Mesh(wheelGeo, wheelMat);
      wL.position.set(wx, 0.35, -1.1);
      wagonGroup.add(wL);

      const wR = new THREE.Mesh(wheelGeo, wheelMat);
      wR.position.set(wx, 0.35, 1.1);
      wagonGroup.add(wR);
    });

    wagonGroup.position.set(0, 0, 0);
    scene.add(wagonGroup);
  }

  function buildLightPulses() {
    // Fotón izquierdo (hacia Detector A)
    const pGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    pulseLeftMesh = new THREE.Mesh(pGeo, pMat);
    pulseLeftMesh.visible = false;
    scene.add(pulseLeftMesh);

    // Rayo trazador izquierdo
    const beamGeoL = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    beamGeoL.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.65 });
    laserBeamLeft = new THREE.Mesh(beamGeoL, beamMat);
    laserBeamLeft.visible = false;
    scene.add(laserBeamLeft);

    // Fotón derecho (hacia Detector B)
    pulseRightMesh = new THREE.Mesh(pGeo, pMat.clone());
    pulseRightMesh.visible = false;
    scene.add(pulseRightMesh);

    // Rayo trazador derecho
    laserBeamRight = new THREE.Mesh(beamGeoL, beamMat.clone());
    laserBeamRight.visible = false;
    scene.add(laserBeamRight);
  }

  /* ══════════════════════════════════════════════════════════
     ACTUALIZACIÓN FÍSICA Y RENDER LOOP (60 FPS)
  ══════════════════════════════════════════════════════════ */
  function renderLoop(timestamp) {
    state.animReqId = requestAnimationFrame(renderLoop);

    if (!state.lastStamp) state.lastStamp = timestamp;
    const delta = (timestamp - state.lastStamp) / 1000;
    state.lastStamp = timestamp;

    if (state.running && !state.paused) {
      state.timeReal += delta;
      if (state.timeReal >= SECONDS_REAL) {
        state.timeReal = SECONDS_REAL;
        state.running  = false;
        state.paused   = false;
        btnPlay.disabled = false;
        btnPlay.innerHTML = '<span class="btn-icon">▶</span> Emitir de nuevo';
        btnPause.disabled = true;
        btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      }
    }

    updatePhysics();
    updateCamera();
    updateReadouts();

    if (controls && controls.enabled) {
      controls.update();
    }

    renderer.render(scene, camera);
  }

  function updatePhysics() {
    const β = state.beta;
    const k = bondik(β);
    const maxSimTime = Math.max(k * 1.3, 2.5);
    const simTime = (state.timeReal / SECONDS_REAL) * maxSimTime;
    const hasEmitted = simTime > 0.001;

    // Velocidad del vagón en unidades 3D: v = β · c
    const vWagon = β * SPEED_C;
    const wagonX = vWagon * simTime;

    // 1. Posición del vagón
    if (wagonGroup) {
      wagonGroup.position.set(wagonX, 0, 0);
    }

    // 2. Destello de la bombilla
    if (bulbMesh && bulbLight) {
      if (hasEmitted && simTime < 0.4) {
        bulbMesh.material.color.setHex(0xfde047);
        bulbLight.intensity = Math.max(0, 4 - simTime * 10);
      } else if (hasEmitted) {
        bulbMesh.material.color.setHex(0xfef08a);
        bulbLight.intensity = 0.5;
      } else {
        bulbMesh.material.color.setHex(0x64748b);
        bulbLight.intensity = 0;
      }
    }

    // 3. Tiempos físicos de impacto en el sistema del andén (S)
    const tImpactSA = T_EMIT / k; // Impacto en A
    const tImpactSB = T_EMIT * k; // Impacto en B

    // Tiempos físicos de impacto en el sistema del vagón (S')
    const isHitA = (state.camMode === 'sp') ? (simTime >= T_EMIT) : (simTime >= tImpactSA);
    const isHitB = (state.camMode === 'sp') ? (simTime >= T_EMIT) : (simTime >= tImpactSB);

    // Actualizar Detector A
    if (detectorAMesh) {
      if (isHitA) {
        detectorAMesh.material.color.setHex(0x34d399); // Verde activo
        if (shockwaveA) {
          shockwaveA.material.opacity = Math.max(0, 1 - (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSA)) * 1.5);
          const s = 1 + (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSA)) * 2;
          shockwaveA.scale.set(s, s, s);
        }
      } else {
        detectorAMesh.material.color.setHex(0xef4444); // Rojo esperando
        if (shockwaveA) shockwaveA.material.opacity = 0;
      }
    }

    // Actualizar Detector B
    if (detectorBMesh) {
      if (isHitB) {
        detectorBMesh.material.color.setHex(0x34d399); // Verde activo
        if (shockwaveB) {
          shockwaveB.material.opacity = Math.max(0, 1 - (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSB)) * 1.5);
          const s = 1 + (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSB)) * 2;
          shockwaveB.scale.set(s, s, s);
        }
      } else {
        detectorBMesh.material.color.setHex(0xef4444); // Rojo esperando
        if (shockwaveB) shockwaveB.material.opacity = 0;
      }
    }

    // 4. Posición de los pulsos de luz 3D
    const yPulse = 1.6;
    if (hasEmitted) {
      if (state.camMode === 'sp') {
        // En el vagón (S'): los pulsos salen del centro del vagón y viajan simétricamente a rapidez c
        const dSp = Math.min(simTime * SPEED_C, L0);
        const pLeftX = wagonX - dSp;
        const pRightX = wagonX + dSp;

        pulseLeftMesh.visible = !isHitA;
        pulseLeftMesh.position.set(pLeftX, yPulse, 0);

        pulseRightMesh.visible = !isHitB;
        pulseRightMesh.position.set(pRightX, yPulse, 0);

        laserBeamLeft.visible = !isHitA;
        laserBeamLeft.position.set(wagonX - dSp / 2, yPulse, 0);
        laserBeamLeft.scale.set(1, dSp, 1);

        laserBeamRight.visible = !isHitB;
        laserBeamRight.position.set(wagonX + dSp / 2, yPulse, 0);
        laserBeamRight.scale.set(1, dSp, 1);

      } else {
        // En el andén (S): los pulsos salen del punto fijo x = 0 a rapidez c
        const emitX = 0;
        const dLightLeft = Math.min(simTime, tImpactSA) * SPEED_C;
        const pLeftX = emitX - dLightLeft;

        const dLightRight = Math.min(simTime, tImpactSB) * SPEED_C;
        const pRightX = emitX + dLightRight;

        pulseLeftMesh.visible = !isHitA;
        pulseLeftMesh.position.set(pLeftX, yPulse, 0);

        pulseRightMesh.visible = !isHitB;
        pulseRightMesh.position.set(pRightX, yPulse, 0);

        laserBeamLeft.visible = !isHitA;
        laserBeamLeft.position.set(emitX - dLightLeft / 2, yPulse, 0);
        laserBeamLeft.scale.set(1, dLightLeft, 1);

        laserBeamRight.visible = !isHitB;
        laserBeamRight.position.set(emitX + dLightRight / 2, yPulse, 0);
        laserBeamRight.scale.set(1, dLightRight, 1);
      }
    } else {
      pulseLeftMesh.visible = pulseRightMesh.visible = false;
      laserBeamLeft.visible = laserBeamRight.visible = false;
    }
  }

  /* ══════════════════════════════════════════════════════════
     SISTEMA DE CÁMARAS Y PERSPECTIVAS
  ══════════════════════════════════════════════════════════ */
  function setCameraMode(mode) {
    state.camMode = mode;

    if (btnCamS)  btnCamS.classList.toggle('active-cam', mode === 's');
    if (btnCamSp) btnCamSp.classList.toggle('active-cam', mode === 'sp');

    if (mode === 's') {
      hudCamIcon.textContent = '🏢';
      hudCamName.textContent = 'Sistema S: Andén en reposo (Vista 3D 360°)';
      hudCamLabel.style.borderColor = 'rgba(79, 158, 255, 0.4)';
      hudCamLabel.style.color = 'var(--color-accent)';
      hudHint.textContent = '🖱 Arrastra para rotar 360° · ⚙ Rueda para zoom · El vagón pasa a +βc y los impactos NO son simultáneos';
      if (controls) {
        controls.enabled = true;
        controls.target.set(6, 1.5, 0);
      }
      camera.position.set(12, 10, 22);
    } else if (mode === 'sp') {
      hudCamIcon.textContent = '🚀';
      hudCamName.textContent = 'Sistema S\': Dentro del Vagón (Interior en reposo)';
      hudCamLabel.style.borderColor = 'rgba(167, 139, 250, 0.4)';
      hudCamLabel.style.color = 'var(--color-accent-2)';
      hudHint.textContent = 'Dentro de la cabina: los dos pulsos recorren la misma distancia a rapidez c y chocan a la vez (Δt\' = 0)';
      if (controls) controls.enabled = false;
    }
  }

  function updateCamera() {
    if (!camera) return;

    const β = state.beta;
    const k = bondik(β);
    const maxSimTime = Math.max(k * 1.3, 2.5);
    const simTime = (state.timeReal / SECONDS_REAL) * maxSimTime;
    const vWagon = β * SPEED_C;
    const wagonX = vWagon * simTime;

    if (state.camMode === 's') {
      // 1. SISTEMA S: La cámara 3D libre es controlada por OrbitControls
      // OrbitControls se actualiza en el render loop.
    } else if (state.camMode === 'sp') {
      // 2. SISTEMA S': Cámara co-móvil perfectamente centrada con el vagón
      // El vagón permanece completamente estático en la pantalla y se ve todo el interior de extremo a extremo con margen
      const camPos = new THREE.Vector3(wagonX, 2.4, 11.0);
      const lookTarget = new THREE.Vector3(wagonX, 1.5, 0);
      camera.position.copy(camPos);
      camera.lookAt(lookTarget);
    }
  }

  /* ══════════════════════════════════════════════════════════
     ACTUALIZAR TARJETAS DE LECTURA (S y S')
  ══════════════════════════════════════════════════════════ */
  function updateReadouts() {
    const β = state.beta;
    const k = bondik(β);
    const maxSimTime = Math.max(k * 1.3, 2.5);
    const simTime = (state.timeReal / SECONDS_REAL) * maxSimTime;

    const tImpactSpA = T_EMIT;
    const tImpactSpB = T_EMIT;
    const dtSp       = 0.00;

    const tImpactSA  = T_EMIT / k;
    const tImpactSB  = T_EMIT * k;
    const dtS        = tImpactSB - tImpactSA;

    if (state.timeReal === 0) {
      obsSpA.textContent = obsSpB.textContent = obsSpDt.textContent = '—';
      obsSA.textContent  = obsSB.textContent  = obsSDt.textContent  = '—';
      obsSpVerd.textContent = 'Pulsa "Emitir flash" para iniciar la simulación 3D';
      obsSVerd.textContent  = 'Pulsa "Emitir flash" para iniciar la simulación 3D';
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
        updateReadouts();
      });
    });
  }

  /* ══════════════════════════════════════════════════════════
     CONTROLADORES DE CÁMARA
  ══════════════════════════════════════════════════════════ */
  if (btnCamS)    btnCamS.addEventListener('click', () => setCameraMode('s'));
  if (btnCamSp)   btnCamSp.addEventListener('click', () => setCameraMode('sp'));
  if (btnCamFree) btnCamFree.addEventListener('click', () => setCameraMode('free'));

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
      btnPlay.innerHTML  = '<span class="btn-icon">⏸</span> En vuelo 3D…';
      btnPause.disabled  = false;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
      return;
    }

    state.timeReal  = 0;
    state.running   = true;
    state.paused    = false;
    state.lastStamp = performance.now();

    btnPlay.disabled   = true;
    btnPlay.innerHTML  = '<span class="btn-icon">⏸</span> En vuelo 3D…';
    btnPause.disabled  = false;
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';
  });

  btnPause.addEventListener('click', () => {
    if (!state.running) return;

    if (!state.paused) {
      state.paused = true;
      btnPlay.disabled   = false;
      btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Reanudar';
      btnPause.disabled  = true;
      btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausado';
    }
  });

  btnReset.addEventListener('click', () => {
    state.running  = false;
    state.paused   = false;
    state.timeReal = 0;

    btnPlay.disabled   = false;
    btnPlay.innerHTML  = '<span class="btn-icon">▶</span> Emitir flash';
    btnPause.disabled  = true;
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    updatePhysics();
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
  window.addEventListener('DOMContentLoaded', () => {
    initThree();
    updateVelocityBar();
    updateVelocityAddition();
    updateReadouts();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initThree();
    updateVelocityBar();
    updateVelocityAddition();
    updateReadouts();
  }

})();
