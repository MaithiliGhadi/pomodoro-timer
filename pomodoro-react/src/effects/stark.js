/**
 * Stark Industries — Malibu R&D Workspace
 * Interactive Canvas background for the Pomodoro Timer.
 *
 * Features:
 * - Suspended Mark III-inspired armor rig
 * - Pulsing arc-reactor-style energy core
 * - DUM-E-inspired robotic arm tracking the pointer
 * - Holographic diagnostic HUD panels
 * - Server rack LEDs, monitors, workbench and welding equipment
 * - Procedural sparks, dust, shockwaves and parallax
 * - Optional procedural Web Audio effects
 */

export default function createStarkWorkspace(ctx, size, {
  reducedMotion = false,
  enableAudio = false,
  showHoloHUD = true,
  enableDume = true,
} = {}) {
  let audioCtx = null;
  let audioInitialized = false;
  let lastTime = 0;
  let arcPulse = 1;
  let arcShockwaves = [];
  let sparks = [];
  let dustMotes = [];
  let lastSparkTime = 0;
  let sizeState = size || { width: 800, height: 600 };

  const pointer = {
    x: sizeState.width * 0.5,
    y: sizeState.height * 0.45,
    targetX: sizeState.width * 0.5,
    targetY: sizeState.height * 0.45,
    isDown: false,
    hoverSuit: false,
  };

  const dume = {
    baseX: sizeState.width * 0.07,
    baseY: sizeState.height * 0.62,
    joint1Angle: -0.85,
    clawPinch: 0.25,
    targetX: 0,
    targetY: 0,
  };

  const serverLeds = Array.from({ length: 42 }, () => ({
    color: Math.random() > 0.4 ? '#00e5ff' : Math.random() > 0.3 ? '#00ff88' : '#ff9900',
    phase: Math.random() * Math.PI * 2,
    blinkRate: 0.002 + Math.random() * 0.008,
  }));

  function initAudio() {
    if (audioInitialized || !enableAudio) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      audioCtx = new AudioContext();
      audioInitialized = true;
    } catch (error) {
      console.warn('Web Audio not available:', error);
    }
  }

  function playArcBurstSound() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();

    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(110, now + 0.35);
    osc2.frequency.setValueAtTime(180, now);
    osc2.frequency.exponentialRampToValueAtTime(45, now + 0.45);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.4);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.46);
    osc2.stop(now + 0.46);
  }

  function playUiBeepSound() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1760, now);
    osc.frequency.setValueAtTime(2640, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  function initDust() {
    dustMotes = Array.from({ length: reducedMotion ? 18 : 35 }, () => ({
      x: Math.random() * sizeState.width,
      y: Math.random() * sizeState.height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.1 - Math.random() * 0.25,
      radius: 0.6 + Math.random() * 1.5,
      alpha: 0.1 + Math.random() * 0.4,
    }));
  }

  function emitSparks(x, y, count = 12, color = '#ffdf80') {
    count = reducedMotion ? Math.min(count, 4) : count;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.8;
      const speed = 1.5 + Math.random() * 5;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        size: 0.8 + Math.random() * 1.6,
        life: 1,
        decay: 0.02 + Math.random() * 0.035,
        color,
      });
    }
    if (sparks.length > 180) sparks.splice(0, sparks.length - 180);
  }

  initDust();

  return {
    resize(s) {
      sizeState = s;
      dume.baseX = s.width * 0.07;
      dume.baseY = s.height * 0.62;
      initDust();
    },

    onPointerMove(x, y) {
      pointer.targetX = x;
      pointer.targetY = y;
    },

    onPointerDown(x, y) {
      initAudio();
      pointer.isDown = true;
      pointer.targetX = x;
      pointer.targetY = y;

      const suitX = sizeState.width * 0.52;
      const suitY = sizeState.height * 0.36;
      const arcX = suitX;
      const arcY = suitY + 24;
      const distToArc = Math.hypot(x - arcX, y - arcY);

      if (distToArc < 85) {
        arcPulse = 3.2;
        arcShockwaves.push({
          x: arcX,
          y: arcY,
          radius: 12,
          maxRadius: Math.max(sizeState.width, sizeState.height) * 0.6,
          speed: reducedMotion ? 5 : 9,
          life: 1,
        });
        emitSparks(arcX, arcY, 28, '#00ffff');
        playArcBurstSound();
      } else {
        arcShockwaves.push({
          x,
          y,
          radius: 6,
          maxRadius: 180,
          speed: reducedMotion ? 3 : 5.5,
          life: 1,
        });
        emitSparks(x, y, 10, '#ffe599');
        playUiBeepSound();
      }

      dume.clawPinch = 0.85;
      window.setTimeout(() => { dume.clawPinch = 0.2; }, 320);
    },

    onPointerUp() {
      pointer.isDown = false;
    },

    update(t = performance.now()) {
      const width = sizeState?.width || 0;
      const height = sizeState?.height || 0;
      if (!ctx || width === 0 || height === 0) return;

      const dt = lastTime ? Math.min((t - lastTime) / 16.667, 2) : 1;
      lastTime = t;

      pointer.x += (pointer.targetX - pointer.x) * 0.08 * dt;
      pointer.y += (pointer.targetY - pointer.y) * 0.08 * dt;

      const px = (pointer.x / width - 0.5) * 26;
      const py = (pointer.y / height - 0.5) * 16;
      const suitX = width * 0.52 + px * 0.5;
      const suitY = height * 0.36 + py * 0.4;
      dume.baseX = width * 0.07 + px * 0.2;
      dume.baseY = height * 0.62 + py * 0.2;
      pointer.hoverSuit = Math.hypot(pointer.x - suitX, pointer.y - suitY) < 140;

      // Environment
      const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
      wallGrad.addColorStop(0, '#060a0f');
      wallGrad.addColorStop(0.55, '#121820');
      wallGrad.addColorStop(0.56, '#181d22');
      wallGrad.addColorStop(1, '#0e1216');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, width, height);

      const floorY = height * 0.56;
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(width, floorY);
      ctx.stroke();

      const lightBanks = [
        { x: width * 0.08, y: height * 0.08, w: 70, h: 60 },
        { x: width * 0.34, y: height * 0.12, w: 55, h: 50 },
        { x: width * 0.52, y: height * 0.06, w: 80, h: 65 },
      ];
      for (const lb of lightBanks) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(255,240,210,0.6)';
        ctx.shadowBlur = 18;
        ctx.fillRect(lb.x + px * 0.1, lb.y, lb.w, lb.h);
        ctx.shadowBlur = 0;
        const coneGrad = ctx.createLinearGradient(lb.x, lb.y, lb.x, height);
        coneGrad.addColorStop(0, 'rgba(255,245,220,0.12)');
        coneGrad.addColorStop(0.65, 'rgba(255,240,200,0.04)');
        coneGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.moveTo(lb.x + px * 0.1, lb.y + lb.h);
        ctx.lineTo(lb.x + lb.w + px * 0.1, lb.y + lb.h);
        ctx.lineTo(lb.x + lb.w * 1.6 + px * 0.1, height);
        ctx.lineTo(lb.x - lb.w * 0.6 + px * 0.1, height);
        ctx.closePath();
        ctx.fillStyle = coneGrad;
        ctx.fill();
      }

      // Server rack
      const rackX = width * 0.74 + px * 0.2;
      const rackY = height * 0.22;
      const rackW = width * 0.24;
      const rackH = height * 0.48;
      ctx.fillStyle = '#080c10';
      ctx.fillRect(rackX, rackY, rackW, rackH);
      ctx.strokeStyle = '#1b232c';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(rackX, rackY, rackW, rackH);
      const bladeH = rackH / 14;
      for (let i = 0; i < 14; i += 1) {
        const by = rackY + i * bladeH;
        ctx.fillStyle = i % 2 === 0 ? '#0f151c' : '#0c1117';
        ctx.fillRect(rackX + 4, by + 1, rackW - 8, bladeH - 2);
        for (let j = 0; j < 3; j += 1) {
          const led = serverLeds[(i * 3 + j) % serverLeds.length];
          const blink = Math.sin(t * led.blinkRate + led.phase) > 0.15;
          ctx.fillStyle = blink ? led.color : '#031015';
          ctx.fillRect(rackX + 12 + j * 16, by + bladeH * 0.35, 6, 4);
        }
      }

      // Workbench and monitors
      const benchX = width * 0.05 + px * 0.25;
      const benchY = height * 0.44;
      ctx.fillStyle = '#1c242e';
      ctx.fillRect(benchX, benchY, 130, 8);
      ctx.fillStyle = '#0f141a';
      ctx.fillRect(benchX + 15, benchY + 8, 8, height * 0.35);
      ctx.fillRect(benchX + 110, benchY + 8, 8, height * 0.35);

      const mon1X = benchX + 5;
      const mon1Y = benchY - 70;
      ctx.fillStyle = '#06131d';
      ctx.fillRect(mon1X, mon1Y, 52, 62);
      ctx.strokeStyle = '#2b3947';
      ctx.lineWidth = 2;
      ctx.strokeRect(mon1X, mon1Y, 52, 62);
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mon1X + 26, mon1Y + 16, 7, 0, Math.PI * 2);
      ctx.moveTo(mon1X + 12, mon1Y + 25);
      ctx.lineTo(mon1X + 40, mon1Y + 25);
      ctx.lineTo(mon1X + 35, mon1Y + 47);
      ctx.lineTo(mon1X + 17, mon1Y + 47);
      ctx.closePath();
      ctx.stroke();

      const mon2X = benchX + 62;
      const mon2Y = benchY - 65;
      ctx.fillStyle = '#061118';
      ctx.fillRect(mon2X, mon2Y, 60, 56);
      ctx.strokeStyle = '#2b3947';
      ctx.strokeRect(mon2X, mon2Y, 60, 56);
      ctx.strokeStyle = '#34d399';
      ctx.beginPath();
      for (let ox = 0; ox < 52; ox += 3) {
        const oy = Math.sin(ox * 0.25 + t * 0.008) * 8 + Math.cos(ox * 0.12 - t * 0.005) * 4;
        if (ox === 0) ctx.moveTo(mon2X + 4 + ox, mon2Y + 28 + oy);
        else ctx.lineTo(mon2X + 4 + ox, mon2Y + 28 + oy);
      }
      ctx.stroke();

      // Suspended armor rig
      const idleSway = Math.sin(t * 0.0018) * 1.5;
      const suitCenterY = suitY + idleSway;
      ctx.strokeStyle = '#55606d';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(suitX - 35, 0);
      ctx.lineTo(suitX - 25, suitCenterY - 60);
      ctx.moveTo(suitX + 35, 0);
      ctx.lineTo(suitX + 25, suitCenterY - 60);
      ctx.stroke();
      ctx.setLineDash([]);

      const cableBundles = [
        { ox: -18, bend: -35, destX: suitX - 70, color: '#161b22', width: 4.5 },
        { ox: -8, bend: -18, destX: suitX - 30, color: '#242d38', width: 3.5 },
        { ox: 0, bend: 15, destX: suitX + 15, color: '#3b4754', width: 5 },
        { ox: 10, bend: 30, destX: suitX + 65, color: '#181e24', width: 3.8 },
        { ox: -4, bend: -6, destX: suitX - 10, color: '#ef4444', width: 1.8 },
        { ox: 6, bend: 8, destX: suitX + 40, color: '#00e5ff', width: 1.8 },
      ];
      for (const cable of cableBundles) {
        ctx.strokeStyle = cable.color;
        ctx.lineWidth = cable.width;
        ctx.beginPath();
        const startX = suitX + cable.ox;
        const startY = suitCenterY + 65;
        const cpX = startX + cable.bend + Math.sin(t * 0.002 + cable.ox) * 4;
        const cpY = (startY + height * 0.95) * 0.5;
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(cpX, cpY, cable.destX, height * 0.95);
        ctx.stroke();
      }

      const chestGrad = ctx.createLinearGradient(suitX - 45, suitCenterY, suitX + 45, suitCenterY + 60);
      chestGrad.addColorStop(0, '#9e1b20');
      chestGrad.addColorStop(0.35, '#c5282f');
      chestGrad.addColorStop(0.7, '#7b1115');
      chestGrad.addColorStop(1, '#4a0a0d');
      const goldGrad = ctx.createLinearGradient(suitX, suitCenterY - 20, suitX, suitCenterY + 40);
      goldGrad.addColorStop(0, '#fcd34d');
      goldGrad.addColorStop(0.5, '#d97706');
      goldGrad.addColorStop(1, '#92400e');

      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.moveTo(suitX - 38, suitCenterY - 20);
      ctx.quadraticCurveTo(suitX, suitCenterY - 26, suitX + 38, suitCenterY - 20);
      ctx.lineTo(suitX + 48, suitCenterY + 12);
      ctx.lineTo(suitX + 28, suitCenterY + 65);
      ctx.lineTo(suitX - 28, suitCenterY + 65);
      ctx.lineTo(suitX - 48, suitCenterY + 12);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,180,180,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.moveTo(suitX - 18, suitCenterY - 22);
      ctx.lineTo(suitX + 18, suitCenterY - 22);
      ctx.lineTo(suitX + 12, suitCenterY - 8);
      ctx.lineTo(suitX - 12, suitCenterY - 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = goldGrad;
      ctx.fillRect(suitX - 68, suitCenterY - 14, 22, 54);
      ctx.fillStyle = chestGrad;
      ctx.fillRect(suitX - 74, suitCenterY + 38, 26, 42);
      ctx.fillStyle = '#a855f7';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 10;
      ctx.fillRect(suitX - 70, suitCenterY + 48, 8, 18);
      ctx.fillStyle = goldGrad;
      ctx.fillRect(suitX + 46, suitCenterY - 14, 22, 54);
      ctx.fillStyle = chestGrad;
      ctx.fillRect(suitX + 48, suitCenterY + 38, 26, 42);
      ctx.fillStyle = '#60a5fa';
      ctx.shadowColor = '#93c5fd';
      ctx.shadowBlur = 10;
      ctx.fillRect(suitX + 58, suitCenterY + 48, 8, 18);
      ctx.shadowBlur = 0;

      const headCenterY = suitCenterY - 48;
      const headTilt = (pointer.x - suitX) * 0.0003;
      ctx.save();
      ctx.translate(suitX, headCenterY);
      ctx.rotate(headTilt);
      ctx.fillStyle = chestGrad;
      ctx.beginPath();
      ctx.ellipse(0, -6, 23, 26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.moveTo(-16, -18);
      ctx.lineTo(16, -18);
      ctx.lineTo(18, 4);
      ctx.lineTo(10, 19);
      ctx.lineTo(-10, 19);
      ctx.lineTo(-18, 4);
      ctx.closePath();
      ctx.fill();
      const eyeGlow = 8 + Math.sin(t * 0.005) * 3;
      ctx.fillStyle = '#f0fdff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = eyeGlow;
      ctx.beginPath();
      ctx.moveTo(-13, -2); ctx.lineTo(-4, -1); ctx.lineTo(-6, 2); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(13, -2); ctx.lineTo(4, -1); ctx.lineTo(6, 2); ctx.lineTo(13, 0); ctx.closePath(); ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;

      // Arc reactor
      const arcX = suitX;
      const arcY = suitCenterY + 24;
      arcPulse += (1 - arcPulse) * 0.06 * dt;
      const baseRadius = 14 * arcPulse;
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(arcX, arcY, baseRadius + 3, 0, Math.PI * 2);
      ctx.stroke();
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 5) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(arcX + Math.cos(a) * (baseRadius + 1) - 1.5, arcY + Math.sin(a) * (baseRadius + 1) - 1.5, 3, 3);
      }
      const arcGrad = ctx.createRadialGradient(arcX, arcY, 1, arcX, arcY, baseRadius * 2.8);
      arcGrad.addColorStop(0, '#ffffff');
      arcGrad.addColorStop(0.25, '#67e8f9');
      arcGrad.addColorStop(0.55, 'rgba(6,182,212,0.7)');
      arcGrad.addColorStop(1, 'rgba(6,182,212,0)');
      ctx.fillStyle = arcGrad;
      ctx.shadowColor = '#22d3ee';
      ctx.shadowBlur = 24 * arcPulse;
      ctx.beginPath();
      ctx.arc(arcX, arcY, baseRadius * 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // DUM-E-inspired robotic arm
      if (enableDume) {
        dume.targetX = pointer.x;
        dume.targetY = pointer.y;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(dume.baseX - 22, dume.baseY, 44, 28);
        ctx.fillStyle = '#eab308';
        ctx.fillRect(dume.baseX - 18, dume.baseY + 18, 36, 4);
        const dx = dume.targetX - dume.baseX;
        const dy = dume.targetY - dume.baseY;
        const targetAngle = Math.atan2(dy, dx);
        dume.joint1Angle += (targetAngle * 0.65 - dume.joint1Angle) * 0.05 * dt;
        const arm1Len = 65;
        const j1X = dume.baseX + Math.cos(dume.joint1Angle) * arm1Len;
        const j1Y = dume.baseY + Math.sin(dume.joint1Angle) * arm1Len;
        const arm2Len = 55;
        const j2Angle = dume.joint1Angle + 0.8;
        const j2X = j1X + Math.cos(j2Angle) * arm2Len;
        const j2Y = j1Y + Math.sin(j2Angle) * arm2Len;
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(dume.baseX, dume.baseY);
        ctx.lineTo(j1X, j1Y);
        ctx.lineTo(j2X, j2Y);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        [
          [dume.baseX, dume.baseY, 7],
          [j1X, j1Y, 6],
          [j2X, j2Y, 5],
        ].forEach(([x, y, r]) => {
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.save();
        ctx.translate(j2X, j2Y);
        ctx.rotate(j2Angle + 0.3);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, -6 * dume.clawPinch); ctx.lineTo(14, -12 * dume.clawPinch); ctx.lineTo(20, -4 * dume.clawPinch); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, 6 * dume.clawPinch); ctx.lineTo(14, 12 * dume.clawPinch); ctx.lineTo(20, 4 * dume.clawPinch); ctx.stroke();
        ctx.restore();
      }

      // Equipment cart
      const cartX = width * 0.72 + px * 0.8;
      const cartY = height * 0.52 + py * 0.6;
      const cartW = width * 0.32;
      const cartH = height * 0.52;
      ctx.fillStyle = '#14181d';
      ctx.fillRect(cartX, cartY, cartW, cartH);
      ctx.strokeStyle = '#2d3748';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cartX, cartY, cartW, cartH);
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(cartX + 10, cartY + cartH * 0.65, 85, 24);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('LINCOLN', cartX + 16, cartY + cartH * 0.65 + 11);
      ctx.fillText('ELECTRIC', cartX + 16, cartY + cartH * 0.65 + 20);
      const dials = [
        { x: cartX + 45, y: cartY + 55, r: 16, val: 0.75 },
        { x: cartX + 115, y: cartY + 55, r: 20, val: 0.42 },
      ];
      for (const dial of dials) {
        ctx.fillStyle = '#0a0d11';
        ctx.beginPath(); ctx.arc(dial.x, dial.y, dial.r, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();
        const needleAngle = -Math.PI * 0.75 + dial.val * Math.PI * 1.5;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(dial.x, dial.y); ctx.lineTo(dial.x + Math.cos(needleAngle) * (dial.r - 3), dial.y + Math.sin(needleAngle) * (dial.r - 3)); ctx.stroke();
      }

      if (!reducedMotion && t - lastSparkTime > 1400 && Math.random() < 0.25) {
        emitSparks(cartX + 40, cartY + 110, 16, '#ffd166');
        lastSparkTime = t;
      }

      // HUD
      if (showHoloHUD) {
        ctx.save();
        const hud1X = suitX - 180 + px * 0.4;
        const hud1Y = suitCenterY - 110 + py * 0.3;
        ctx.fillStyle = 'rgba(0,240,255,0.05)';
        ctx.strokeStyle = 'rgba(0,240,255,0.6)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(hud1X, hud1Y, 130, 85);
        ctx.fillRect(hud1X, hud1Y, 130, 85);
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 8px monospace';
        ctx.fillText('JARVIS // MARK III', hud1X + 8, hud1Y + 14);
        ctx.fillText('PWR: 98.6% NOMINAL', hud1X + 8, hud1Y + 26);
        ctx.fillText('CORE FLUX: 3.2 GJ/s', hud1X + 8, hud1Y + 38);
        ctx.fillStyle = 'rgba(0,240,255,0.2)';
        ctx.fillRect(hud1X + 8, hud1Y + 46, 114, 5);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(hud1X + 8, hud1Y + 46, 92 + Math.sin(t * 0.003) * 12, 5);
        const scanY = hud1Y + ((t * 0.04) % 85);
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath(); ctx.moveTo(hud1X, scanY); ctx.lineTo(hud1X + 130, scanY); ctx.stroke();

        const hud2X = suitX + 70 + px * 0.4;
        const hud2Y = suitCenterY - 95 + py * 0.3;
        ctx.fillStyle = 'rgba(0,240,255,0.05)';
        ctx.strokeStyle = 'rgba(0,240,255,0.5)';
        ctx.strokeRect(hud2X, hud2Y, 110, 75);
        ctx.fillRect(hud2X, hud2Y, 110, 75);
        ctx.fillStyle = '#00f0ff';
        ctx.font = '7px monospace';
        ctx.fillText('AUDIO SPECTRUM', hud2X + 8, hud2Y + 14);
        for (let b = 0; b < 10; b += 1) {
          const barH = 5 + Math.abs(Math.sin(t * 0.006 + b * 0.7)) * 26;
          ctx.fillStyle = '#00f0ff';
          ctx.fillRect(hud2X + 10 + b * 9, hud2Y + 62 - barH, 6, barH);
        }

        ctx.strokeStyle = pointer.hoverSuit ? '#ef4444' : '#00f0ff';
        ctx.lineWidth = 1.5;
        const trgSize = 14;
        ctx.beginPath();
        ctx.moveTo(pointer.x - trgSize, pointer.y - trgSize * 0.5);
        ctx.lineTo(pointer.x - trgSize, pointer.y - trgSize);
        ctx.lineTo(pointer.x - trgSize * 0.5, pointer.y - trgSize);
        ctx.moveTo(pointer.x + trgSize * 0.5, pointer.y - trgSize);
        ctx.lineTo(pointer.x + trgSize, pointer.y - trgSize);
        ctx.lineTo(pointer.x + trgSize, pointer.y - trgSize * 0.5);
        ctx.moveTo(pointer.x - trgSize, pointer.y + trgSize * 0.5);
        ctx.lineTo(pointer.x - trgSize, pointer.y + trgSize);
        ctx.lineTo(pointer.x - trgSize * 0.5, pointer.y + trgSize);
        ctx.moveTo(pointer.x + trgSize * 0.5, pointer.y + trgSize);
        ctx.lineTo(pointer.x + trgSize, pointer.y + trgSize);
        ctx.lineTo(pointer.x + trgSize, pointer.y + trgSize * 0.5);
        ctx.stroke();
        if (pointer.hoverSuit) {
          ctx.fillStyle = '#ef4444';
          ctx.font = '8px monospace';
          ctx.fillText('TARGET LOCK: MARK III', pointer.x + 18, pointer.y - 8);
        }
        ctx.restore();
      }

      // Shockwaves
      arcShockwaves = arcShockwaves.filter((sw) => sw.life > 0.01 && sw.radius < sw.maxRadius);
      for (const sw of arcShockwaves) {
        sw.radius += sw.speed * dt;
        sw.life -= 0.018 * dt;
        ctx.strokeStyle = `rgba(0,240,255,${Math.max(0, sw.life * 0.8)})`;
        ctx.lineWidth = Math.max(0.5, 2.5 * sw.life);
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.radius, sw.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Sparks
      sparks = sparks.filter((sp) => sp.life > 0.02 && sp.y < height + 20);
      for (const sp of sparks) {
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 0.22 * dt;
        sp.vx *= 0.97;
        sp.life -= sp.decay * dt;
        ctx.fillStyle = sp.color;
        ctx.shadowColor = sp.color;
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Dust
      for (const dm of dustMotes) {
        dm.x += dm.vx * dt;
        dm.y += dm.vy * dt;
        if (dm.y < 0) dm.y = height;
        if (dm.x < 0) dm.x = width;
        if (dm.x > width) dm.x = 0;
        ctx.fillStyle = `rgba(255,245,220,${dm.alpha.toFixed(3)})`;
        ctx.beginPath(); ctx.arc(dm.x, dm.y, dm.radius, 0, Math.PI * 2); ctx.fill();
      }
    },

    destroy() {
      if (audioCtx && audioCtx.state !== 'closed') audioCtx.close().catch(() => {});
      arcShockwaves = [];
      sparks = [];
      dustMotes = [];
    },
  };
}
