import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";

// jsdom doesn't implement matchMedia at all — stub a "no preference" default that
// individual tests can override, same helper shape as the other effects' tests.
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

const { renderers, tintedHexes } = vi.hoisted(() => ({
  renderers: [] as Array<{
    setAnimationLoop: (fn: unknown) => void;
    setPixelRatio: (r: number) => void;
  }>,
  // Every Color.set the scene performs — how a logo-colour pick is observed reaching
  // the rig's material.
  tintedHexes: [] as string[],
}));

// Same lightweight three.js stand-in as the other effects' component tests.
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
    position = { x: 0, y: 0, z: 0, set: vi.fn(), sub: vi.fn() };
    rotation = { set: vi.fn(), x: 0, y: 0, z: 0 };
    scale = { setScalar: vi.fn() };
    isMesh = false;
    add(child: unknown) {
      this.children.push(child);
      return this;
    }
    traverse(callback: (obj: unknown) => void) {
      callback(this);
      for (const child of this.children) {
        (child as { traverse?: (cb: (obj: unknown) => void) => void }).traverse?.(callback);
      }
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
    set(hex: unknown) {
      tintedHexes.push(String(hex));
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
      // A visitable mesh, unlike the other suites' inert scene: the tint path
      // (setLogoColor -> tintStudioRig) must reach a material to be provable.
      const fakeMesh = { isMesh: true, material: { needsUpdate: false } };
      const fakeScene = {
        traverse: (visit: (obj: unknown) => void) => visit(fakeMesh),
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

const { default: AttrapeMoiEffect } = await import("./index");
const { copy } = await import("./copy");
const { isChallengeUnlocked } = await import("@/components/playground/challenges");

function renderEffect() {
  return render(
    <NextIntlClientProvider locale="fr">
      <AttrapeMoiEffect />
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
  tintedHexes.length = 0;
  window.localStorage.clear();
});

describe("AttrapeMoiEffect", () => {
  // @req REQ-037
  it("shows the text fallback when WebGL is unavailable", () => {
    // jsdom's canvas has no WebGL context by default — the real, unmocked path.
    renderEffect();
    expect(screen.getByText(copy.fr.fallback)).toBeInTheDocument();
    expect(screen.queryByTestId("attrape-moi-stage")).not.toBeInTheDocument();
  });

  // @req REQ-037
  it("shows the text fallback when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    renderEffect();
    expect(screen.getByText(copy.fr.fallback)).toBeInTheDocument();
  });

  // @req REQ-037
  it("mounts the canvas, the catchable ball and the keyboard instructions", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    renderEffect();

    expect(screen.getByTestId("attrape-moi-stage").querySelector("canvas")).not.toBeNull();
    expect(screen.getByRole("button", { name: copy.fr.ball })).toBeInTheDocument();
    const stage = screen.getByRole("group", { name: copy.fr.ariaLabel });
    expect(stage).toHaveAttribute("aria-describedby", "attrape-moi-instructions");
    expect(screen.getByText(copy.fr.instructions)).toBeInTheDocument();
  });

  // @req REQ-037
  it("returns the ball to its spawn point when the reset button is clicked", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    renderEffect();
    const ball = screen.getByRole("button", { name: copy.fr.ball });
    const spawn = ball.style.transform;
    const renderFrame = (renderers[0].setAnimationLoop as unknown as Mock).mock
      .calls[0][0] as () => void;

    for (let frame = 0; frame < 30; frame += 1) renderFrame();
    await waitFor(() => expect(ball.style.transform).not.toBe(spawn));

    fireEvent.click(screen.getByRole("button", { name: copy.fr.reset }));

    expect(ball.style.transform).toBe(spawn);
  });

  // @req REQ-037
  it("recolors the stage frame and the ball from the theme picker", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    renderEffect();
    fireEvent.click(screen.getByRole("button", { name: "Couleurs" }));
    const backdrops = within(screen.getByRole("group", { name: "Fond du stage" }));
    fireEvent.click(backdrops.getByRole("button", { name: "Ink" }));

    const stageWrapper = screen.getByTestId("attrape-moi-stage").parentElement!;
    expect(stageWrapper.style.backgroundColor).toBe("var(--color-ink)");
    // On an ink backdrop with the chrome logo, the flat ball takes the first flat
    // pairing: lemon.
    const ball = screen.getByRole("button", { name: copy.fr.ball });
    expect(ball.style.backgroundColor).toBe("var(--color-lemon)");

    // And a logo pick actually reaches the rig material, not just the callback.
    const logos = within(screen.getByRole("group", { name: "Couleur du logo" }));
    fireEvent.click(logos.getByRole("button", { name: "Tangerine" }));
    expect(tintedHexes).toContain("#ff5200");
  });

  // @req REQ-043
  it("lets a keyboard user catch the ball from the button itself", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );

    renderEffect();
    // fireEvent.click carries detail 0, exactly how a keyboard activation lands.
    fireEvent.click(screen.getByRole("button", { name: copy.fr.ball }));

    expect(isChallengeUnlocked("attrape-moi")).toBe(true);
  });

  // @req REQ-037
  it("cleans up every listener and stops the render loop on unmount (no leaks)", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as unknown as RenderingContext,
    );
    const windowAddSpy = vi.spyOn(window, "addEventListener");
    const windowRemoveSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderEffect();
    const renderer = renderers[0];
    unmount();

    expect((renderer.setAnimationLoop as unknown as Mock).mock.lastCall).toEqual([null]);

    const addedOnWindow = windowAddSpy.mock.calls.map(([type]) => type);
    const removedFromWindow = windowRemoveSpy.mock.calls.map(([type]) => type);
    for (const type of addedOnWindow) {
      expect(removedFromWindow).toContain(type);
    }
  });
});
