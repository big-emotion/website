import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Same technique as scene-canvas.test.tsx: jsdom has no WebGL, so the mount/dispose
// leak test forces support and mocks the heavy imperative pieces (three.js,
// MeshSurfaceSampler, the shared studio rig) rather than a real GPU.
const disposeSpies: { renderer: ReturnType<typeof vi.fn>; geometry: ReturnType<typeof vi.fn>[] } = {
  renderer: vi.fn(),
  geometry: [],
};

vi.mock("three", async () => {
  class Vec3 {
    x = 0;
    y = 0;
    z = 0;
    set() {
      return this;
    }
    applyMatrix4() {
      return this;
    }
    transformDirection() {
      return this;
    }
    distanceTo() {
      return 1;
    }
    fromBufferAttribute() {
      return this;
    }
  }
  class Vec2 {
    x = 0;
    y = 0;
  }
  class Object3DMock {
    children: unknown[] = [];
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
  }
  class Scene extends Object3DMock {}
  class PerspectiveCamera extends Object3DMock {
    aspect = 1;
    position = { set: vi.fn() };
    updateProjectionMatrix = vi.fn();
  }
  class WebGLRenderer {
    domElement = document.createElement("canvas");
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = vi.fn();
    render = vi.fn();
    dispose = disposeSpies.renderer;
  }
  class BufferAttribute {
    array: Float32Array;
    itemSize: number;
    count: number;
    needsUpdate = false;
    constructor(array: Float32Array, itemSize: number) {
      this.array = array;
      this.itemSize = itemSize;
      this.count = array.length / itemSize;
    }
    setX() {
      return this;
    }
  }
  class BufferGeometry {
    attributes: Record<string, BufferAttribute> = {};
    dispose = vi.fn();
    constructor() {
      disposeSpies.geometry.push(this.dispose);
    }
    setAttribute(name: string, attr: BufferAttribute) {
      this.attributes[name] = attr;
      return this;
    }
    getAttribute(name: string) {
      return this.attributes[name];
    }
    setDrawRange = vi.fn();
  }
  class Points extends Object3DMock {
    geometry: unknown;
    material: unknown;
    constructor(geometry: unknown, material: unknown) {
      super();
      this.geometry = geometry;
      this.material = material;
    }
  }
  class ShaderMaterial {
    uniforms: Record<string, { value: unknown }>;
    dispose = vi.fn();
    constructor(params: { uniforms: Record<string, { value: unknown }> }) {
      this.uniforms = params.uniforms;
    }
  }
  class Color {}
  class Raycaster {
    params: { Points?: { threshold: number } } = {};
    setFromCamera = vi.fn();
    intersectObject = vi.fn(() => []);
  }
  return {
    Vector3: Vec3,
    Vector2: Vec2,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    BufferAttribute,
    BufferGeometry,
    Points,
    ShaderMaterial,
    Color,
    Raycaster,
  };
});

vi.mock("three/examples/jsm/math/MeshSurfaceSampler.js", () => ({
  MeshSurfaceSampler: class {
    build() {
      return this;
    }
    sample() {
      // Leaves the caller's temp Vector3s at their default (0,0,0) — enough to
      // exercise the geometry-building path without real surface math.
    }
  },
}));

vi.mock("@/components/scene/studio-rig", () => ({
  loadStudioRig: vi.fn((onReady: (holder: unknown) => void) => {
    const mesh = { isMesh: true, matrixWorld: {} };
    const holder = {
      updateMatrixWorld: vi.fn(),
      traverse: (visit: (object: unknown) => void) => visit(mesh),
    };
    onReady(holder);
  }),
}));

const { default: BigBangEffect } = await import("./big-bang-effect");

beforeEach(() => {
  disposeSpies.renderer.mockClear();
  disposeSpies.geometry.length = 0;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    {} as unknown as RenderingContext,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BigBangEffect mount/dispose", () => {
  it("mounts a canvas into its container", () => {
    const { container, unmount } = render(<BigBangEffect />);
    const stage = container.querySelector('[data-testid="big-bang-stage"]');
    expect(stage?.querySelector("canvas")).toBeInTheDocument();
    unmount();
  });

  it("disposes the renderer, material and geometry and stops the animation loop on unmount", () => {
    const { container, unmount } = render(<BigBangEffect />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    const removeEventListenerSpy = vi.spyOn(canvas, "removeEventListener");

    unmount();

    expect(disposeSpies.renderer).toHaveBeenCalledTimes(1);
    expect(disposeSpies.geometry).toHaveLength(1);
    expect(disposeSpies.geometry[0]).toHaveBeenCalledTimes(1);
    expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("leaves no canvas mounted and never throws when WebGL is unavailable", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { container, unmount } = render(<BigBangEffect />);
    expect(container.querySelector("canvas")).not.toBeInTheDocument();
    expect(() => unmount()).not.toThrow();
  });
});
