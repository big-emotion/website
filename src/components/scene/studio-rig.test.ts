import { afterEach, describe, expect, it, vi } from "vitest";

// Same lightweight three.js stand-in as scene-canvas.test.tsx: enough surface for the
// rig's own logic (env panels, material assignment, holder centering) without a real
// WebGL context or GPU.
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
    position = { set: vi.fn(), sub: vi.fn() };
    rotation = { set: vi.fn(), y: 0 };
    scale = { setScalar: vi.fn() };
    isMesh = false;
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
  }
  class Group extends Object3DMock {}
  class Scene extends Object3DMock {
    background: unknown;
  }
  class Box3 {
    setFromObject() {
      return this;
    }
    getCenter(v: Vec3) {
      return v;
    }
    getSize(v: Vec3) {
      v.x = v.y = v.z = 2;
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
  return {
    Vector3: Vec3,
    Group,
    Scene,
    Box3,
    Color,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
  };
});

const { gltfLoad } = vi.hoisted(() => ({ gltfLoad: vi.fn() }));

vi.mock("three/examples/jsm/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class {
    setDRACOLoader() {}
    load(
      url: string,
      onLoad: (gltf: { scene: unknown }) => void,
      onProgress: undefined,
      onError: () => void,
    ) {
      gltfLoad(url, onLoad, onError);
    }
  },
}));
vi.mock("three/examples/jsm/loaders/DRACOLoader.js", () => ({
  DRACOLoader: class {
    setDecoderPath() {}
  },
}));

const { buildStudioEnvironment, loadStudioRig, GLB_URL } = await import("./studio-rig");

afterEach(() => {
  vi.clearAllMocks();
});

describe("buildStudioEnvironment", () => {
  it("bakes five light panels into the environment scene", () => {
    const env = buildStudioEnvironment();
    expect(env.children).toHaveLength(5);
  });
});

describe("loadStudioRig", () => {
  it("requests the branded GLB and hands back a centered, unit-scaled holder", () => {
    const onReady = vi.fn();
    const fakeMesh = { isMesh: true, material: { needsUpdate: false } };
    const fakeScene = {
      traverse: (visit: (obj: unknown) => void) => visit(fakeMesh),
      position: { sub: vi.fn() },
    };

    loadStudioRig(onReady, vi.fn());
    const [url, onLoad] = gltfLoad.mock.calls[0];
    expect(url).toBe(GLB_URL);
    onLoad({ scene: fakeScene });

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(fakeMesh.material.needsUpdate).toBe(true);
  });

  it("calls onError when the GLB fails to load", () => {
    const onError = vi.fn();
    loadStudioRig(vi.fn(), onError);

    const [, , onLoadError] = gltfLoad.mock.calls[0];
    onLoadError();

    expect(onError).toHaveBeenCalledTimes(1);
  });
});
