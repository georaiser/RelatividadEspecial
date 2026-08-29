/**
 * panel-a.js — Panel A: Postulados de Einstein, Simultaneidad Relativa y Composición de Velocidades en 3D
 *
 * 1. Simulación 3D del Experimento del Vagón de Einstein (Three.js):
 *    - Modo 1: 💡 Destello de Luz (Simultaneidad Relativa):
 *        Pulsos de luz a rapidez c hacia detectores A (trasero) y B (delantero).
 *    - Modo 2: 🚀 Disparar Sonda u' (Composición de Velocidades 3D):
 *        El vagón viaja a v = βc y dispara una sonda a u'. Se visualizan las velocidades
 *        vectoriales y se compara la trayectoria real de Einstein (u < c) con la fantasía clásica de Galileo (u' + v > c).
 *
 * 2. Cámaras:
 *    - 🏢 Sistema S: Andén en reposo (Vista 3D 360° con OrbitControls).
 *    - 🚀 Sistema S': Dentro del Vagón (Interior en reposo co-móvil).
 *
 * 3. Calculadora interactiva de suma de velocidades (Galileo vs Lorentz).
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
    probeU:     0.50,         // velocidad propia de la sonda en S' (u')
    expMode:    'flash',      // 'flash' | 'probe'
    camMode:    's',          // 's' | 'sp'
    running:    false,
    paused:     false,
    timeReal:   0,            // tiempo en segundos reales
    lastStamp:  0,
    animReqId:  null,
  };

  /* ══════════════════════════════════════════════════════════
     DOM ELEMENTS
  ══════════════════════════════════════════════════════════ */
  const container        = document.getElementById('viewport-3d');
  const btnExpFlash      = document.getElementById('btn-exp-flash');
  const btnExpProbe      = document.getElementById('btn-exp-probe');
  const btnCamS          = document.getElementById('btn-cam-s');
  const btnCamSp         = document.getElementById('btn-cam-sp');
  const hudCamLabel      = document.getElementById('hud-cam-label');
  const hudCamIcon       = document.getElementById('hud-cam-icon');
  const hudCamName       = document.getElementById('hud-cam-name');
  const hudHint          = document.getElementById('hud-hint');

  const sliderEl         = document.getElementById('speed-slider');
  const betaRd           = document.getElementById('beta-readout');
  const gammaVal         = document.getElementById('gamma-val');
  const kReadout         = document.getElementById('k-readout');
  const probeControlWrap = document.getElementById('probe-control-wrap');
  const probeUSlider     = document.getElementById('probe-u-slider');
  const probeUReadout    = document.getElementById('probe-u-readout');

  const btnPlay          = document.getElementById('btn-play');
  const btnPause         = document.getElementById('btn-pause');
  const btnReset         = document.getElementById('btn-reset');
  const presetsBetaEl    = document.getElementById('presets-a-beta');
  const presetsUEl       = document.getElementById('presets-a-u');

  // Tarjetas de lectura
  const obsSpA           = document.getElementById('obs-sp-a');
  const obsSpB           = document.getElementById('obs-sp-b');
  const obsSpDt          = document.getElementById('obs-sp-dt');
  const obsSpVerd        = document.getElementById('obs-sp-verdict');
  const badgeSp          = document.getElementById('badge-sp');

  const obsSA            = document.getElementById('obs-s-a');
  const obsSB            = document.getElementById('obs-s-b');
  const obsSDt           = document.getElementById('obs-s-dt');
  const obsSVerd         = document.getElementById('obs-s-verdict');
  const badgeS           = document.getElementById('badge-s');

  // Tarjetas de suma de velocidades (Galileo vs. Lorentz)
  const vaddG            = document.getElementById('vadd-galileo');
  const vaddL            = document.getElementById('vadd-lorentz');
  const vaddBarG         = document.getElementById('vadd-bar-g');
  const vaddBarL         = document.getElementById('vadd-bar-l');
  const vaddGWarn        = document.getElementById('vadd-g-warn');
  const vaddLNote        = document.getElementById('vadd-l-note');

  /* ══════════════════════════════════════════════════════════
     THREE.JS ENGINE SETUP
  ══════════════════════════════════════════════════════════ */
  let scene, camera, renderer, controls;
  let wagonGroup, bulbMesh, bulbLight;
  let detectorAMesh, detectorBMesh, shockwaveA, shockwaveB;
  let pulseLeftMesh, pulseRightMesh, laserBeamLeft, laserBeamRight;
  let probeMesh, galileoGhostMesh, probeLaser;
  let observerSGroup, starfield;

  function initThree() {
    if (!container) return;

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060b14);
    scene.fog = new THREE.FogExp2(0x060b14, 0.009);

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
    camera.position.set(12, 10, 22);

    // OrbitControls
    if (window.THREE && THREE.OrbitControls) {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.maxDistance = 90;
      controls.minDistance = 2;
      controls.target.set(6, 1.5, 0);
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

    // ── Pulsos de Luz y Sonda Proyectil ───────────────────
    buildLightPulses();
    buildProbeElements();

    // Modo inicial
    setCameraMode('s');
    setExperimentMode('flash');

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

    // 4. Farolas en el fondo del andén (z = 7.2, lejos de las vías para no obstruir)
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
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x4f9eff });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    observerSGroup.add(head);

    const bodyGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.9, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.25;
    observerSGroup.add(body);

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

    const wLen = L0 * 2; // 12.0 unidades
    const wWid = 2.2;
    const wHgt = 2.4;

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

    // 3. Paredes delanteras y traseras sólidas
    const endWallGeo = new THREE.BoxGeometry(0.25, wHgt, wWid);
    const endWallMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, metalness: 0.5, roughness: 0.4 });

    const rearWall = new THREE.Mesh(endWallGeo, endWallMat);
    rearWall.position.set(-L0 + 0.125, 0.5 + wHgt / 2, 0);
    wagonGroup.add(rearWall);

    const frontWall = new THREE.Mesh(endWallGeo, endWallMat);
    frontWall.position.set(L0 - 0.125, 0.5 + wHgt / 2, 0);
    wagonGroup.add(frontWall);

    // 4. Paredes laterales de CRISTAL TRANSPARENTE
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

    // Pilares
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

    // 5. Pasajero S' en el centro
    const seatGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.85, 0);
    wagonGroup.add(seat);

    const passHead = new THREE.Mesh(new THREE.SphereGeometry(0.24, 16, 16), new THREE.MeshStandardMaterial({ color: 0xa78bfa }));
    passHead.position.set(0, 1.8, 0);
    wagonGroup.add(passHead);

    const passBody = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.65, 12), new THREE.MeshStandardMaterial({ color: 0x7c3aed }));
    passBody.position.set(0, 1.35, 0);
    wagonGroup.add(passBody);

    // 6. Bombilla de Flash
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

    shockwaveB = new THREE.Mesh(shockGeo, shockMat.clone());
    shockwaveB.position.set(L0 - 0.35, 1.6, 0);
    wagonGroup.add(shockwaveB);

    // 9. Ruedas
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
    const pGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const pMat = new THREE.MeshBasicMaterial({ color: 0xfde047 });

    pulseLeftMesh = new THREE.Mesh(pGeo, pMat);
    pulseLeftMesh.visible = false;
    scene.add(pulseLeftMesh);

    const beamGeoL = new THREE.CylinderGeometry(0.04, 0.04, 1, 8);
    beamGeoL.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({ color: 0xfde047, transparent: true, opacity: 0.65 });
    laserBeamLeft = new THREE.Mesh(beamGeoL, beamMat);
    laserBeamLeft.visible = false;
    scene.add(laserBeamLeft);

    pulseRightMesh = new THREE.Mesh(pGeo, pMat.clone());
    pulseRightMesh.visible = false;
    scene.add(pulseRightMesh);

    laserBeamRight = new THREE.Mesh(beamGeoL, beamMat.clone());
    laserBeamRight.visible = false;
    scene.add(laserBeamRight);
  }

  function buildProbeElements() {
    // Sonda de plasma relativista (Einstein)
    const probeGeo = new THREE.ConeGeometry(0.3, 0.9, 16);
    probeGeo.rotateZ(-Math.PI / 2);
    const probeMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });
    probeMesh = new THREE.Mesh(probeGeo, probeMat);
    probeMesh.visible = false;
    scene.add(probeMesh);

    // Trazador láser de la sonda
    const pBeamGeo = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
    pBeamGeo.rotateZ(Math.PI / 2);
    const pBeamMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.6 });
    probeLaser = new THREE.Mesh(pBeamGeo, pBeamMat);
    probeLaser.visible = false;
    scene.add(probeLaser);

    // Marcador fantasma clásico de Galileo (u' + v)
    const ghostGeo = new THREE.ConeGeometry(0.28, 0.85, 12);
    ghostGeo.rotateZ(-Math.PI / 2);
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, wireframe: true, transparent: true, opacity: 0.75 });
    galileoGhostMesh = new THREE.Mesh(ghostGeo, ghostMat);
    galileoGhostMesh.visible = false;
    scene.add(galileoGhostMesh);
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
        btnPlay.innerHTML = (state.expMode === 'flash') ? '<span class="btn-icon">▶</span> Emitir de nuevo' : '<span class="btn-icon">▶</span> Disparar de nuevo';
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

    const γ = Lorentz.gamma(β);
    const vWagon = β * SPEED_C;
    const wagonX = vWagon * simTime;

    // Posición y escala física del vagón (Contracción de Lorentz L = L₀/γ en S)
    if (wagonGroup) {
      wagonGroup.position.set(wagonX, 0, 0);
      wagonGroup.scale.set((state.camMode === 's') ? (1.0 / γ) : 1.0, 1.0, 1.0);
    }

    // ── 1. MODO DESTELLO DE LUZ (Simultaneidad) ───────────
    if (state.expMode === 'flash') {
      if (probeMesh) probeMesh.visible = false;
      if (probeLaser) probeLaser.visible = false;
      if (galileoGhostMesh) galileoGhostMesh.visible = false;

      // Destello bombilla
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

      const tImpactSA = T_EMIT / k;
      const tImpactSB = T_EMIT * k;
      const isHitA = (state.camMode === 'sp') ? (simTime >= T_EMIT) : (simTime >= tImpactSA);
      const isHitB = (state.camMode === 'sp') ? (simTime >= T_EMIT) : (simTime >= tImpactSB);

      if (detectorAMesh) {
        detectorAMesh.material.color.setHex(isHitA ? 0x34d399 : 0xef4444);
        if (shockwaveA) {
          shockwaveA.material.opacity = isHitA ? Math.max(0, 1 - (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSA)) * 1.5) : 0;
          const s = 1 + (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSA)) * 2;
          shockwaveA.scale.set(s, s, s);
        }
      }
      if (detectorBMesh) {
        detectorBMesh.material.color.setHex(isHitB ? 0x34d399 : 0xef4444);
        if (shockwaveB) {
          shockwaveB.material.opacity = isHitB ? Math.max(0, 1 - (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSB)) * 1.5) : 0;
          const s = 1 + (simTime - (state.camMode === 'sp' ? T_EMIT : tImpactSB)) * 2;
          shockwaveB.scale.set(s, s, s);
        }
      }

      const yPulse = 1.6;
      if (hasEmitted) {
        if (state.camMode === 'sp') {
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

    // ── 2. MODO DISPARAR SONDA (Composición de velocidades) ─
    } else if (state.expMode === 'probe') {
      pulseLeftMesh.visible = pulseRightMesh.visible = false;
      laserBeamLeft.visible = laserBeamRight.visible = false;
      if (bulbLight) bulbLight.intensity = 0;

      const uPrime = state.probeU; // velocidad propia de la sonda en S'
      const v = β;

      // Velocidad resultante según Einstein / Lorentz: u = (u' + v) / (1 + u'*v)
      const uLorentz = (uPrime + v) / (1 + uPrime * v);
      // Predicción clásica de Galileo: u_gal = u' + v
      const uGalileo = uPrime + v;

      const yProbe = 1.6;

      if (hasEmitted) {
        if (state.camMode === 'sp') {
          // En S' (vagón): la sonda se aleja del centro a velocidad u'·c
          const probeDistSp = simTime * uPrime * SPEED_C;
          const probeXSp = wagonX + probeDistSp;

          probeMesh.visible = true;
          probeMesh.position.set(probeXSp, yProbe, 0);

          probeLaser.visible = true;
          probeLaser.position.set(wagonX + probeDistSp / 2, yProbe, 0);
          probeLaser.scale.set(1, probeDistSp, 1);

          galileoGhostMesh.visible = false;
        } else {
          // En S (andén): la sonda avanza desde x = 0 a rapidez uLorentz·c
          const probeDistS = simTime * uLorentz * SPEED_C;
          const probeXS = probeDistS;

          probeMesh.visible = true;
          probeMesh.position.set(probeXS, yProbe, 0);

          probeLaser.visible = true;
          probeLaser.position.set(probeDistS / 2, yProbe, 0);
          probeLaser.scale.set(1, probeDistS, 1);

          // Marcador fantasma Galileo
          const galileoDist = simTime * uGalileo * SPEED_C;
          galileoGhostMesh.visible = (uGalileo > uLorentz + 0.01);
          galileoGhostMesh.position.set(galileoDist, yProbe + 0.5, 0);
        }
      } else {
        probeMesh.visible = probeLaser.visible = galileoGhostMesh.visible = false;
      }
    }
  }

  /* ══════════════════════════════════════════════════════════
     SISTEMA DE CÁMARAS Y EXPERIMENTOS
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
      hudHint.textContent = (state.expMode === 'flash')
        ? '🖱 Arrastra para rotar 360° · ⚙ Rueda para zoom · El vagón pasa a +βc y los impactos NO son simultáneos'
        : '🖱 Arrastra para rotar 360° · Sonda verde (Einstein u < c) vs Fantasma rojo (Galileo u > c)';
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
      hudHint.textContent = (state.expMode === 'flash')
        ? 'Dentro de la cabina: los dos pulsos recorren la misma distancia a rapidez c y chocan a la vez (Δt\' = 0)'
        : 'Dentro de la cabina: la sonda se aleja a rapidez propia u\' respecto al pasajero';
      if (controls) controls.enabled = false;
    }
  }

  function setExperimentMode(exp) {
    state.expMode = exp;

    if (btnExpFlash) btnExpFlash.classList.toggle('active-exp', exp === 'flash');
    if (btnExpProbe) btnExpProbe.classList.toggle('active-exp', exp === 'probe');

    if (probeControlWrap) {
      probeControlWrap.style.display = (exp === 'probe') ? 'inline-flex' : 'none';
    }

    const secFlash = document.getElementById('section-flash-mode');
    const secProbe = document.getElementById('section-probe-mode');

    if (secFlash) secFlash.style.display = (exp === 'flash') ? 'block' : 'none';
    if (secProbe) secProbe.style.display = (exp === 'probe') ? 'block' : 'none';

    if (exp === 'flash') {
      btnPlay.innerHTML = '<span class="btn-icon">▶</span> Emitir flash';
    } else {
      btnPlay.innerHTML = '<span class="btn-icon">▶</span> Disparar sonda';
    }

    setCameraMode(state.camMode);
    updatePhysics();
    updateReadouts();
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
      // 1. SISTEMA S: Vista 3D libre con OrbitControls
    } else if (state.camMode === 'sp') {
      // 2. SISTEMA S': Cámara co-móvil con el vagón (espacio amplio con z = 11.0)
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

    // ── MODO 1: DESTELLO DE LUZ ───────────────────────────
    if (state.expMode === 'flash') {
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
        updateTheoryCalculations();
        return;
      }

      // Tarjeta S'
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

      // Tarjeta S
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

    // ── MODO 2: DISPARAR SONDA (Composición FUSIONADA) ─────
    } else if (state.expMode === 'probe') {
      const uPrime = state.probeU;
      const v = β;
      const uLorentz = (uPrime + v) / (1 + uPrime * v);
      const uGalileo = uPrime + v;
      const denom = 1 + uPrime * v;

      // Actualizar tarjetas dedicadas FUSIONADAS de Composición de Velocidades (Galileo vs. Lorentz)
      const vaddGSub = document.getElementById('vadd-g-sub');
      const vaddLSub = document.getElementById('vadd-l-sub');

      if (vaddGSub) vaddGSub.textContent = `${uPrime.toFixed(2)}c + ${v.toFixed(2)}c`;
      if (vaddLSub) {
        vaddLSub.innerHTML = `<span class="mini-frac"><span class="mf-num">${uPrime.toFixed(2)} + ${v.toFixed(2)}</span><span class="mf-denom">1 + ${(uPrime * v).toFixed(2)}</span></span> c = <span class="mini-frac"><span class="mf-num">${(uPrime + v).toFixed(2)}</span><span class="mf-denom">${denom.toFixed(3)}</span></span> c`;
      }

      if (vaddG) vaddG.textContent = uGalileo.toFixed(4) + ' c';
      if (vaddL) vaddL.textContent = uLorentz.toFixed(4) + ' c';
      if (vaddBarG) vaddBarG.style.width = Math.min((uGalileo / 1.5) * 100, 100) + '%';
      if (vaddBarL) vaddBarL.style.width = Math.min((uLorentz / 1.5) * 100, 100) + '%';

      if (vaddGWarn) {
        if (uGalileo > 1.0) {
          vaddGWarn.innerHTML = `⚠ <strong>¡Falla física! u = ${uGalileo.toFixed(2)}c &gt; c</strong> — Supera la velocidad límite y viola la causalidad.`;
        } else {
          vaddGWarn.innerHTML = `u = ${uGalileo.toFixed(4)}c (predicción lineal clásica sin límite relativista).`;
        }
      }

      if (vaddLNote) {
        if (Math.abs(uPrime - 1.0) < 0.001) {
          vaddLNote.innerHTML = `✓ Para la luz (u'=c): u = (c + v) / (1 + v/c) = <strong>1.0000c</strong> invariable en todo sistema.`;
        } else {
          vaddLNote.innerHTML = `✓ El denominador (1 + u'v/c² = ${denom.toFixed(3)}) frena la suma asegurando <strong>u = ${uLorentz.toFixed(4)}c &lt; c</strong>.`;
        }
      }
    }

    // ── Actualizar desgloses numéricos en las cajas de Fundamento Teórico ──
    updateTheoryCalculations();
  }

  function updateTheoryCalculations() {
    const β = state.beta;
    const k = bondik(β);

    // 1. Modo Simultaneidad
    const tImpactSp = T_EMIT; // 1.00 s
    const tImpactSA = T_EMIT / k;
    const tImpactSB = T_EMIT * k;
    const dtS = tImpactSB - tImpactSA;

    const calcGTa = document.getElementById('calc-g-ta');
    const calcGTb = document.getElementById('calc-g-tb');
    const calcGDt = document.getElementById('calc-g-dt');
    const calcLTa = document.getElementById('calc-l-ta');
    const calcLTb = document.getElementById('calc-l-tb');
    const calcLDt = document.getElementById('calc-l-dt');

    if (calcGTa) calcGTa.textContent = `${tImpactSp.toFixed(2)} s`;
    if (calcGTb) calcGTb.textContent = `${tImpactSp.toFixed(2)} s`;
    if (calcGDt) calcGDt.textContent = `Δt = 0.00 s (Simultáneos)`;

    if (calcLTa) calcLTa.textContent = `${tImpactSA.toFixed(2)} s`;
    if (calcLTb) calcLTb.textContent = `${tImpactSB.toFixed(2)} s`;
    if (calcLDt) {
      if (β < 0.005) {
        calcLDt.textContent = `Δt = 0.00 s (En reposo)`;
      } else {
        calcLDt.textContent = `Δt = ${dtS.toFixed(2)} s (No simultáneos)`;
      }
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

  if (presetsUEl) {
    presetsUEl.querySelectorAll('.btn-preset-u').forEach(btn => {
      btn.addEventListener('click', () => {
        presetsUEl.querySelectorAll('.btn-preset-u').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.probeU = parseFloat(btn.dataset.u);
        if (probeUSlider) probeUSlider.value = state.probeU;
        if (probeUReadout) probeUReadout.textContent = `u' = ${state.probeU.toFixed(2)}c`;
        updateReadouts();
      });
    });
  }

  if (probeUSlider) {
    probeUSlider.addEventListener('input', () => {
      state.probeU = parseFloat(probeUSlider.value);
      if (probeUReadout) probeUReadout.textContent = `u' = ${state.probeU.toFixed(2)}c`;
      if (presetsUEl) {
        presetsUEl.querySelectorAll('.btn-preset-u').forEach(b => {
          b.classList.toggle('active', Math.abs(parseFloat(b.dataset.u) - state.probeU) < 0.01);
        });
      }
      updateReadouts();
    });
  }

  /* ══════════════════════════════════════════════════════════
     BOTONES SELECTORES DE CÁMARA Y EXPERIMENTO
  ══════════════════════════════════════════════════════════ */
  if (btnCamS)     btnCamS.addEventListener('click', () => setCameraMode('s'));
  if (btnCamSp)    btnCamSp.addEventListener('click', () => setCameraMode('sp'));
  if (btnExpFlash) btnExpFlash.addEventListener('click', () => setExperimentMode('flash'));
  if (btnExpProbe) btnExpProbe.addEventListener('click', () => setExperimentMode('probe'));

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
    btnPlay.innerHTML  = (state.expMode === 'flash') ? '<span class="btn-icon">▶</span> Emitir flash' : '<span class="btn-icon">▶</span> Disparar sonda';
    btnPause.disabled  = true;
    btnPause.innerHTML = '<span class="btn-icon">⏸</span> Pausar';

    updatePhysics();
    updateReadouts();
  });

  /* ══════════════════════════════════════════════════════════
     CALCULADORA DE ADICIÓN DE VELOCIDADES
  ══════════════════════════════════════════════════════════ */
  function updateVelocityAddition() {
    const uPrime = (state.expMode === 'probe') ? state.probeU : 1.0;
    const v = state.beta;

    const uGalileo = uPrime + v;
    const denom = 1 + uPrime * v;
    const uLorentz = denom !== 0 ? (uPrime + v) / denom : 1.0;

    if (vaddG) vaddG.textContent = uGalileo.toFixed(4) + ' c';
    if (vaddL) vaddL.textContent = uLorentz.toFixed(4) + ' c';

    if (vaddBarG) vaddBarG.style.width = Math.min((uGalileo / 1.5) * 100, 100) + '%';
    if (vaddBarL) vaddBarL.style.width = Math.min(uLorentz * 100, 100) + '%';

    if (vaddGWarn) {
      if (uGalileo > 1.0) {
        vaddGWarn.innerHTML = `⚠ u = ${uPrime.toFixed(2)}c + ${v.toFixed(2)}c = <strong>${uGalileo.toFixed(2)}c &gt; c</strong> — ¡Supera la velocidad de la luz (falla física)!`;
      } else {
        vaddGWarn.innerHTML = `u = ${uPrime.toFixed(2)}c + ${v.toFixed(2)}c = <strong>${uGalileo.toFixed(4)}c</strong> (predicción lineal clásica).`;
      }
    }

    if (vaddLNote) {
      if (Math.abs(uPrime - 1.0) < 0.001) {
        vaddLNote.innerHTML = `✓ Para la luz (u'=c): u = (c + v)/(1 + v/c) = <strong>1.0000c</strong> siempre.`;
      } else {
        vaddLNote.innerHTML = `✓ u = (${uPrime.toFixed(2)} + ${v.toFixed(2)}) / (1 + ${(uPrime * v).toFixed(3)}) c = <strong>${uLorentz.toFixed(4)}c &lt; c</strong>.`;
      }
    }
  }

  if (probeUSlider) {
    probeUSlider.addEventListener('input', () => {
      state.probeU = parseFloat(probeUSlider.value);
      if (probeUReadout) probeUReadout.textContent = `u' = ${state.probeU.toFixed(2)}c`;
      updateVelocityAddition();
      updateReadouts();
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
