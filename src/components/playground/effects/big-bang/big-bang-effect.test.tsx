import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PLAYGROUND_INTERACTION_EVENT } from "@/components/playground/report-interaction";

// Same lightweight three.js stand-in as lumiere/index.test.tsx and scene-canvas.test.tsx:
// enough surface for the mount/dispose wiring and the click path, no real WebGL context.
const { disposeSpy, setAnimationLoopSpy, intersectSpy } = vi.hoisted(() => ({
  disposeSpy: vi.fn(),
  setAnimationLoopSpy: vi.fn(),
  intersectSpy: vi.fn(() => [] as { point: unknown }[]),
}));

vi.mock("three", async () => {
  class Vec2 {
    x = 0;
    y = 0;
  }
  class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    clone() {
      return new Vec3(this.x, this.y, this.z);
    }
    set() {
      return this;
    }
  }
  class Vec4 {
    x = 0;
    y = 0;
    z = 0;
    w = 0;
    set() {
      return this;
    }
  }
  class Object3DMock {
    children: unknown[] = [];
    visible = true;
    frustumCulled = true;
    position = { set: vi.fn(), copy: vi.fn(), z: 0 };
    rotation = { x: 0, y: 0, set: vi.fn() };
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
    worldToLocal(point: unknown) {
      return point;
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
  class BufferAttribute {
    constructor(
      public array: Float32Array,
      public itemSize: number,
    ) {}
  }
  class BufferGeometry {
    attributes: Record<string, BufferAttribute> = {};
    boundingSphere: unknown = null;
    dispose = vi.fn();
    setAttribute(name: string, attr: BufferAttribute) {
      this.attributes[name] = attr;
      return this;
    }
  }
  class Points extends Object3DMock {
    constructor(
      public geometry: unknown,
      public material: unknown,
    ) {
      super();
    }
  }
  class ShaderMaterial {
    uniforms: Record<string, { value: unknown }>;
    dispose = vi.fn();
    constructor(params: { uniforms: Record<string, { value: unknown }> }) {
      this.uniforms = params.uniforms;
    }
  }
  class Color {
    r = 1;
    g = 1;
    b = 1;
    setHex() {
      return this;
    }
  }
  class Sphere {}
  class Raycaster {
    params: Record<string, unknown> = {};
    setFromCamera = vi.fn();
    intersectObjects = intersectSpy;
  }
  class DirectionalLight extends Object3DMock {}
  class HemisphereLight extends Object3DMock {}
  return {
    Vector2: Vec2,
    Vector3: Vec3,
    Vector4: Vec4,
    Group,
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    PMREMGenerator,
    BufferAttribute,
    BufferGeometry,
    Points,
    ShaderMaterial,
    Color,
    Sphere,
    Raycaster,
    DirectionalLight,
    HemisphereLight,
    ACESFilmicToneMapping: 1,
    AdditiveBlending: 2,
  };
});

const { loadStudioRigMock } = vi.hoisted(() => ({ loadStudioRigMock: vi.fn() }));

vi.mock("@/components/scene/studio-rig", () => ({
  buildStudioEnvironment: vi.fn(() => ({})),
  loadStudioRig: loadStudioRigMock,
}));

const { default: BigBangEffect } = await import("./big-bang-effect");

/** A rig whose single mesh answers the two things the effect asks of it: a material it
 *  can clone per-mesh, and a world→local conversion for the hit point. */
function mountedRig() {
  const material = { clone: () => ({ dispose: vi.fn(), onBeforeCompile: undefined }) };
  const mesh = { isMesh: true, material, worldToLocal: (point: unknown) => point };
  return { traverse: (visit: (object: unknown) => void) => visit(mesh) };
}

beforeEach(() => {
  // The renderer spies are hoisted, so they outlive `restoreAllMocks` and would carry
  // every previous test's unmount into the next one's call count.
  vi.clearAllMocks();
  loadStudioRigMock.mockImplementation((onReady: (holder: unknown) => void) =>
    onReady(mountedRig()),
  );
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
    {} as unknown as RenderingContext,
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  intersectSpy.mockReturnValue([]);
});

describe("BigBangEffect", () => {
  it("mounts a canvas into its container", () => {
    const { container } = render(<BigBangEffect />);

    expect(
      container.querySelector('[data-testid="big-bang-stage"]')?.querySelector("canvas"),
    ).toBeInTheDocument();
  });

  // The point of the rewrite: a click has to land on the logo's own geometry, which is
  // only possible because the chrome mesh is in the scene at all — the first cut added
  // nothing but a point cloud, so there was never a logo to hit.
  it("registers a hit when the click lands on the logo", () => {
    intersectSpy.mockReturnValue([{ point: { clone: () => ({ x: 0, y: 0, z: 0 }) } }]);
    const onInteraction = vi.fn();
    window.addEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);

    const { container } = render(<BigBangEffect />);
    container.querySelector("canvas")?.dispatchEvent(new MouseEvent("pointerdown"));

    expect(onInteraction).toHaveBeenCalledTimes(1);
    window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
  });

  // Firing an explosion in mid-air would break the illusion that you struck something.
  it("ignores a click on the empty stage", () => {
    const onInteraction = vi.fn();
    window.addEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);

    const { container } = render(<BigBangEffect />);
    container.querySelector("canvas")?.dispatchEvent(new MouseEvent("pointerdown"));

    expect(onInteraction).not.toHaveBeenCalled();
    window.removeEventListener(PLAYGROUND_INTERACTION_EVENT, onInteraction);
  });

  it("disposes the renderer, halts the loop and detaches its listeners on unmount", () => {
    const { container, unmount } = render(<BigBangEffect />);
    const canvas = container.querySelector("canvas") as HTMLCanvasElement;
    const removeEventListenerSpy = vi.spyOn(canvas, "removeEventListener");

    unmount();

    expect(disposeSpy).toHaveBeenCalledTimes(1);
    expect(setAnimationLoopSpy).toHaveBeenLastCalledWith(null);
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
