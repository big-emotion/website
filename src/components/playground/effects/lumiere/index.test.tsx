import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

// Same lightweight three.js stand-in as scene-canvas.test.tsx / studio-rig.test.ts:
// enough surface for the mount/dispose wiring, no real WebGL context or GPU.
const { disposeSpy, setAnimationLoopSpy } = vi.hoisted(() => ({
  disposeSpy: vi.fn(),
  setAnimationLoopSpy: vi.fn(),
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
    position = { set: vi.fn(), z: 0 };
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
  }
  class WebGLRenderer {
    domElement = document.createElement("canvas");
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

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Lumiere mount/dispose", () => {
  it("starts the animation loop once the studio rig resolves", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));

    render(<Lumiere />);

    expect(setAnimationLoopSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it("disposes the renderer, halts the loop, and removes every listener it added on unmount", () => {
    loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) => onReady({}));
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = render(<Lumiere />);
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

    render(<Lumiere />);

    expect(setAnimationLoopSpy).not.toHaveBeenCalled();
  });
});
