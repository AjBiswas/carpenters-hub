const scene = document.getElementById("scene");
const frame = document.querySelector(".frame");
const bgOn = document.querySelector(".bg-on");
const cordVisual = document.getElementById("cordVisual");
const ball = document.getElementById("ball");
const card = document.querySelector(".card");
const hero = document.querySelector(".hero");
const hint = document.getElementById("hint");

// the background photo's native pixel size, and the pull-cord's anchor
// point + resting length measured directly on that photo (in its own
// pixel space) — independent of viewport size or aspect ratio
const IMG_W = 1672;
const IMG_H = 941;
const ANCHOR_X = 531.7;     // where the cord attaches under the shade
const ANCHOR_Y = 281.4;
const REST_LEN = 146.8;     // resting cord length (same whether on or off)
const PULL_DISTANCE = 75.3; // you must pull past REST_LEN by this much to trigger a toggle
const MAX_DRAG = 103.5;     // elastic travel allowed past PULL_DISTANCE
const TAP_THRESHOLD = 6;    // px of on-screen movement below which it counts as a tap

let dragging = false;
let startY = 0;
let maxMoved = 0;

// object-fit:cover crops the photo differently at every window size/ratio —
// these describe exactly how, so any point on the photo can be converted to
// its current on-screen position, recomputed whenever the window resizes.
// object-position is 32% center (not the default 50%) so a tall/narrow
// (mobile) crop stays centered on the lamp instead of the image's raw
// geometric middle — OBJECT_POS_X must match style.css's .bg rule exactly.
const OBJECT_POS_X = 0.32;
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function updateCoverMapping() {
  // measure the actual rendered frame, not window.innerWidth/Height — on
  // mobile the browser's address bar can show/hide independently of the
  // page, and reading raw window dimensions there causes the cord to
  // visibly jump; the frame element (sized via 100dvh in CSS) stays stable
  const rect = frame.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  scale = Math.max(w / IMG_W, h / IMG_H);
  offsetX = (IMG_W * scale - w) * OBJECT_POS_X;
  offsetY = (IMG_H * scale - h) / 2;
}

function imgToScreenX(x) {
  return x * scale - offsetX;
}

function imgToScreenY(y) {
  return y * scale - offsetY;
}

function isOn() {
  return scene.classList.contains("light-on");
}

// the cord always stretches down from the same resting length (REST_LEN),
// whether the light is currently on or off — like a real pull chain,
// you always pull down to toggle, and it always springs back afterwards.
// lengthImgPx is in the photo's own pixel space; this converts it (and the
// anchor point) to on-screen pixels for the current window size.
function setCordLength(lengthImgPx) {
  const leftPx = imgToScreenX(ANCHOR_X);
  const topPx = imgToScreenY(ANCHOR_Y);
  const lengthPx = lengthImgPx * scale;

  cordVisual.style.left = leftPx + "px";
  cordVisual.style.top = topPx + "px";
  cordVisual.style.height = lengthPx + "px";

  ball.style.left = leftPx + "px";
  ball.style.top = topPx + lengthPx + "px";
}

function clearCordLength() {
  updateCoverMapping();
  setCordLength(REST_LEN);
}

function onPointerDown(e) {
  dragging = true;
  maxMoved = 0;
  startY = e.clientY;
  updateCoverMapping();
  cordVisual.classList.add("dragging");
  ball.classList.add("dragging");
  bgOn.style.transition = "none";
  card.style.transition = "none";
  hero.style.transition = "none";
  hint.style.transition = "none";
  ball.setPointerCapture(e.pointerId);
}

function onPointerMove(e) {
  if (!dragging) return;

  const deltaScreenPx = e.clientY - startY;
  maxMoved = Math.max(maxMoved, Math.abs(deltaScreenPx));
  const deltaImg = deltaScreenPx / scale;

  const clamped = Math.max(0, Math.min(PULL_DISTANCE + MAX_DRAG, deltaImg));
  setCordLength(REST_LEN + clamped);

  // how "on" the scene should look right now, live, based on how far the
  // cord has been pulled — the room glow and the login card fade in lock-step
  const progress = Math.min(1, clamped / PULL_DISTANCE);
  const onAmount = isOn() ? 1 - progress : progress;

  bgOn.style.opacity = onAmount;
  card.style.opacity = onAmount;
  hero.style.opacity = 1 - onAmount;
  hint.style.opacity = 1 - onAmount;
}

function onPointerUp(e) {
  if (!dragging) return;
  dragging = false;
  cordVisual.classList.remove("dragging");
  ball.classList.remove("dragging");
  ball.releasePointerCapture(e.pointerId);
  bgOn.style.transition = "";
  card.style.transition = "";
  hero.style.transition = "";
  hint.style.transition = "";

  const deltaImg = (e.clientY - startY) / scale;

  if (maxMoved < TAP_THRESHOLD || deltaImg > PULL_DISTANCE * 0.55) {
    scene.classList.toggle("light-on");
  }

  // land on an explicit 0/1 rather than clearing back to the stylesheet value —
  // clearing an inline style and toggling a class in the same tick can race with
  // the freshly-restored transition and skip straight to the end state (a flash)
  const finalOn = isOn() ? "1" : "0";
  bgOn.style.opacity = finalOn;
  card.style.opacity = finalOn;
  hero.style.opacity = isOn() ? "0" : "1";
  hint.style.opacity = isOn() ? "0" : "1";

  // always spring back to the same resting length, whichever state we end up in
  clearCordLength();
}

ball.addEventListener("pointerdown", onPointerDown);
ball.addEventListener("pointermove", onPointerMove);
ball.addEventListener("pointerup", onPointerUp);
ball.addEventListener("pointercancel", onPointerUp);

// keep the cord locked to the lamp any time the window is resized or the
// display ratio otherwise changes (maximizing, rotating, DevTools, etc.) —
// debounced so a burst of resize events (e.g. a mobile browser's address
// bar animating away) settles once instead of visibly jittering
let resizeTimer = null;
function onViewportChange() {
  if (dragging) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(clearCordLength, 120);
}
window.addEventListener("resize", onViewportChange);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", onViewportChange);
}

// force a clean "off" state with no transition on load, and again if the
// browser restores this page from its back/forward cache (bfcache) — both
// cases can otherwise start from a stale light-on snapshot and visibly
// animate back to off, which reads as a flash
function resetToOffState() {
  scene.classList.remove("light-on");
  bgOn.style.opacity = "";
  card.style.opacity = "";
  hero.style.opacity = "";
  hint.style.opacity = "";
  clearCordLength();

  scene.classList.add("preload");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scene.classList.remove("preload");
    });
  });
}

resetToOffState();
window.addEventListener("pageshow", (e) => {
  if (e.persisted) resetToOffState();
});

// belt-and-braces: stop the browser's native "drag this image" gesture
// from ever starting, no matter where the pointer drag crosses
document.addEventListener("dragstart", (e) => e.preventDefault());

document.getElementById("login").addEventListener("submit", (e) => {
  e.preventDefault();
  window.location.href = "home.html";
});

document.getElementById("signup").addEventListener("submit", (e) => {
  e.preventDefault();
  window.location.href = "home.html";
});

document.querySelector(".forgot").addEventListener("click", (e) => {
  e.preventDefault();
});

// swap between the sign-in and sign-up forms inside the same card
const loginForm = document.getElementById("login");
const signupForm = document.getElementById("signup");
const cardLabel = document.getElementById("cardLabel");
const cardSub = document.getElementById("cardSub");

document.getElementById("showSignup").addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.hidden = true;
  signupForm.hidden = false;
  cardLabel.textContent = "Join Us";
  cardSub.textContent = "Create your workspace account";
});

document.getElementById("showLogin").addEventListener("click", (e) => {
  e.preventDefault();
  signupForm.hidden = true;
  loginForm.hidden = false;
  cardLabel.textContent = "Welcome Back";
  cardSub.textContent = "Sign in to your workspace";
});
