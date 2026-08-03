import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { PLAYGROUND_INTERACTION_EVENT } from "@/components/playground/report-interaction";
import { isChallengeUnlocked } from "@/components/playground/challenges";

const { renderers, groups, cameras } = vi.hoisted(() => ({
  renderers: [] as Array<{ setPixelRatio: Mock; setAnimationLoop: Mock }>,
  groups: [] as Array<{
    position: { set: Mock; x: number; y: number };
    rotation: { set: Mock; x: number; y: number; z: number };
    scale: { setScalar: Mock };
  }>,
  cameras: [] as Array<{ position: { z: number } }>,
}));

// Same lightweight three.js stand-in as the other engines' tests, plus the
// PointLight the ball carries.
vi.mock("three", async () => {
  class Vec3 {
    x = 0;
    y = 0;
    z = 0;
    set() {
      return this;
    }
    sub() {
      return this;
    }
  }
  class Object3DMock {
    children: unknown[] = [];
    position = {
      x: 0,
      y: 0,
      z: 0,
      set: vi.fn(),
      sub: vi.fn(),
    };
    rotation = { set: vi.fn(), x: 0, y: 0, z: 0 };
    scale = { setScalar: vi.fn() };
    isMesh = false;
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
  }
  class Group extends Object3DMock {
    constructor() {
      super();
      groups.push(this as never);
    }
  }
  class Scene extends Object3DMock {
    environment: unknown;
    background: unknown;
  }
  class PerspectiveCamera extends Object3DMock {
    aspect = 1;
    fov: number;
    updateProjectionMatrix = vi.fn();
    constructor(fov = 0) {
      super();
      this.fov = fov;
      cameras.push(this as unknown as { position: { z: number } });
    }
  }
  class WebGLRenderer {
    domElement = document.createElement("canvas");
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    toneMapping = 0;
    constructor() {
      renderers.push(this);
    }
  }
  class Box3 {
    setFromObject() {
      return this;
    }
    getCenter(v: Vec3) {
      return v;
    }
    getSize(v: Vec3) {
      v.x = v.y = v.z = 1;
      return v;
    }
  }
  class Color {
    multiplyScalar() {
      return this;
    }
    setRGB() {
      return this;
    }
  }
  class Timer {
    delta = 0;
    update() {
      this.delta = 0.016;
      return this;
    }
    getDelta() {
      return this.delta;
    }
  }
  class PMREMGenerator {
    compileEquirectangularShader = vi.fn();
    fromScene() {
      return { texture: {} };
    }
  }
  class Mesh extends Object3DMock {
    material: unknown;
    isMesh = true;
    constructor(_geometry?: unknown, material?: unknown) {
      super();
      this.material = material ?? {};
    }
  }
  class PlaneGeometry {}
  class MeshBasicMaterial {
    color = new Color();
  }
  class DirectionalLight extends Object3DMock {}
  class HemisphereLight extends Object3DMock {}
  class PointLight extends Object3DMock {}
  return {
    Vector3: Vec3,
    Group,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    Box3,
    Color,
    Timer,
    PMREMGenerator,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    DirectionalLight,
    HemisphereLight,
    PointLight,
    ACESFilmicToneMapping: 1,
  };
});

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    setDRACOLoader() {}
    load(_url: string, onLoad: (gltf: { scene: unknown }) => void) {
      const fakeScene = { traverse: () => {}, position: { sub: () => {} } };
      onLoad({ scene: fakeScene });
    }
  },
}));
vi.mock("three/examples/jsm/loaders/DRACOLoader.js", () => ({
  DRACOLoader: class {
    setDecoderPath() {}
  },
}));

const { createAttrapeMoiEngine } = await import("./engine");

function makeStage() {
  const el = document.createElement("div");
  vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
    left: 0,
    top: 0,
    width: 800,
    height: 600,
    right: 800,
    bottom: 600,
    x: 0,
    y: 0,
    toJSON() {},
  });
  document.body.appendChild(el);
  return el;
}

function makeBall() {
  const el = document.createElement("button");
  document.body.appendChild(el);
  return el;
}

function mountToy() {
  const stage = makeStage();
  const ballEl = makeBall();
  const engine = createAttrapeMoiEngine();
  engine.mount(stage, ballEl);
  const renderFrame = renderers[renderers.length - 1].setAnimationLoop.mock
    .calls[0][0] as () => void;
  return { engine, stage, ballEl, renderFrame };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  renderers.length = 0;
  groups.length = 0;
  cameras.length = 0;
  window.localStorage.clear();
});

// Two Groups exist per mount: the engine's own spin/fit wrapper first, then the rig
// holder loadStudioRig creates (synchronously in this mock). The engine animates the
// wrapper; the holder keeps its loader transforms.
function spinWrapper() {
  return groups[groups.length - 2];
}
function rigHolder() {
  return groups[groups.length - 1];
}

describe("createAttrapeMoiEngine", () => {
  // @req REQ-037
  it("mounts a renderer canvas and places the ball at its spawn point", () => {
    const { engine, stage, ballEl } = mountToy();

    expect(stage.querySelector("canvas")).not.toBeNull();
    // Spawn {x: 0.18, y: 0.68} on an 800x600 stage, centred on the 44px fallback size.
    expect(ballEl.style.transform).toBe("translate3d(122px, 386px, 0)");

    engine.dispose();
  });

  // @req REQ-037
  it("keeps the ball travelling between frames", () => {
    const { engine, ballEl, renderFrame } = mountToy();
    const before = ballEl.style.transform;

    renderFrame();
    renderFrame();

    expect(ballEl.style.transform).not.toBe(before);
    engine.dispose();
  });

  // @req REQ-043
  it("reports a grab and unlocks the hidden challenge when the ball is caught", () => {
    const { engine, ballEl } = mountToy();
    const onInteraction = vi.fn();
    window.addEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);

    ballEl.dispatchEvent(new PointerEvent("pointerdown", { clientX: 144, clientY: 408 }));

    const detail = (onInteraction.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toEqual({ effectId: "attrape-moi", interaction: "grab" });
    expect(isChallengeUnlocked("attrape-moi")).toBe(true);

    window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
    engine.dispose();
  });

  // @req REQ-037
  it("holds a caught ball at rest until Enter relaunches it", () => {
    const { engine, stage, ballEl, renderFrame } = mountToy();

    ballEl.dispatchEvent(new PointerEvent("pointerdown", { clientX: 144, clientY: 408 }));
    window.dispatchEvent(new PointerEvent("pointerup"));
    renderFrame();
    const resting = ballEl.style.transform;
    renderFrame();
    renderFrame();
    expect(ballEl.style.transform).toBe(resting);

    stage.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    renderFrame();
    renderFrame();
    expect(ballEl.style.transform).not.toBe(resting);

    engine.dispose();
  });

  // @req REQ-037
  it("rotates the logo from the arrow keys", () => {
    const { engine, stage, renderFrame } = mountToy();
    const logo = spinWrapper();

    stage.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    renderFrame();

    expect(logo.rotation.y).toBeGreaterThan(0.1);
    engine.dispose();
  });

  // @req REQ-037
  it("wobbles the logo when the ball brushes past it", () => {
    const { engine, renderFrame } = mountToy();
    const logo = spinWrapper();

    let strongestKick = 0;
    for (let frame = 0; frame < 250; frame += 1) {
      renderFrame();
      strongestKick = Math.max(strongestKick, Math.abs(logo.rotation.z));
    }

    expect(strongestKick).toBeGreaterThan(0.01);
    engine.dispose();
  });

  // @req REQ-037
  it("dollies the camera from the on-screen zoom control", () => {
    const { engine } = mountToy();
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    engine.zoom("in");
    expect(camera.position.z).toBeLessThan(framing);

    engine.zoom("out");
    expect(camera.position.z).toBeCloseTo(framing);
    engine.dispose();
  });

  // Regression: the first ship wrote the responsive fit onto the rig holder itself,
  // wiping the loader's 1/maxDim normalization — the logo rendered at raw GLB size.
  // @req REQ-037
  it("keeps the rig holder's loader transforms; the fit lives on the wrapper", () => {
    const { engine, renderFrame } = mountToy();
    const holder = rigHolder();
    const spin = spinWrapper();

    renderFrame();
    renderFrame();

    expect(holder.rotation.y).toBeCloseTo(-Math.PI / 4);
    expect(holder.scale.setScalar).toHaveBeenCalledTimes(1);
    expect(spin.scale.setScalar).toHaveBeenCalled();
    engine.dispose();
  });

  // @req REQ-037
  it("returns the ball to its spawn point on reset", () => {
    const { engine, ballEl, renderFrame } = mountToy();
    const spawn = ballEl.style.transform;

    for (let frame = 0; frame < 30; frame += 1) renderFrame();
    expect(ballEl.style.transform).not.toBe(spawn);

    engine.reset();

    expect(ballEl.style.transform).toBe(spawn);
    engine.dispose();
  });

  // @req REQ-037
  it("balances every listener it adds with a matching removal on dispose (no leaks)", () => {
    const stage = makeStage();
    const ballEl = makeBall();
    const stageAddSpy = vi.spyOn(stage, "addEventListener");
    const stageRemoveSpy = vi.spyOn(stage, "removeEventListener");
    const ballAddSpy = vi.spyOn(ballEl, "addEventListener");
    const ballRemoveSpy = vi.spyOn(ballEl, "removeEventListener");
    const windowAddSpy = vi.spyOn(window, "addEventListener");
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const engine = createAttrapeMoiEngine();
    engine.mount(stage, ballEl);
    engine.dispose();

    expect(stageRemoveSpy.mock.calls.map(([type]) => type).sort()).toEqual(
      stageAddSpy.mock.calls.map(([type]) => type).sort(),
    );
    expect(ballRemoveSpy.mock.calls.map(([type]) => type).sort()).toEqual(
      ballAddSpy.mock.calls.map(([type]) => type).sort(),
    );
    const addedOnWindow = windowAddSpy.mock.calls.map(([type]) => type);
    const removedFromWindow = windowRemoveSpy.mock.calls.map(([type]) => type);
    for (const type of addedOnWindow) {
      expect(removedFromWindow).toContain(type);
    }
  });

  // @req REQ-037
  it("leaves a plain wheel to the page but dollies on a pinch", () => {
    const { engine, stage } = mountToy();
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    const plain = new WheelEvent("wheel", { deltaY: -40, cancelable: true });
    stage.dispatchEvent(plain);
    expect(plain.defaultPrevented).toBe(false);
    expect(camera.position.z).toBe(framing);

    stage.dispatchEvent(new WheelEvent("wheel", { deltaY: -40, ctrlKey: true, cancelable: true }));
    expect(camera.position.z).toBeLessThan(framing);
    engine.dispose();
  });

  // @req REQ-037
  it("clamps a dragged ball to the stage walls", () => {
    const { engine, ballEl } = mountToy();

    ballEl.dispatchEvent(new PointerEvent("pointerdown", { clientX: 144, clientY: 408 }));
    window.dispatchEvent(new PointerEvent("pointermove", { clientX: 5000, clientY: 408 }));

    // x clamps to 1 - BALL_RADIUS = 0.955 -> 0.955*800 - 22 = 742px; y stays at 0.68.
    expect(ballEl.style.transform).toBe("translate3d(742px, 386px, 0)");
    engine.dispose();
  });

  // @req REQ-037
  it("ignores moves and releases from a second pointer while the ball is carried", () => {
    const { engine, ballEl, renderFrame } = mountToy();

    ballEl.dispatchEvent(
      new PointerEvent("pointerdown", { pointerId: 1, clientX: 144, clientY: 408 }),
    );
    const held = ballEl.style.transform;

    // A palm resting on the stage: different pointerId, must neither move nor drop.
    window.dispatchEvent(
      new PointerEvent("pointermove", { pointerId: 2, clientX: 600, clientY: 100 }),
    );
    expect(ballEl.style.transform).toBe(held);

    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 2 }));
    renderFrame();
    renderFrame();
    // Still held: the ball did not resume travelling after the foreign release.
    expect(ballEl.style.transform).toBe(held);
    engine.dispose();
  });
});
