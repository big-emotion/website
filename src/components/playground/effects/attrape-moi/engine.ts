// The Attrape-moi engine: the B2B espace's home toy (b2b-space, BrandMotionStage.tsx —
// same owner) rebuilt on the Playground's PG-21 lifecycle. Three deliberate departures
// from the original: a single render loop drives both the scene and the ball (the
// original ran two RAFs; the house engines own one setAnimationLoop), the logo wobble
// replays on every fly-by with a cooldown instead of exactly once (a playground toy is
// replayed, a login page is crossed once), and zoom is a plain camera dolly that only
// frames the logo — the ball lives in stage pixels, outside the camera.

import * as THREE from "three";
import { CAMERA } from "@/components/scene/states";
import {
  buildStudioEnvironment,
  loadStudioRig,
  tintStudioRig,
} from "@/components/scene/studio-rig";
import { scrubFraming, stepFraming } from "@/components/playground/camera-framing";
import { unlockChallenge } from "@/components/playground/challenges";
import { reportInteraction } from "@/components/playground/report-interaction";
import type { ZoomDirection } from "@/components/playground/zoom-controls";
import { advanceElasticBall, type ElasticBall } from "./elastic-motion";

export type QualityTier = "high" | "low";

export type AttrapeMoiEngineOptions = {
  /** Registered id passed to `reportInteraction` (defaults to "attrape-moi"). */
  effectId?: string;
};

export type AttrapeMoiEngine = {
  /** `ball` is the DOM ball the component renders; the engine only moves it. */
  mount: (stage: HTMLElement, ball: HTMLElement) => void;
  reset: () => void;
  /** One press of the on-screen zoom control — a plain dolly on the logo's camera. */
  zoom: (direction: ZoomDirection) => void;
  /** Stage-theme tint for the chrome; the backdrop and ball stay DOM concerns. */
  setLogoColor: (hex: string) => void;
  setQualityTier: (tier: QualityTier) => void;
  dispose: () => void;
};

/** Spawn state straight from the original toy: off-centre, drifting up and right. */
const BALL_SPAWN: ElasticBall = { x: 0.18, y: 0.68, vx: 0.061, vy: -0.043 };
const BALL_RADIUS = 0.045;

// Where a passing ball reads as brushing the wordmark, in the same normalized space.
// The original scripted a zone in front of its off-centre logo; ours is centred
// because the studio rig is, and wider than tall because the wordmark is.
const LOGO_ZONE_HALF_WIDTH = 0.18;
const LOGO_ZONE_HALF_HEIGHT = 0.12;
/** The wobble's full life — also the cooldown between two fly-by kicks. */
const WOBBLE_DURATION_SECONDS = 0.72;

const DRAG_SENSITIVITY = 0.006; // radians per pixel of pointer travel
const KEYBOARD_ROTATION_STEP = 0.12;
/** Per-second decay base of the drag inertia (the original's Math.pow(0.055, dt)). */
const INERTIA_DECAY = 0.055;

/** Same stall cap as the other engines: a backgrounded tab must not teleport the ball. */
const MAX_FRAME_SECONDS = 0.05;

// Camera travel of the on-screen zoom. A plain clamped dolly is enough this far out —
// no body floor / FOV handoff like poids-lourd, the camera never nears the logo.
const DOLLY_DEFAULT = 3;
const DOLLY_MIN = 1.2;
const DOLLY_MAX = 6;
// A trackpad pinch arrives as a wheel event with deltas an order of magnitude
// smaller than a wheel notch — same value as the sibling engines.
const PINCH_SENSITIVITY = 0.0076;

export function createAttrapeMoiEngine(options: AttrapeMoiEngineOptions = {}): AttrapeMoiEngine {
  const effectId = options.effectId ?? "attrape-moi";

  let renderer: THREE.WebGLRenderer | null = null;
  let camera: THREE.PerspectiveCamera | null = null;
  let stage: HTMLElement | null = null;
  let ballEl: HTMLElement | null = null;
  // The spin/fit wrapper the engine animates. The rig's own holder keeps its loader
  // transforms (1/maxDim normalization, the -45° export correction) untouched inside
  // it — writing rotation or scale on the holder directly is what blew the logo up
  // to raw GLB size on first ship.
  let logo: THREE.Group | null = null;
  let ballLight: THREE.PointLight | null = null;
  let framing = DOLLY_DEFAULT;

  let stageRect = { width: 1, height: 1, left: 0, top: 0 };
  // The rig ships white (studio-rig.ts): seeding the tint with it makes the default
  // theme a no-op instead of a redundant first traverse.
  let logoHex = "#ffffff";
  let ball: ElasticBall = { ...BALL_SPAWN };
  let heldBall = false;
  // The one pointer a gesture belongs to — everything else on the stage is noise.
  let activePointerId: number | null = null;
  let elapsed = 0;
  let wobbleStartedAt = -Infinity;
  let deflected = false;
  let wasImpact = false;

  // The orientation the visitor drags or keys in, composed with the idle sway below.
  let rotationX = 0;
  let rotationY = 0;
  let spinVelocityX = 0;
  let spinVelocityY = 0;
  let draggingLogo = false;
  let lastPointer = { x: 0, y: 0 };

  const cleanupFns: Array<() => void> = [];

  function refreshStageRect() {
    if (!stage) return;
    const rect = stage.getBoundingClientRect();
    stageRect = {
      width: rect.width || 1,
      height: rect.height || 1,
      left: rect.left,
      top: rect.top,
    };
  }

  function placeBall() {
    if (!ballEl) return;
    const size = ballEl.offsetWidth || 44;
    // Hundredth-of-a-pixel precision: below what a screen can draw, above the float
    // noise the normalized maths would otherwise leak into the style attribute.
    const px = Math.round((ball.x * stageRect.width - size / 2) * 100) / 100;
    const py = Math.round((ball.y * stageRect.height - size / 2) * 100) / 100;
    ballEl.style.transform = `translate3d(${px}px, ${py}px, 0)`;
  }

  function pointerToBallSpace(event: PointerEvent): { x: number; y: number } {
    const clampToWalls = (value: number) => Math.min(1 - BALL_RADIUS, Math.max(BALL_RADIUS, value));
    return {
      x: clampToWalls((event.clientX - stageRect.left) / stageRect.width),
      y: clampToWalls((event.clientY - stageRect.top) / stageRect.height),
    };
  }

  function onBallPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    // A caught ball is not the start of a logo drag.
    event.stopPropagation();
    // The stage's viewport position moves with page scroll without any resize —
    // refresh at every gesture start or the catch lands offset by the scroll delta.
    refreshStageRect();
    activePointerId = event.pointerId;
    heldBall = true;
    ball = { ...ball, ...pointerToBallSpace(event), vx: 0, vy: 0 };
    placeBall();
    reportInteraction(effectId, "grab");
    // Catching the ball IS the hidden challenge — the toy says so itself.
    unlockChallenge(effectId);
  }

  function onBallClick(event: MouseEvent) {
    // Keyboard activation reaches the button as a click with detail 0; real clicks
    // (detail >= 1) were already handled on pointerdown. The keyboard catch stops
    // the ball where it is — carrying stays a pointer gesture.
    if (event.detail !== 0) return;
    ball = { ...ball, vx: 0, vy: 0 };
    reportInteraction(effectId, "grab");
    unlockChallenge(effectId);
  }

  function onStagePointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    refreshStageRect();
    activePointerId = event.pointerId;
    draggingLogo = true;
    lastPointer = { x: event.clientX, y: event.clientY };
  }

  function onPointerMove(event: PointerEvent) {
    // A second touch resting on the stage must not yank the carried ball around.
    if (event.pointerId !== activePointerId) return;
    if (heldBall) {
      ball = { ...ball, ...pointerToBallSpace(event) };
      placeBall();
      return;
    }
    if (!draggingLogo) return;
    const dx = event.clientX - lastPointer.x;
    const dy = event.clientY - lastPointer.y;
    lastPointer = { x: event.clientX, y: event.clientY };
    rotationY += dx * DRAG_SENSITIVITY;
    rotationX += dy * DRAG_SENSITIVITY;
    // The last move's delta is what the release inherits as spin.
    spinVelocityY = dx * DRAG_SENSITIVITY;
    spinVelocityX = dy * DRAG_SENSITIVITY;
  }

  function onPointerUp(event: PointerEvent) {
    if (event.pointerId !== activePointerId) return;
    // A mouse's secondary-button release rides the same pointer id: only the primary
    // button ends a carry — a cancelled gesture always does.
    if (event.type === "pointerup" && event.button !== 0) return;
    activePointerId = null;
    // Released wherever it was carried, from rest — the original's feel: the catch
    // absorbs the ball's energy, only Enter (or a wall's own bounce) relaunches it.
    heldBall = false;
    draggingLogo = false;
  }

  function onWheel(event: WheelEvent) {
    // Same convention as the sibling stages: a bare wheel belongs to the page; a
    // pinch — delivered as a ctrl/meta wheel — dollies, so the hint the zoom
    // controls print stays true here too.
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    framing = Math.min(
      DOLLY_MAX,
      Math.max(DOLLY_MIN, scrubFraming(framing, event.deltaY, PINCH_SENSITIVITY)),
    );
    if (camera) camera.position.z = framing;
  }

  function relaunchBall() {
    const dirX = Math.sign(ball.x - 0.5) || 1;
    const dirY = Math.sign(ball.y - 0.5) || 1;
    ball = {
      ...ball,
      vx: dirX * Math.min(Math.abs(ball.vx) * 1.35 + 0.035, 0.16),
      vy: dirY * Math.min(Math.abs(ball.vy) * 1.3 + 0.025, 0.13),
    };
    reportInteraction(effectId, "throw");
  }

  function onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowLeft":
        rotationY -= KEYBOARD_ROTATION_STEP;
        break;
      case "ArrowRight":
        rotationY += KEYBOARD_ROTATION_STEP;
        break;
      case "ArrowUp":
        rotationX -= KEYBOARD_ROTATION_STEP;
        break;
      case "ArrowDown":
        rotationX += KEYBOARD_ROTATION_STEP;
        break;
      case "Enter":
      case " ":
        relaunchBall();
        break;
      default:
        return;
    }
    // Only the keys the toy consumed — arrows would otherwise scroll the page under
    // a focused stage.
    event.preventDefault();
  }

  function inLogoZone(candidate: ElasticBall): boolean {
    return (
      Math.abs(candidate.x - 0.5) < LOGO_ZONE_HALF_WIDTH &&
      Math.abs(candidate.y - 0.5) < LOGO_ZONE_HALF_HEIGHT
    );
  }

  function applyResponsiveFit() {
    // The original's portrait guard: narrow stages shrink the logo instead of
    // clipping the wordmark's ends off frame.
    if (!logo || !camera) return;
    logo.scale.setScalar(Math.min(1, camera.aspect * 1.3));
  }

  function onResize() {
    if (!renderer || !camera) return;
    refreshStageRect();
    camera.aspect = stageRect.width / stageRect.height || 1;
    camera.updateProjectionMatrix();
    renderer.setSize(stageRect.width, stageRect.height);
    applyResponsiveFit();
    placeBall();
  }

  function tick(dt: number) {
    elapsed += dt;

    if (!heldBall) {
      const step = advanceElasticBall(ball, dt, BALL_RADIUS);
      ball = step.ball;
      if (step.impact && !wasImpact) reportInteraction(effectId, "bounce");
      wasImpact = step.impact !== null;

      if (inLogoZone(ball) && elapsed - wobbleStartedAt >= WOBBLE_DURATION_SECONDS) {
        wobbleStartedAt = elapsed;
        if (!deflected) {
          // First meeting only: the logo knocks the ball away (original parity);
          // later passes just wobble, or the trajectory would never settle.
          deflected = true;
          ball = { ...ball, vx: -0.09, vy: 0.065 };
        }
      }
      placeBall();
    }

    if (!draggingLogo) {
      rotationY += spinVelocityY;
      rotationX += spinVelocityX;
    }
    const damping = Math.pow(INERTIA_DECAY, dt);
    spinVelocityX *= damping;
    spinVelocityY *= damping;

    const wobbleProgress = Math.min((elapsed - wobbleStartedAt) / WOBBLE_DURATION_SECONDS, 1);
    const wobble =
      wobbleProgress < 1 ? Math.sin(wobbleProgress * Math.PI * 4) * (1 - wobbleProgress) ** 2 : 0;

    if (logo) {
      logo.rotation.x = rotationX;
      logo.rotation.y = rotationY + Math.sin(elapsed * 0.35) * 0.055;
      logo.rotation.z = wobble * 0.08;
      logo.position.x = wobble * 0.07;
      logo.position.y = Math.sin(elapsed * 0.5) * 0.025;
    }

    // The "push" is light: the ball carries a lamp across the scene, so the chrome
    // answers its position even between wobbles. Extents are tuned to the default
    // framing (the stage has no zoom).
    ballLight?.position.set((ball.x - 0.5) * 2.45, (0.5 - ball.y) * 1.55, 1.15);
  }

  return {
    mount(stageEl: HTMLElement, ballElement: HTMLElement) {
      stage = stageEl;
      ballEl = ballElement;
      refreshStageRect();
      placeBall();

      const scene = new THREE.Scene();
      const aspect = stageRect.width / stageRect.height || 1;

      camera = new THREE.PerspectiveCamera(CAMERA.fov, aspect, CAMERA.near, CAMERA.far);
      camera.position.z = framing;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(stageRect.width, stageRect.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      stageEl.appendChild(renderer.domElement);
      cleanupFns.push(() => {
        renderer?.dispose();
        if (renderer && stageEl.contains(renderer.domElement)) {
          stageEl.removeChild(renderer.domElement);
        }
      });

      const pmrem = new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      scene.environment = pmrem.fromScene(buildStudioEnvironment(), 0.02).texture;

      // Same rig as poids-lourd (PG-26 lighting), plus the lamp the ball carries.
      const key = new THREE.DirectionalLight(0xffffff, 1.6);
      key.position.set(3, 4, 5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xffffff, 1.0);
      rim.position.set(-4, 2, -3);
      scene.add(rim);
      scene.add(new THREE.HemisphereLight(0xffffff, 0x6a6f78, 0.5));
      ballLight = new THREE.PointLight(0xffffff, 4.8, 1.8, 2);
      scene.add(ballLight);

      const timer = new THREE.Timer();
      const render = () => {
        timer.update();
        tick(Math.min(timer.getDelta(), MAX_FRAME_SECONDS));
        if (camera) renderer?.render(scene, camera);
      };

      const spin = new THREE.Group();
      scene.add(spin);
      logo = spin;
      applyResponsiveFit();

      loadStudioRig(
        (holder) => {
          spin.add(holder);
          if (logoHex !== "#ffffff") tintStudioRig(holder, logoHex);
        },
        () => {
          /* GLB fetch failed: the ball still plays against an empty stage. */
        },
      );

      stageEl.addEventListener("pointerdown", onStagePointerDown);
      stageEl.addEventListener("keydown", onKeyDown);
      // Not passive: the pinch branch owns the wheel over the stage when it fires.
      stageEl.addEventListener("wheel", onWheel, { passive: false });
      ballElement.addEventListener("pointerdown", onBallPointerDown);
      ballElement.addEventListener("click", onBallClick);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);
      window.addEventListener("resize", onResize);
      cleanupFns.push(() => {
        stageEl.removeEventListener("pointerdown", onStagePointerDown);
        stageEl.removeEventListener("keydown", onKeyDown);
        stageEl.removeEventListener("wheel", onWheel);
        ballElement.removeEventListener("pointerdown", onBallPointerDown);
        ballElement.removeEventListener("click", onBallClick);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
        window.removeEventListener("resize", onResize);
      });

      renderer.setAnimationLoop(render);
      cleanupFns.push(() => renderer?.setAnimationLoop(null));
    },

    reset() {
      ball = { ...BALL_SPAWN };
      heldBall = false;
      draggingLogo = false;
      activePointerId = null;
      rotationX = 0;
      rotationY = 0;
      spinVelocityX = 0;
      spinVelocityY = 0;
      wobbleStartedAt = -Infinity;
      // A relaunched toy replays its first meeting too, and comes back to the
      // default framing — same rationale as poids-lourd's reset.
      deflected = false;
      framing = DOLLY_DEFAULT;
      if (camera) camera.position.z = framing;
      placeBall();
      logo?.rotation.set(0, 0, 0);
      logo?.position.set(0, 0, 0);
    },

    zoom(direction: ZoomDirection) {
      framing = Math.min(DOLLY_MAX, Math.max(DOLLY_MIN, stepFraming(framing, direction)));
      if (camera) camera.position.z = framing;
    },

    setLogoColor(hex: string) {
      if (hex === logoHex) return;
      logoHex = hex;
      if (logo) tintStudioRig(logo, hex);
    },

    setQualityTier(tier: QualityTier) {
      renderer?.setPixelRatio(tier === "high" ? Math.min(window.devicePixelRatio, 2) : 1);
    },

    dispose() {
      cleanupFns.forEach((fn) => fn());
      cleanupFns.length = 0;
      renderer = null;
      camera = null;
      stage = null;
      ballEl = null;
      logo = null;
      ballLight = null;
    },
  };
}
