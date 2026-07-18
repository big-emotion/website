import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// jsdom doesn't implement matchMedia at all — stub a "no preference" default
// that individual tests can override.
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

// jsdom has no WebGL support out of the box, so most tests exercise the real
// no-WebGL fallback path. The "loads the scene" test forces support and mocks
// the heavy imperative pieces (three.js, GLTFLoader/DRACOLoader, gsap, Lenis)
// so it can assert the loader-then-scene transition without a real GPU.
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
    rotation = { set: vi.fn() };
    scale = { setScalar: vi.fn() };
    isMesh = false;
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
  }
  class Group extends Object3DMock {}
  class Scene extends Object3DMock {
    environment: unknown;
    background: unknown;
  }
  class PerspectiveCamera extends Object3DMock {
    aspect = 1;
    updateProjectionMatrix = vi.fn();
  }
  class WebGLRenderer {
    domElement = document.createElement("canvas");
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setAnimationLoop = vi.fn();
    render = vi.fn();
    dispose = vi.fn();
    toneMapping = 0;
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
  class Clock {
    getDelta() {
      return 0.016;
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
    Clock,
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
      const fakeScene = {
        traverse: () => {},
        position: { sub: () => {} },
      };
      onLoad({ scene: fakeScene });
    }
  },
}));
vi.mock("three/examples/jsm/loaders/DRACOLoader.js", () => ({
  DRACOLoader: class {
    setDecoderPath() {}
  },
}));

vi.mock("gsap", () => {
  const to = vi.fn((_target: unknown, vars: { onComplete?: () => void }) => {
    vars.onComplete?.();
    return { kill: vi.fn(), progress: vi.fn() };
  });
  const timeline = vi.fn(() => ({
    call: vi.fn().mockReturnThis(),
    to: vi.fn().mockReturnThis(),
    scrollTrigger: { kill: vi.fn() },
  }));
  return {
    default: {
      registerPlugin: vi.fn(),
      to,
      timeline,
      ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
    },
  };
});
vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: { update: vi.fn(), refresh: vi.fn() },
}));
vi.mock("lenis", () => ({
  default: class {
    on() {}
    raf() {}
    destroy() {}
  },
}));

const { SceneCanvas } = await import("./scene-canvas");

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete document.body.dataset.active;
});

describe("SceneCanvas", () => {
  it("renders the static wordmark fallback when WebGL is unavailable", () => {
    // jsdom's canvas has no WebGL context by default — this is the real,
    // unmocked no-WebGL path.
    render(<SceneCanvas />);
    expect(screen.getByTestId("scene-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("scene-canvas")).not.toBeInTheDocument();
  });

  it("renders the static wordmark fallback when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    render(<SceneCanvas />);
    expect(screen.getByTestId("scene-fallback")).toBeInTheDocument();
  });

  it("shows the loader, then the scene once the model resolves", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    render(<SceneCanvas />);

    expect(screen.getByTestId("scene-canvas")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId("scene-loader")).not.toBeInTheDocument();
    });
    expect(document.body.dataset.active).toBe("0");
  });
});
