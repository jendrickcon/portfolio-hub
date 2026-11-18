// Procedural Three.js CRT Workstation (Concept 3 — Hybrid Enuhri Machine)
// Loads pinned self-hosted Three.js dynamically so CSS/HTML fallback remains immune to WebGL failure.

const STATE_LIGHT_HEX = {
  standby: 0x6b7c3e,
  menu: 0x39ff14,
  live: 0x00e5ff,
  paused: 0xffbf00,
};

export async function createCrtScene({ canvas, overlayContainer, pixelEnv, initialQuality, reducedMotion, coarsePointer, onFatalFallback }) {
  const THREE = await import('./vendor/three.module.min.js');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
  } catch (err) {
    throw new Error('WebGLRenderer init failed: ' + (err?.message || String(err)));
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0c10);
  scene.fog = new THREE.Fog(0x0a0c10, 4.2, 8.5);

  const camera = new THREE.PerspectiveCamera(35, Math.max(1, window.innerWidth) / Math.max(1, window.innerHeight), 0.1, 25);

  // Camera poses: pulled back on standby, smoothly dollies in for active screen legibility
  const CAM_STANDBY_POS = new THREE.Vector3(0, 1.04, 3.05);
  const CAM_STANDBY_TARGET = new THREE.Vector3(0, 0.78, -0.05);
  const CAM_ACTIVE_POS = new THREE.Vector3(0, 1.02, 2.60);
  const CAM_ACTIVE_TARGET = new THREE.Vector3(0, 0.90, 0.14);

  const curCamPos = CAM_STANDBY_POS.clone();
  const curLookAt = CAM_STANDBY_TARGET.clone();
  let goalCamPos = CAM_STANDBY_POS.clone();
  let goalLookAt = CAM_STANDBY_TARGET.clone();
  let cameraTweening = false;
  let cameraTweenStart = 0;
  let cameraFromPos = CAM_STANDBY_POS.clone();
  let cameraFromTarget = CAM_STANDBY_TARGET.clone();

  // ---- Lighting (<= 1 shadow-casting light) ----
  const hemiLight = new THREE.HemisphereLight(0x283444, 0x0b0a09, 0.72);
  scene.add(hemiLight);

  const keyLight = new THREE.SpotLight(0xfff4e0, 4.2, 10, Math.PI * 0.28, 0.6, 1.4);
  keyLight.position.set(1.35, 3.1, 2.15);
  keyLight.target.position.set(0, 0.65, 0.1);
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);
  scene.add(keyLight.target);

  const screenBounceLight = new THREE.PointLight(STATE_LIGHT_HEX.standby, 0.22, 1.9, 1.8);
  screenBounceLight.position.set(0, 0.56, 0.56);
  scene.add(screenBounceLight);

  let targetLightColor = new THREE.Color(STATE_LIGHT_HEX.standby);
  let targetLightIntensity = 0.22;

  // ---- Layer 1 Geometry (< 3,000 tris, < 20 draw calls) ----
  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  const workstationGroup = new THREE.Group();
  rootGroup.add(workstationGroup);

  // Desk Surface (matte dark slate-walnut)
  const deskMat = new THREE.MeshStandardMaterial({
    color: 0x171a20,
    roughness: 0.68,
    metalness: 0.08,
  });
  const deskMesh = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 4.6), deskMat);
  deskMesh.rotation.x = -Math.PI / 2;
  deskMesh.receiveShadow = true;
  rootGroup.add(deskMesh);

  // Editorial Back Wall
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c10,
    roughness: 0.92,
    metalness: 0.0,
  });
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(11, 6.2), wallMat);
  wallMesh.position.set(0, 2.1, -1.7);
  rootGroup.add(wallMesh);

  // Faint horizon / routing reference line
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x16242c });
  const horizonMesh = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 0.006), lineMat);
  horizonMesh.position.set(0, 0.28, -1.66);
  rootGroup.add(horizonMesh);

  // ---- Layer 2: 320x180 Pixel Environment Backdrop Plane (1 draw call) ----
  const pixelTexture = new THREE.CanvasTexture(pixelEnv.canvas);
  pixelTexture.colorSpace = THREE.SRGBColorSpace;
  pixelTexture.magFilter = THREE.NearestFilter;
  pixelTexture.minFilter = THREE.NearestFilter;
  pixelTexture.generateMipmaps = false;

  const pixelPlaneMat = new THREE.MeshBasicMaterial({ map: pixelTexture });
  const pixelPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.48, 2.52), pixelPlaneMat);
  pixelPlane.position.set(0, 1.32, -1.56);
  rootGroup.add(pixelPlane);

  // ---- Monitor & Stand ----
  const beigeMat = new THREE.MeshStandardMaterial({
    color: 0xc8bfb0,
    roughness: 0.72,
    metalness: 0.04,
  });
  const bezelMat = new THREE.MeshStandardMaterial({
    color: 0x26282b,
    roughness: 0.8,
    metalness: 0.08,
  });
  const darkSlotMat = new THREE.MeshStandardMaterial({
    color: 0x151618,
    roughness: 0.88,
  });

  // Swivel Base & Neck
  const footMesh = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.06, 0.76), beigeMat);
  footMesh.position.set(0, 0.03, -0.08);
  footMesh.castShadow = true;
  footMesh.receiveShadow = true;
  workstationGroup.add(footMesh);

  const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.24, 0.14, 16), bezelMat);
  neckMesh.position.set(0, 0.11, -0.08);
  workstationGroup.add(neckMesh);

  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 0.84, -0.05);
  workstationGroup.add(monitorGroup);

  // Helper: rounded rect Path
  function makeRoundedRectShape(w, h, r) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r);
    s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h);
    s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  // Front Beveled Outer Shell (1.68 x 1.32)
  const outerShape = makeRoundedRectShape(1.68, 1.32, 0.07);
  const outerShellGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
    curveSegments: 4,
  });
  outerShellGeo.translate(0, 0, -0.1);
  const outerShellMesh = new THREE.Mesh(outerShellGeo, beigeMat);
  outerShellMesh.castShadow = true;
  outerShellMesh.receiveShadow = true;
  monitorGroup.add(outerShellMesh);

  // Tapered Rear CRT Housing
  const rearGeo = new THREE.CylinderGeometry(0.62, 0.42, 0.62, 4, 1);
  rearGeo.rotateY(Math.PI / 4);
  rearGeo.rotateX(Math.PI / 2);
  rearGeo.scale(1.26, 0.98, 1.0);
  const rearMesh = new THREE.Mesh(rearGeo, beigeMat);
  rearMesh.position.set(0, 0.02, -0.42);
  rearMesh.castShadow = true;
  monitorGroup.add(rearMesh);

  // Recessed Charcoal Front Bezel with Aperture Hole (1.30 x 0.96)
  const bezelShape = makeRoundedRectShape(1.48, 1.12, 0.045);
  const holePath = makeRoundedRectShape(1.30, 0.96, 0.03);
  bezelShape.holes.push(holePath);
  const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 3,
  });
  bezelGeo.translate(0, 0.02, 0.148);
  const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
  bezelMesh.receiveShadow = true;
  monitorGroup.add(bezelMesh);

  // Curved CRT Glass Mesh inside Aperture (20x16 parabolic bulge)
  const glassW = 1.32;
  const glassH = 0.98;
  const glassGeo = new THREE.PlaneGeometry(glassW, glassH, 18, 14);
  const posAttr = glassGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const gx = posAttr.getX(i) / (glassW / 2);
    const gy = posAttr.getY(i) / (glassH / 2);
    const bulge = 0.024 * Math.max(0, 1 - gx * gx) * Math.max(0, 1 - gy * gy);
    posAttr.setZ(i, bulge);
  }
  glassGeo.computeVertexNormals();
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x051015,
    emissive: new THREE.Color(0x0d2612),
    emissiveIntensity: 0.35,
    roughness: 0.18,
    metalness: 0.14,
  });
  const glassMesh = new THREE.Mesh(glassGeo, glassMat);
  glassMesh.position.set(0, 0.02, 0.155);
  monitorGroup.add(glassMesh);

  // Top Ventilation Slots (10 instanced slats -> 1 draw call)
  const ventGeo = new THREE.BoxGeometry(0.035, 0.02, 0.36);
  const ventInst = new THREE.InstancedMesh(ventGeo, darkSlotMat, 10);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < 10; i++) {
    dummy.position.set(-0.42 + i * 0.092, 0.655, -0.08);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    ventInst.setMatrixAt(i, dummy.matrix);
  }
  ventInst.instanceMatrix.needsUpdate = true;
  monitorGroup.add(ventInst);

  // Lower-Right Power Button & Status LED
  const pwrBtnMesh = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.045, 0.035), bezelMat);
  pwrBtnMesh.position.set(0.64, -0.585, 0.195);
  monitorGroup.add(pwrBtnMesh);

  const ledMat = new THREE.MeshBasicMaterial({ color: 0x6b7c3e });
  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 8), ledMat);
  ledMesh.position.set(0.55, -0.585, 0.205);
  monitorGroup.add(ledMesh);

  // Aperture Corner Markers (projected each frame to align flat 2D DOM screen)
  const apW = 1.25;
  const apH = 0.91;
  const apCenterY = 0.02;
  const apZ = 0.168;
  const cornerTL = new THREE.Object3D();
  const cornerBR = new THREE.Object3D();
  cornerTL.position.set(-apW / 2, apCenterY + apH / 2, apZ);
  cornerBR.position.set(apW / 2, apCenterY - apH / 2, apZ);
  monitorGroup.add(cornerTL);
  monitorGroup.add(cornerBR);

  // ---- Simplified Two-Tone Retro Keyboard (48 instanced keycaps = 1 draw call) ----
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(0, 0.035, 0.74);
  keyboardGroup.rotation.x = 0.085;
  workstationGroup.add(keyboardGroup);

  const kbBaseMesh = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.055, 0.52), beigeMat);
  kbBaseMesh.castShadow = true;
  kbBaseMesh.receiveShadow = true;
  keyboardGroup.add(kbBaseMesh);

  const keyGeo = new THREE.BoxGeometry(0.088, 0.028, 0.086);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.04 });
  const keysInst = new THREE.InstancedMesh(keyGeo, keyMat, 48);
  keysInst.castShadow = true;
  keysInst.receiveShadow = true;

  const alphaCol = new THREE.Color(0xcfc7b6);
  const modCol = new THREE.Color(0x7c7466);
  let kIdx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 12; col++) {
      dummy.position.set(-0.59 + col * 0.107, 0.04, -0.155 + row * 0.104);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      keysInst.setMatrixAt(kIdx, dummy.matrix);
      const isModifier = col === 0 || col === 11 || (row === 3 && (col === 1 || col === 10));
      keysInst.setColorAt(kIdx, isModifier ? modCol : alphaCol);
      kIdx++;
    }
  }
  keysInst.instanceMatrix.needsUpdate = true;
  if (keysInst.instanceColor) keysInst.instanceColor.needsUpdate = true;
  keyboardGroup.add(keysInst);

  // ---- 50 Dust Particles inside key-light cone (HIGH tier only) ----
  const dustCount = 50;
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = [];
  for (let i = 0; i < dustCount; i++) {
    const px = ((i * 73) % 240) / 100 - 1.2;
    const py = 0.25 + ((i * 31) % 160) / 100;
    const pz = ((i * 53) % 180) / 100 - 0.8;
    dustPos[i * 3] = px;
    dustPos[i * 3 + 1] = py;
    dustPos[i * 3 + 2] = pz;
    dustSeed.push({ bx: px, by: py, speed: 0.35 + (i % 5) * 0.12, phase: i * 0.7 });
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));

  const dustCanvas = document.createElement('canvas');
  dustCanvas.width = 16;
  dustCanvas.height = 16;
  const dCtx = dustCanvas.getContext('2d');
  const grad = dCtx.createRadialGradient(8, 8, 1, 8, 8, 8);
  grad.addColorStop(0, 'rgba(232, 228, 216, 0.85)');
  grad.addColorStop(1, 'rgba(232, 228, 216, 0)');
  dCtx.fillStyle = grad;
  dCtx.fillRect(0, 0, 16, 16);
  const dustTex = new THREE.CanvasTexture(dustCanvas);

  const dustMat = new THREE.PointsMaterial({
    size: 0.022,
    map: dustTex,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const dustPoints = new THREE.Points(dustGeo, dustMat);
  rootGroup.add(dustPoints);

  // ---- Runtime State, Adaptive Quality, Parallax & Projection ----
  let quality = initialQuality;
  let isReduced = Boolean(reducedMotion);
  let isCoarse = Boolean(coarsePointer);
  let isHidden = Boolean(document.hidden);
  let contextLost = false;
  let rafId = null;
  let lastFrameMs = performance.now();
  let lastActiveMs = performance.now();
  let idleThrottleAccum = 0;

  let pointerNdcX = 0;
  let pointerNdcY = 0;
  let curYaw = 0;
  let curPitch = 0;

  // Performance instrumentation
  const metrics = {
    fps: 0,
    avgFrameMs: 0,
    maxFrameMs: 0,
    drawCalls: 0,
    triangles: 0,
    dpr: 1,
    pixelTickMs: 0,
    pixelUploadsPerSec: 0,
    loopState: 'running',
  };
  let fpsCount = 0;
  let fpsWindowStart = performance.now();
  let frameTimeSamples = [];
  let slowFrameSamples = [];
  let uploadTimestamps = [];
  let onAutoDowngrade = null;
  let onMetrics = null;

  function applyQualitySettings(nextQuality) {
    quality = nextQuality;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);

    const dprCap = quality === 'high' ? 1.5 : 1.25;
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    metrics.dpr = +dpr.toFixed(2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    const useShadow = quality === 'high';
    renderer.shadowMap.enabled = useShadow;
    keyLight.castShadow = useShadow;
    dustPoints.visible = quality === 'high' && !isReduced;

    if (quality !== 'high') {
      pixelEnv.renderStatic();
      pixelTexture.needsUpdate = true;
    }

    lastActiveMs = performance.now();
    requestFrameOrLoop();
  }

  function updateScreenProjection() {
    if (!overlayContainer) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const vTL = new THREE.Vector3();
    const vBR = new THREE.Vector3();
    cornerTL.getWorldPosition(vTL).project(camera);
    cornerBR.getWorldPosition(vBR).project(camera);

    const x1 = ((vTL.x + 1) * 0.5) * vw;
    const y1 = ((-vTL.y + 1) * 0.5) * vh;
    const x2 = ((vBR.x + 1) * 0.5) * vw;
    const y2 = ((-vBR.y + 1) * 0.5) * vh;

    const sx = Math.round(Math.min(x1, x2));
    const sy = Math.round(Math.min(y1, y2));
    const sw = Math.max(180, Math.round(Math.abs(x2 - x1)));
    const sh = Math.max(140, Math.round(Math.abs(y2 - y1)));

    overlayContainer.style.setProperty('--screen-x', `${sx}px`);
    overlayContainer.style.setProperty('--screen-y', `${sy}px`);
    overlayContainer.style.setProperty('--screen-w', `${sw}px`);
    overlayContainer.style.setProperty('--screen-h', `${sh}px`);
  }

  function setScreenState(stateName) {
    const hex = STATE_LIGHT_HEX[stateName] || STATE_LIGHT_HEX.menu;
    targetLightColor = new THREE.Color(hex);
    targetLightIntensity = stateName === 'standby' ? 0.22 : 0.42;
    ledMat.color.setHex(stateName === 'standby' ? 0x6b7c3e : 0x39ff14);
    glassMat.emissive.setHex(stateName === 'standby' ? 0x09160c : hex);
    glassMat.emissiveIntensity = stateName === 'standby' ? 0.2 : 0.22;
    lastActiveMs = performance.now();
    requestFrameOrLoop();
  }

  function setPoweredView(isPowered) {
    goalCamPos = (isPowered ? CAM_ACTIVE_POS : CAM_STANDBY_POS).clone();
    goalLookAt = (isPowered ? CAM_ACTIVE_TARGET : CAM_STANDBY_TARGET).clone();
    if (isReduced || quality === 'low') {
      curCamPos.copy(goalCamPos);
      curLookAt.copy(goalLookAt);
      cameraTweening = false;
      renderSingleFrame();
    } else {
      cameraFromPos = curCamPos.clone();
      cameraFromTarget = curLookAt.clone();
      cameraTweenStart = performance.now();
      cameraTweening = true;
      lastActiveMs = performance.now();
      requestFrameOrLoop();
    }
  }

  function renderSingleFrame() {
    if (contextLost || quality === 'low') return;
    const frameStart = performance.now();
    camera.position.copy(curCamPos);
    camera.lookAt(curLookAt);
    workstationGroup.rotation.y = curYaw;
    workstationGroup.rotation.x = curPitch;
    workstationGroup.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    updateScreenProjection();
    renderer.render(scene, camera);

    const frameDur = performance.now() - frameStart;
    metrics.drawCalls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    metrics.avgFrameMs = +frameDur.toFixed(2);
    if (onMetrics) onMetrics(metrics);
  }

  function tick(now) {
    rafId = null;
    if (isHidden || contextLost || quality === 'low') {
      metrics.loopState = isHidden ? 'hidden (0 FPS)' : 'paused (0 FPS)';
      if (onMetrics) onMetrics(metrics);
      return;
    }

    const dt = Math.min(0.1, (now - lastFrameMs) / 1000);
    lastFrameMs = now;

    // Determine whether scene is actively changing or idle
    const isIdle = !cameraTweening && (now - lastActiveMs > 2600) && Math.abs(curYaw - pointerNdcX * 0.0384) < 0.0005 && Math.abs(curPitch - pointerNdcY * 0.0209) < 0.0005;

    if (quality === 'medium' && isIdle) {
      metrics.loopState = 'idle-asleep (0 FPS)';
      metrics.fps = 0;
      if (onMetrics) onMetrics(metrics);
      return;
    }

    if (quality === 'high' && isIdle) {
      idleThrottleAccum += dt;
      if (idleThrottleAccum < 1 / 14) {
        metrics.loopState = 'idle-14fps';
        rafId = requestAnimationFrame(tick);
        return;
      }
      idleThrottleAccum = 0;
      metrics.loopState = 'idle-14fps';
    } else {
      metrics.loopState = 'active';
    }

    const frameWorkStart = performance.now();

    // 1. 750ms entrance dolly interpolation
    if (cameraTweening) {
      const p = Math.min(1, (now - cameraTweenStart) / 750);
      const ease = 1 - Math.pow(1 - p, 3);
      curCamPos.lerpVectors(cameraFromPos, goalCamPos, ease);
      curLookAt.lerpVectors(cameraFromTarget, goalLookAt, ease);
      if (p >= 1) cameraTweening = false;
    }

    // 2. Restrained pointer parallax (±2.2° yaw = 0.0384 rad, ±1.2° pitch = 0.0209 rad)
    const allowParallax = !isReduced && !isCoarse && quality !== 'low';
    const targetYaw = allowParallax ? pointerNdcX * 0.0384 : 0;
    const targetPitch = allowParallax ? pointerNdcY * 0.0209 : 0;
    const damp = Math.min(1, dt * 6);
    curYaw += (targetYaw - curYaw) * damp;
    curPitch += (targetPitch - curPitch) * damp;

    // 3. Smooth state bounce light
    screenBounceLight.color.lerp(targetLightColor, Math.min(1, dt * 8));
    screenBounceLight.intensity += (targetLightIntensity - screenBounceLight.intensity) * Math.min(1, dt * 8);

    // 4. Stepped 320x180 pixel environment (HIGH animated only; capped <= 15 uploads/sec)
    if (quality === 'high' && !isReduced) {
      const updated = pixelEnv.step(dt, true);
      if (updated) {
        pixelTexture.needsUpdate = true;
        uploadTimestamps.push(now);
      }
      // Dust subtle drift
      const posArr = dustGeo.attributes.position.array;
      const tSec = now * 0.00045;
      for (let i = 0; i < dustCount; i++) {
        const sd = dustSeed[i];
        posArr[i * 3] = sd.bx + Math.sin(tSec * sd.speed + sd.phase) * 0.06;
        posArr[i * 3 + 1] = sd.by + Math.cos(tSec * 0.8 * sd.speed + sd.phase) * 0.04;
      }
      dustGeo.attributes.position.needsUpdate = true;
    }

    // 5. Render scene and sync screen aperture projection
    camera.position.copy(curCamPos);
    camera.lookAt(curLookAt);
    workstationGroup.rotation.y = curYaw;
    workstationGroup.rotation.x = curPitch;
    workstationGroup.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);

    updateScreenProjection();
    renderer.render(scene, camera);

    // 6. Telemetry & auto-downgrade monitor (> 24ms avg over 45 active frames)
    const frameDur = performance.now() - frameWorkStart;
    fpsCount++;
    frameTimeSamples.push(frameDur);
    if (frameTimeSamples.length > 60) frameTimeSamples.shift();

    if (!isIdle && quality === 'high') {
      slowFrameSamples.push(frameDur);
      if (slowFrameSamples.length > 45) slowFrameSamples.shift();
      if (slowFrameSamples.length === 45) {
        const slowAvg = slowFrameSamples.reduce((a, b) => a + b, 0) / 45;
        if (slowAvg > 24 && onAutoDowngrade) {
          slowFrameSamples = [];
          onAutoDowngrade('medium', slowAvg);
        }
      }
    }

    uploadTimestamps = uploadTimestamps.filter((ts) => now - ts <= 1000);

    if (now - fpsWindowStart >= 500) {
      metrics.fps = Math.round((fpsCount * 1000) / (now - fpsWindowStart));
      fpsCount = 0;
      fpsWindowStart = now;
    }
    const avg = frameTimeSamples.reduce((a, b) => a + b, 0) / frameTimeSamples.length;
    const max = Math.max(...frameTimeSamples);
    metrics.avgFrameMs = +avg.toFixed(2);
    metrics.maxFrameMs = +max.toFixed(2);
    metrics.drawCalls = renderer.info.render.calls;
    metrics.triangles = renderer.info.render.triangles;
    metrics.pixelTickMs = +pixelEnv.lastTickMs.toFixed(2);
    metrics.pixelUploadsPerSec = uploadTimestamps.length;
    if (onMetrics) onMetrics(metrics);

    rafId = requestAnimationFrame(tick);
  }

  function requestFrameOrLoop() {
    if (isHidden || contextLost || quality === 'low') return;
    if (!rafId) {
      lastFrameMs = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  const onPointerMove = (e) => {
    if (isReduced || isCoarse || quality === 'low') return;
    pointerNdcX = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    pointerNdcY = -((e.clientY / Math.max(1, window.innerHeight)) * 2 - 1);
    lastActiveMs = performance.now();
    requestFrameOrLoop();
  };

  const onResize = () => {
    applyQualitySettings(quality);
    if (quality !== 'low') renderSingleFrame();
  };

  const onVisibility = () => {
    isHidden = Boolean(document.hidden);
    if (isHidden) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      metrics.loopState = 'hidden (0 FPS)';
      metrics.fps = 0;
      if (onMetrics) onMetrics(metrics);
    } else if (quality !== 'low') {
      lastActiveMs = performance.now();
      requestFrameOrLoop();
    }
  };

  const onContextLost = (e) => {
    e.preventDefault();
    contextLost = true;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (onFatalFallback) onFatalFallback('webglcontextlost');
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  canvas.addEventListener('webglcontextlost', onContextLost);

  applyQualitySettings(quality);
  renderSingleFrame();

  return {
    setQuality(nextQ) {
      applyQualitySettings(nextQ);
    },
    setReducedMotion(val) {
      isReduced = Boolean(val);
      dustPoints.visible = quality === 'high' && !isReduced;
      if (isReduced) {
        curYaw = 0;
        curPitch = 0;
        pointerNdcX = 0;
        pointerNdcY = 0;
        pixelEnv.renderStatic();
        pixelTexture.needsUpdate = true;
        renderSingleFrame();
      } else {
        lastActiveMs = performance.now();
        requestFrameOrLoop();
      }
    },
    setCoarsePointer(val) {
      isCoarse = Boolean(val);
    },
    setPoweredView,
    setScreenState,
    setCallbacks({ autoDowngrade, metricsCb }) {
      onAutoDowngrade = autoDowngrade;
      onMetrics = metricsCb;
    },
    getMetrics() {
      return { ...metrics };
    },
    dispose() {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      renderer.dispose();
    },
  };
}
