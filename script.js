// -----------------------------------------------------
// Liquid cursor canvas + theme toggle
// -----------------------------------------------------

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const canvas = document.getElementById("liquidCanvas");
const ctx = canvas.getContext("2d", { alpha: true });

const state = {
  w: 0,
  h: 0,
  dpr: Math.min(window.devicePixelRatio || 1, 2),
  pointer: { x: 0, y: 0 },
  blobs: [],
  lastT: performance.now(),
};

function resize() {
  state.w = window.innerWidth;
  state.h = window.innerHeight;
  state.dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(state.w * state.dpr);
  canvas.height = Math.floor(state.h * state.dpr);
  canvas.style.width = state.w + "px";
  canvas.style.height = state.h + "px";
  ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
}
window.addEventListener("resize", resize, { passive: true });
resize();

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// A simple metaball-ish trail using additive blur
function addBlob(x, y) {
  state.blobs.push({
    x, y,
    vx: (Math.random() - 0.5) * 40,
    vy: (Math.random() - 0.5) * 40,
    r: 24 + Math.random() * 14,
    life: 1.0,
  });
  if (state.blobs.length > 120) state.blobs.shift();
}

function step(t) {
  const dt = clamp((t - state.lastT) / 1000, 0, 0.05);
  state.lastT = t;

  // Clear with subtle fade for trailing
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.fillRect(0, 0, state.w, state.h);

  if (!prefersReducedMotion) {
    // Update blobs
    for (let i = state.blobs.length - 1; i >= 0; i--) {
      const b = state.blobs[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vx *= 0.95;
      b.vy *= 0.95;
      b.life -= dt * 1.2;

      if (b.life <= 0) {
        state.blobs.splice(i, 1);
      }
    }

    // Render blobs (additive + blur)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.filter = "blur(16px)";

    for (const b of state.blobs) {
      const a = clamp(b.life, 0, 1);
      // Gradient matches site accents (no hard-coded colors in CSS; here is ok for canvas effect)
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2.2);
      g.addColorStop(0.0, `rgba(124, 92, 255, ${0.22 * a})`);
      g.addColorStop(0.55, `rgba(51, 214, 255, ${0.16 * a})`);
      g.addColorStop(1.0, `rgba(0, 255, 163, ${0.00})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    ctx.filter = "none";
  }

  requestAnimationFrame(step);
}

function onMove(e) {
  const x = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? state.w / 2;
  const y = e.clientY ?? (e.touches && e.touches[0]?.clientY) ?? state.h / 2;

  state.pointer.x = x;
  state.pointer.y = y;

  if (!prefersReducedMotion) addBlob(x, y);
}

window.addEventListener("mousemove", onMove, { passive: true });
window.addEventListener("touchmove", onMove, { passive: true });


document.getElementById("year").textContent = new Date().getFullYear();

requestAnimationFrame(step);
