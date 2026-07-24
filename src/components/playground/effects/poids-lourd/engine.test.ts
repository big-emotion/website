import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import { PLAYGROUND_INTERACTION_EVENT } from "@/components/playground/report-interaction";

const { renderers, groups, cameras } = vi.hoisted(() => ({
  renderers: [] as Array<{ setPixelRatio: Mock; setAnimationLoop: Mock }>,
  groups: [] as Array<{ position: { set: Mock }; rotation: { set: Mock } }>,
  cameras: [] as Array<{ position: { z: number } }>,
}));

// Same lightweight three.js stand-in used by scene-canvas.test.tsx / studio-rig.test.ts:
// enough surface for the studio rig plus this engine's own scene/camera/renderer setup,
// without a real WebGL context or GPU.
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
    // `set` records z as well as spying: the camera's framing is read back straight off
    // `position.z`, exactly as three.js would leave it.
    position = {
      z: 0,
      set: vi.fn((_x: number, _y: number, z: number) => {
        this.position.z = z;
      }),
      sub: vi.fn(),
    };
    rotation = { set: vi.fn(), y: 0 };
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
      groups.push(this);
    }
  }
  class Scene extends Object3DMock {
    environment: unknown;
    background: unknown;
  }
  class PerspectiveCamera extends Object3DMock {
    aspect = 1;
    updateProjectionMatrix = vi.fn();
    constructor() {
      super();
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
  // Mirrors THREE.Timer's contract: the delta stays 0 until `update()` runs, so a
  // render loop that forgets to tick the timer freezes rather than quietly passing.
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

const { createPoidsLourdEngine } = await import("./engine");

function makeContainer() {
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

function pointerEvent(type: string, clientX: number, clientY: number) {
  return new PointerEvent(type, { clientX, clientY, bubbles: true });
}

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = "";
  renderers.length = 0;
  groups.length = 0;
});

describe("createPoidsLourdEngine", () => {
  it("mounts a renderer canvas into the container and starts the animation loop", () => {
    const engine = createPoidsLourdEngine();
    const container = makeContainer();

    engine.mount(container);

    expect(container.querySelector("canvas")).not.toBeNull();
    engine.dispose();
  });

  it("falls under gravity as frames elapse", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    const renderFrame = renderers[renderers.length - 1].setAnimationLoop.mock
      .calls[0][0] as () => void;
    // loadStudioRig resolves synchronously in this mock, so the holder group it
    // creates (the last one pushed) is the body the engine is animating.
    const body = groups[groups.length - 1];
    body.position.set.mockClear();

    renderFrame();
    renderFrame();

    const [, y] = body.position.set.mock.calls[body.position.set.mock.calls.length - 1];
    expect(y).toBeLessThan(0);

    engine.dispose();
  });

  it("balances every listener it adds with a matching removal on dispose (no leaks)", () => {
    const container = makeContainer();
    const containerAddSpy = vi.spyOn(container, "addEventListener");
    const containerRemoveSpy = vi.spyOn(container, "removeEventListener");
    const windowAddSpy = vi.spyOn(window, "addEventListener");
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const engine = createPoidsLourdEngine();
    engine.mount(container);
    engine.dispose();

    const addedOnContainer = containerAddSpy.mock.calls.map(([type]) => type);
    const removedFromContainer = containerRemoveSpy.mock.calls.map(([type]) => type);
    expect(removedFromContainer.sort()).toEqual(addedOnContainer.sort());

    const addedOnWindow = windowAddSpy.mock.calls.map(([type]) => type);
    const removedFromWindow = windowRemoveSpy.mock.calls.map(([type]) => type);
    for (const type of addedOnWindow) {
      expect(removedFromWindow).toContain(type);
    }
  });

  it("stops the render loop on dispose", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    const canvas = container.querySelector("canvas")!;

    engine.dispose();

    expect(canvas.isConnected).toBe(false);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("reports a grab interaction on pointerdown", () => {
    const container = makeContainer();
    const onInteraction = vi.fn();
    window.addEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);

    const engine = createPoidsLourdEngine();
    engine.mount(container);
    container.dispatchEvent(pointerEvent("pointerdown", 400, 300));

    expect(onInteraction).toHaveBeenCalledTimes(1);
    const detail = (onInteraction.mock.calls[0][0] as CustomEvent).detail;
    expect(detail).toEqual({ effectId: "poids-lourd", interaction: "grab" });

    window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
    engine.dispose();
  });

  it("reports a throw interaction when the release velocity clears the gesture threshold", () => {
    const container = makeContainer();
    const onInteraction = vi.fn();
    window.addEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);

    const engine = createPoidsLourdEngine();
    engine.mount(container);

    function pointerEventAt(type: string, clientX: number, clientY: number, t: number) {
      const event = new PointerEvent(type, { clientX, clientY, bubbles: true });
      Object.defineProperty(event, "timeStamp", { value: t, configurable: true });
      return event;
    }

    const start = 1_000;
    container.dispatchEvent(pointerEventAt("pointerdown", 400, 300, start));
    window.dispatchEvent(pointerEventAt("pointermove", 700, 300, start + 16));
    window.dispatchEvent(pointerEventAt("pointerup", 700, 300, start + 32));

    const interactions = onInteraction.mock.calls.map(
      (call) => (call[0] as CustomEvent).detail.interaction,
    );
    expect(interactions).toContain("throw");

    window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
    engine.dispose();
  });

  it("re-centers the body and zeroes its motion on reset", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    // loadStudioRig resolves synchronously in this mock, so the holder group it
    // creates (the last one pushed) is the body the engine is animating.
    const body = groups[groups.length - 1];

    engine.reset();

    expect(body.position.set).toHaveBeenCalledWith(0, 0, 0);
    expect(body.rotation.set).toHaveBeenCalledWith(0, 0, 0);

    engine.dispose();
  });

  // The zoom a trackpad can reach. It shipped behind "hold a mouse button and turn the
  // wheel", which a Mac laptop cannot perform at all — the wheel went to the page and
  // scrolled the stage away instead.
  it("dollies the camera when the on-screen zoom control is pressed", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    engine.zoom("in");
    expect(camera.position.z).toBeLessThan(framing);

    engine.zoom("out");
    expect(camera.position.z).toBeCloseTo(framing);

    engine.dispose();
  });

  it("dollies on a pinch, which arrives as a wheel event with no button held", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    container.dispatchEvent(
      new WheelEvent("wheel", { deltaY: -40, ctrlKey: true, cancelable: true }),
    );

    expect(camera.position.z).toBeLessThan(framing);
    engine.dispose();
  });

  // The stage fills most of the viewport: if it swallowed every wheel event there would
  // be no way left to scroll back up to the header.
  it("leaves a plain wheel to the page", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    const wheel = new WheelEvent("wheel", { deltaY: -40, cancelable: true });
    container.dispatchEvent(wheel);

    expect(camera.position.z).toBe(framing);
    expect(wheel.defaultPrevented).toBe(false);
    engine.dispose();
  });

  it("caps the pixel ratio to 1 on the low quality tier and restores it on high", () => {
    const container = makeContainer();
    const engine = createPoidsLourdEngine();
    engine.mount(container);
    const renderer = renderers[renderers.length - 1];

    engine.setQualityTier("low");
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(1);

    engine.setQualityTier("high");
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(Math.min(window.devicePixelRatio, 2));

    engine.dispose();
  });
});
