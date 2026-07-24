import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

// Same lightweight three.js stand-in as scene-canvas.test.tsx / studio-rig.test.ts:
// enough surface for the mount/dispose wiring, no real WebGL context or GPU.
const { disposeSpy, setAnimationLoopSpy, cameras, canvases } = vi.hoisted(() => ({
  disposeSpy: vi.fn(),
  setAnimationLoopSpy: vi.fn(),
  cameras: [] as Array<{ position: { z: number } }>,
  canvases: [] as HTMLCanvasElement[],
}));

vi.mock("three", async () => {
  class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    normalize() {
      return this;
    }
    applyQuaternion() {
      return this;
    }
    angleTo() {
      return 0;
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
    };
    rotation = { x: 0, y: 0, set: vi.fn() };
    quaternion = {};
    scale = { setScalar: vi.fn() };
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
  }
  class Group extends Object3DMock {}
  class Scene extends Object3DMock {
    environment: unknown;
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
    domElement = canvases[canvases.push(document.createElement("canvas")) - 1];
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = setAnimationLoopSpy;
    render = vi.fn();
    dispose = disposeSpy;
    toneMapping = 0;
  }
  class PMREMGenerator {
    compileEquirectangularShader = vi.fn();
    fromScene() {
      return { texture: {} };
    }
  }
  class SpriteMaterial {
    opacity = 0;
    color = {};
  }
  class Sprite extends Object3DMock {
    material: SpriteMaterial;
    constructor(material: SpriteMaterial) {
      super();
      this.material = material;
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
  class DirectionalLight extends Object3DMock {}
  class HemisphereLight extends Object3DMock {}
  return {
    Vector3: Vec3,
    Group,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    PMREMGenerator,
    SpriteMaterial,
    Sprite,
    Timer,
    DirectionalLight,
    HemisphereLight,
    MathUtils: { radToDeg: (rad: number) => (rad * 180) / Math.PI },
    ACESFilmicToneMapping: 1,
  };
});

const { loadStudioRigMock } = vi.hoisted(() => ({ loadStudioRigMock: vi.fn() }));

vi.mock("@/components/scene/studio-rig", () => ({
  buildStudioEnvironment: vi.fn(() => ({})),
  loadStudioRig: loadStudioRigMock,
}));

const { default: Lumiere } = await import("./index");

function renderLumiere() {
  return render(
    <NextIntlClientProvider locale="fr">
      <Lumiere />
    </NextIntlClientProvider>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  cameras.length = 0;
  canvases.length = 0;
});

describe("Lumiere mount/dispose", () => {
  it("starts the animation loop once the studio rig resolves", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));

    renderLumiere();

    expect(setAnimationLoopSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it("disposes the renderer, halts the loop, and removes every listener it added on unmount", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderLumiere();
    const addedTypes = addSpy.mock.calls.map(([type]) => type).sort();
    expect(addedTypes.length).toBeGreaterThan(0);

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
    expect(setAnimationLoopSpy).toHaveBeenLastCalledWith(null);
    const removedTypes = removeSpy.mock.calls.map(([type]) => type).sort();
    expect(removedTypes).toEqual(addedTypes);
  });

  it("never starts the animation loop if the rig fails to load", () => {
    loadStudioRigMock.mockImplementation((_onReady: unknown, onError: () => void) => onError());

    renderLumiere();

    expect(setAnimationLoopSpy).not.toHaveBeenCalled();
  });
});

// The zoom a trackpad can reach. It shipped behind "hold the mark down and turn the
// wheel", which a Mac laptop cannot perform at all — the wheel went to the page and
// scrolled the stage away instead.
describe("Lumiere zoom", () => {
  it("dollies the camera when the on-screen zoom control is pressed", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));
    renderLumiere();
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    fireEvent.click(screen.getByRole("button", { name: /zoomer sur le logo/i }));
    expect(camera.position.z).toBeLessThan(framing);

    fireEvent.click(screen.getByRole("button", { name: /dézoomer/i }));
    expect(camera.position.z).toBeCloseTo(framing);
  });

  it("dollies on a pinch, which arrives as a wheel event with nothing held", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));
    renderLumiere();
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    canvases[canvases.length - 1].dispatchEvent(
      new WheelEvent("wheel", { deltaY: -40, ctrlKey: true, cancelable: true }),
    );

    expect(camera.position.z).toBeLessThan(framing);
  });

  // The stage fills the viewport: if it swallowed every wheel event there would be no
  // way left to scroll back up to the header.
  it("leaves a plain wheel to the page", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));
    renderLumiere();
    const camera = cameras[cameras.length - 1];
    const framing = camera.position.z;

    const wheel = new WheelEvent("wheel", { deltaY: -40, cancelable: true });
    canvases[canvases.length - 1].dispatchEvent(wheel);

    expect(camera.position.z).toBe(framing);
    expect(wheel.defaultPrevented).toBe(false);
  });

  it("keeps the controls out of the way when the rig never loads", () => {
    loadStudioRigMock.mockImplementation((_onReady: unknown, onError: () => void) => onError());

    renderLumiere();

    expect(screen.queryByRole("button", { name: /zoomer sur le logo/i })).not.toBeInTheDocument();
  });
});
