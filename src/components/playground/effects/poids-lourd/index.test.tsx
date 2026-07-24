import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// jsdom doesn't implement matchMedia at all — stub a "no preference" default that
// individual tests can override, same helper shape as scene-canvas.test.tsx.
function stubMatchMedia(reducedMotion: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("prefers-reduced-motion") ? reducedMotion : true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

const { renderers, groups } = vi.hoisted(() => ({
  renderers: [] as Array<{
    setAnimationLoop: (fn: unknown) => void;
    setPixelRatio: (r: number) => void;
  }>,
  groups: [] as Array<{
    position: { set: (...args: number[]) => void };
    rotation: { set: (...args: number[]) => void };
  }>,
}));

// Same lightweight three.js stand-in as engine.test.ts / scene-canvas.test.tsx.
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

const { default: PoidsLourdEffect } = await import("./index");
const { copy } = await import("./copy");

function renderEffect() {
  return render(
    <NextIntlClientProvider locale="fr">
      <PoidsLourdEffect />
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  stubMatchMedia(false);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  renderers.length = 0;
  groups.length = 0;
  window.localStorage.clear();
});

describe("PoidsLourdEffect", () => {
  it("shows the text fallback when WebGL is unavailable", () => {
    // jsdom's canvas has no WebGL context by default — the real, unmocked path.
    renderEffect();
    expect(screen.getByText(copy.fr.fallback)).toBeInTheDocument();
    expect(screen.queryByTestId("poids-lourd-stage")).not.toBeInTheDocument();
  });

  it("shows the text fallback when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    renderEffect();
    expect(screen.getByText(copy.fr.fallback)).toBeInTheDocument();
  });

  it("mounts a canvas and starts the render loop once WebGL is available", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    renderEffect();

    expect(screen.getByTestId("poids-lourd-stage").querySelector("canvas")).not.toBeNull();
    expect(renderers[0].setAnimationLoop).toHaveBeenCalledWith(expect.any(Function));
  });

  it("cleans up every listener and stops the render loop on unmount (no leaks)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );
    const windowAddSpy = vi.spyOn(window, "addEventListener");
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderEffect();
    const renderer = renderers[0];
    unmount();

    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);

    const addedOnWindow = windowAddSpy.mock.calls.map(([type]) => type);
    const removedFromWindow = windowRemoveSpy.mock.calls.map(([type]) => type);
    for (const type of addedOnWindow) {
      expect(removedFromWindow).toContain(type);
    }
  });

  it("resets the body to the origin when the reset button is clicked", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    renderEffect();
    await waitFor(() => expect(groups.length).toBeGreaterThan(0));
    const body = groups[groups.length - 1];

    fireEvent.click(screen.getByRole("button", { name: copy.fr.reset }));

    expect(body.position.set).toHaveBeenCalledWith(0, 0, 0);
    expect(body.rotation.set).toHaveBeenCalledWith(0, 0, 0);
  });
});
