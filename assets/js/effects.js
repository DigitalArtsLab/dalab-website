/* DA Lab - visual effects: custom cursor + hero particle animation */

/* Custom cursor: only active on mouse devices, skipped on touch */
(() => {
    if (!window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;
    document.body.classList.add('has-custom-cursor');

    const cursor = document.getElementById('cursor');
    const follower = document.getElementById('cursor-follower');
    let mouseX = innerWidth / 2, mouseY = innerHeight / 2;
    let followerX = mouseX, followerY = mouseY;

    document.addEventListener('mousemove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        cursor.style.left = mouseX + 'px';
        cursor.style.top = mouseY + 'px';
    });

    document.addEventListener('mouseover', e => {
        const hovering = !!e.target.closest('.interactive');
        cursor.classList.toggle('cursor-hover', hovering);
        follower.classList.toggle('cursor-hover', hovering);
    });

    (function animate() {
        followerX += (mouseX - followerX) * 0.15;
        followerY += (mouseY - followerY) * 0.15;
        follower.style.left = followerX + 'px';
        follower.style.top = followerY + 'px';
        requestAnimationFrame(animate);
    })();
})();

/* Background particle phase-transition animation */
(() => {
    'use strict';
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const WAVE_SPEED = 0.5;
    const PARTICLE_DENSITY = 1.0;

    let width, height, dpr, cx, cy;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cx = width / 2;
        cy = height / 2;
    }
    let needsResize = false;
    window.addEventListener('resize', () => { needsResize = true; });
    resize();

    // --- Noise ---
    const perm = new Uint8Array(512);
    const grad2 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    {
        const p = new Uint8Array(256);
        for (let i = 0; i < 256; i++) p[i] = i;
        for (let i = 255; i > 0; i--) {
            const j = (Math.random() * (i + 1)) | 0;
            [p[i], p[j]] = [p[j], p[i]];
        }
        for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
    }
    function noise2d(x, y) {
        const ix = Math.floor(x) & 255, iy = Math.floor(y) & 255;
        const fx = x - Math.floor(x), fy = y - Math.floor(y);
        const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
        const g00 = grad2[perm[ix + perm[iy]] & 7];
        const g10 = grad2[perm[ix + 1 + perm[iy]] & 7];
        const g01 = grad2[perm[ix + perm[iy + 1]] & 7];
        const g11 = grad2[perm[ix + 1 + perm[iy + 1]] & 7];
        const d00 = g00[0] * fx + g00[1] * fy;
        const d10 = g10[0] * (fx - 1) + g10[1] * fy;
        const d01 = g01[0] * fx + g01[1] * (fy - 1);
        const d11 = g11[0] * (fx - 1) + g11[1] * (fy - 1);
        const nx0 = d00 + ux * (d10 - d00);
        const nx1 = d01 + ux * (d11 - d01);
        return nx0 + uy * (nx1 - nx0);
    }
    function fbm(x, y, octaves) {
        let val = 0, amp = 0.5, freq = 1;
        for (let i = 0; i < octaves; i++) {
            val += amp * noise2d(x * freq, y * freq);
            amp *= 0.5; freq *= 2;
        }
        return val;
    }
    function smoothstep(edge0, edge1, x) {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    // --- Particles ---
    let COUNT = 0;
    let posX, posY, velX, velY, homeX, homeY;
    let latticeCol, latticeRow, phaseArr, energyArr;
    let cols, rows, spacingX, spacingY;

    function initParticles() {
        const area = Math.max(1, width) * Math.max(1, height);
        let count = Math.round(2500 * PARTICLE_DENSITY * Math.sqrt(area / (1920 * 1080)));
        count = Math.max(400, Math.min(count, 5000));
        const aspect = Math.max(1, width) / Math.max(1, height);
        rows = Math.round(Math.sqrt(count / aspect));
        cols = Math.round(rows * aspect);
        COUNT = rows * cols;
        spacingX = Math.max(1, width) / (cols + 1);
        spacingY = Math.max(1, height) / (rows + 1);
        posX = new Float32Array(COUNT); posY = new Float32Array(COUNT);
        velX = new Float32Array(COUNT); velY = new Float32Array(COUNT);
        homeX = new Float32Array(COUNT); homeY = new Float32Array(COUNT);
        latticeCol = new Int32Array(COUNT); latticeRow = new Int32Array(COUNT);
        phaseArr = new Float32Array(COUNT); energyArr = new Float32Array(COUNT);
        let idx = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const hx = (c + 1) * spacingX, hy = (r + 1) * spacingY;
                homeX[idx] = hx; homeY[idx] = hy;
                posX[idx] = hx + (Math.random() - 0.5) * spacingX * 0.3;
                posY[idx] = hy + (Math.random() - 0.5) * spacingY * 0.3;
                latticeCol[idx] = c; latticeRow[idx] = r;
                idx++;
            }
        }
    }
    initParticles();

    // --- Trail canvas ---
    const trailCanvas = document.createElement('canvas');
    const trailCtx = trailCanvas.getContext('2d');
    function resizeTrail() {
        trailCanvas.width = canvas.width;
        trailCanvas.height = canvas.height;
        trailCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        trailCtx.clearRect(0, 0, width, height);
    }
    resizeTrail();

    // --- Glow sprites & colors ---
    const GLOW_RES = 64;
    function makeGlowSprite(r, g, b) {
        const c = document.createElement('canvas');
        c.width = GLOW_RES * 2; c.height = GLOW_RES * 2;
        const gc = c.getContext('2d');
        const grad = gc.createRadialGradient(GLOW_RES, GLOW_RES, 0, GLOW_RES, GLOW_RES, GLOW_RES);
        grad.addColorStop(0, `rgba(${r},${g},${b}, 0.6)`);
        grad.addColorStop(0.3, `rgba(${r},${g},${b}, 0.2)`);
        grad.addColorStop(0.7, `rgba(${r},${g},${b}, 0.04)`);
        grad.addColorStop(1, `rgba(${r},${g},${b}, 0)`);
        gc.fillStyle = grad;
        gc.beginPath();
        gc.arc(GLOW_RES, GLOW_RES, GLOW_RES, 0, Math.PI * 2);
        gc.fill();
        return c;
    }
    const ORD_R = 255, ORD_G = 255, ORD_B = 255;
    const ORD_HI_R = 230, ORD_HI_G = 245, ORD_HI_B = 255;
    const CHA_R = 200, CHA_G = 230, CHA_B = 240;
    const CHA_HI_R = 255, CHA_HI_G = 255, CHA_HI_B = 255;
    const WAVE_R = 0, WAVE_G = 175, WAVE_B = 177; // #00afb1
    const glowOrdered = makeGlowSprite(ORD_R, ORD_G, ORD_B);
    const glowChaotic = makeGlowSprite(CHA_R, CHA_G, CHA_B);
    const glowWave = makeGlowSprite(WAVE_R, WAVE_G, WAVE_B);

    function lerpColor(r1, g1, b1, r2, g2, b2, t) {
        return [r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t];
    }

    // --- Simulation ---
    const SPRING_K = 4.0, DAMPING = 3.5, TURBULENCE_SCALE = 0.003, TURBULENCE_STRENGTH = 120;
    let wavePos = 0, waveDir = 1, wavePhase = 0, waveCycleTime = 0;
    let mouseActive = false, mouseWavePos = 0.5;
    let paused = false, lastTime = 0;

    function update(dt, time) {
        const cycleDuration = (width * 1.4) / (WAVE_SPEED * 180);
        waveCycleTime += dt;
        const rawProgress = waveCycleTime / cycleDuration;
        const cycleIndex = Math.floor(rawProgress);
        const withinCycle = rawProgress - cycleIndex;
        const eased = withinCycle * withinCycle * (3 - 2 * withinCycle);
        if (cycleIndex % 2 === 0) { wavePos = eased; waveDir = 1; }
        else { wavePos = 1 - eased; waveDir = -1; }
        wavePhase = cycleIndex % 4 < 2 ? 0 : 1;
        if (mouseActive) wavePos = mouseWavePos;

        const wavePx = wavePos * width, transWidth = width * 0.12, noiseT = time * 0.4;
        for (let i = 0; i < COUNT; i++) {
            const px = posX[i], py = posY[i];
            const distToWave = (px - wavePx) * waveDir;
            const phase = (wavePhase === 0)
                ? 1 - smoothstep(-transWidth, transWidth, distToWave)
                : smoothstep(-transWidth, transWidth, distToWave);
            let transEnergy = Math.max(0, 1 - Math.abs(distToWave) / transWidth);
            transEnergy *= transEnergy;

            const dx = homeX[i] - px, dy = homeY[i] - py;
            const orderedFx = dx * SPRING_K - velX[i] * DAMPING;
            const orderedFy = dy * SPRING_K - velY[i] * DAMPING;

            const nx = px * TURBULENCE_SCALE, ny = py * TURBULENCE_SCALE;
            const angle = fbm(nx + noiseT, ny + noiseT * 0.7, 3) * Math.PI * 4;
            let turbFx = Math.cos(angle) * TURBULENCE_STRENGTH;
            let turbFy = Math.sin(angle) * TURBULENCE_STRENGTH;
            const swirlAngle = Math.atan2(py - cy, px - cx);
            const swirlDist = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy));
            const swirlStrength = 30 * Math.min(1, swirlDist / (width * 0.3));
            turbFx += Math.cos(swirlAngle + Math.PI * 0.5) * swirlStrength;
            turbFy += Math.sin(swirlAngle + Math.PI * 0.5) * swirlStrength;
            const chaoticFx = turbFx - velX[i] * 1.2, chaoticFy = turbFy - velY[i] * 1.2;

            let kickFx = 0, kickFy = 0;
            if (transEnergy > 0.01) {
                const kickAngle = fbm(nx * 2 + noiseT * 1.5, ny * 2 + 100, 2) * Math.PI * 2;
                const kickStrength = transEnergy * 200;
                kickFx = Math.cos(kickAngle) * kickStrength;
                kickFy = Math.sin(kickAngle) * kickStrength;
            }

            velX[i] += (orderedFx * (1 - phase) + chaoticFx * phase + kickFx) * dt;
            velY[i] += (orderedFy * (1 - phase) + chaoticFy * phase + kickFy) * dt;
            const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]), maxSpeed = 300;
            if (speed > maxSpeed) { velX[i] = velX[i] / speed * maxSpeed; velY[i] = velY[i] / speed * maxSpeed; }
            posX[i] += velX[i] * dt;
            posY[i] += velY[i] * dt;

            const margin = 20;
            if (posX[i] < -margin) { posX[i] = -margin; velX[i] = Math.abs(velX[i]) * 0.5; }
            if (posX[i] > width + margin) { posX[i] = width + margin; velX[i] = -Math.abs(velX[i]) * 0.5; }
            if (posY[i] < -margin) { posY[i] = -margin; velY[i] = Math.abs(velY[i]) * 0.5; }
            if (posY[i] > height + margin) { posY[i] = height + margin; velY[i] = -Math.abs(velY[i]) * 0.5; }
        }
    }

    function render(timestamp) {
        if (paused) { requestAnimationFrame(render); return; }
        if (needsResize) { needsResize = false; resize(); initParticles(); resizeTrail(); }
        if (!lastTime) lastTime = timestamp;
        let dt = Math.min((timestamp - lastTime) / 1000, 0.033);
        lastTime = timestamp;
        if (prefersReduced) dt *= 0.15;
        const time = timestamp / 1000;
        update(dt, time);

        const wavePx = wavePos * width, transWidth = width * 0.12;

        // Phase/energy computed once per particle per frame.
        for (let i = 0; i < COUNT; i++) {
            const distToWave = (posX[i] - wavePx) * waveDir;
            phaseArr[i] = (wavePhase === 0)
                ? 1 - smoothstep(-transWidth, transWidth, distToWave)
                : smoothstep(-transWidth, transWidth, distToWave);
            const te = Math.max(0, 1 - Math.abs(distToWave) / transWidth);
            energyArr[i] = te * te;
        }

        // Fade previous trails without killing the gradient background.
        trailCtx.globalCompositeOperation = 'destination-out';
        trailCtx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        trailCtx.fillRect(0, 0, width, height);
        trailCtx.globalCompositeOperation = 'source-over';

        // Lattice connection lines (ordered side of the wave).
        trailCtx.lineWidth = 0.5;
        for (let i = 0; i < COUNT; i++) {
            const phase = phaseArr[i];
            if (phase > 0.5) continue;
            const lineAlpha = (1 - phase * 2) * 0.15;
            if (lineAlpha < 0.005) continue;
            if (latticeCol[i] < cols - 1) {
                const j = i + 1;
                const dx = posX[j] - posX[i], dy = posY[j] - posY[i];
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < spacingX * 2) {
                    const alpha = lineAlpha * (1 - dist / (spacingX * 2));
                    trailCtx.strokeStyle = `rgba(${ORD_R},${ORD_G},${ORD_B},${alpha.toFixed(3)})`;
                    trailCtx.beginPath();
                    trailCtx.moveTo(posX[i], posY[i]);
                    trailCtx.lineTo(posX[j], posY[j]);
                    trailCtx.stroke();
                }
            }
            if (latticeRow[i] < rows - 1) {
                const j = i + cols;
                const dx = posX[j] - posX[i], dy = posY[j] - posY[i];
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < spacingY * 2) {
                    const alpha = lineAlpha * (1 - dist / (spacingY * 2));
                    trailCtx.strokeStyle = `rgba(${ORD_R},${ORD_G},${ORD_B},${alpha.toFixed(3)})`;
                    trailCtx.beginPath();
                    trailCtx.moveTo(posX[i], posY[i]);
                    trailCtx.lineTo(posX[j], posY[j]);
                    trailCtx.stroke();
                }
            }
        }

        // Wavefront line.
        if (!prefersReduced) {
            trailCtx.strokeStyle = `rgba(${WAVE_R},${WAVE_G},${WAVE_B},0.8)`;
            trailCtx.lineWidth = 1.5;
            trailCtx.beginPath();
            for (let y = 0; y < height; y += 8) {
                const wobble = fbm(y * 0.01 + time * 0.5, time * 0.3, 2) * 15;
                if (y === 0) trailCtx.moveTo(wavePx + wobble, y);
                else trailCtx.lineTo(wavePx + wobble, y);
            }
            trailCtx.stroke();
        }

        // Motion trails (chaotic side of the wave).
        for (let i = 0; i < COUNT; i++) {
            const phase = phaseArr[i];
            if (phase <= 0.3) continue;
            const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]);
            const trailAlpha = phase * Math.min(1, speed / 100) * 0.25;
            if (trailAlpha <= 0.005) continue;
            const col = lerpColor(ORD_R, ORD_G, ORD_B, CHA_R, CHA_G, CHA_B, phase);
            trailCtx.fillStyle = `rgba(${Math.round(col[0])},${Math.round(col[1])},${Math.round(col[2])},${trailAlpha.toFixed(3)})`;
            trailCtx.beginPath();
            trailCtx.arc(posX[i], posY[i], 1.5, 0, Math.PI * 2);
            trailCtx.fill();
        }

        // Clear main canvas so the gradient background shines through.
        ctx.clearRect(0, 0, width, height);
        if (trailCanvas.width > 0 && trailCanvas.height > 0) {
            ctx.drawImage(trailCanvas, 0, 0, trailCanvas.width, trailCanvas.height, 0, 0, width, height);
        }

        // Particles.
        for (let i = 0; i < COUNT; i++) {
            const px = posX[i], py = posY[i];
            const phase = phaseArr[i], transEnergy = energyArr[i];
            const size = 1.5 + phase * 0.8 + transEnergy * 2.5;
            const speed = Math.sqrt(velX[i] * velX[i] + velY[i] * velY[i]);
            const energyBright = Math.min(1, speed / 150);

            let r, g, b;
            if (transEnergy > 0.1) {
                const t = transEnergy;
                r = WAVE_R + (255 - WAVE_R) * t * 0.5;
                g = WAVE_G + (255 - WAVE_G) * t * 0.5;
                b = WAVE_B + (255 - WAVE_B) * t * 0.3;
            } else if (phase < 0.5) {
                const dx = px - homeX[i], dy = py - homeY[i];
                const settled = 1 - Math.min(1, Math.sqrt(dx * dx + dy * dy) / spacingX);
                r = ORD_R + (ORD_HI_R - ORD_R) * settled;
                g = ORD_G + (ORD_HI_G - ORD_G) * settled;
                b = ORD_B + (ORD_HI_B - ORD_B) * settled;
            } else {
                r = CHA_R + (CHA_HI_R - CHA_R) * energyBright;
                g = CHA_G + (CHA_HI_G - CHA_G) * energyBright;
                b = CHA_B + (CHA_HI_B - CHA_B) * energyBright;
            }

            const alpha = Math.min(1, 0.8 + transEnergy * 0.2 + energyBright * 0.15);
            if (transEnergy > 0.05 || (phase > 0.5 && speed > 50)) {
                const glowSize = size * 3;
                const glowAlpha = (transEnergy * 0.4 + energyBright * 0.1) * alpha;
                if (glowAlpha > 0.005) {
                    const sprite = transEnergy > 0.1 ? glowWave : (phase < 0.5 ? glowOrdered : glowChaotic);
                    ctx.globalAlpha = Math.min(glowAlpha, 0.8);
                    ctx.drawImage(sprite, px - glowSize, py - glowSize, glowSize * 2, glowSize * 2);
                    ctx.globalAlpha = 1;
                }
            }
            ctx.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    canvas.addEventListener('mousemove', e => { mouseActive = true; mouseWavePos = e.clientX / width; });
    canvas.addEventListener('mouseleave', () => { mouseActive = false; });
    canvas.addEventListener('mousedown', () => {
        if (!document.body.classList.contains('modal-open')) wavePhase = 1 - wavePhase;
    });
    document.addEventListener('visibilitychange', () => {
        paused = document.hidden;
        if (!paused) lastTime = 0;
    });
})();
