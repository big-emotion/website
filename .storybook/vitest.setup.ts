import { beforeAll } from "vitest";
import { setProjectAnnotations } from "@storybook/nextjs";
import * as previewAnnotations from "./preview";

const annotations = setProjectAnnotations([previewAnnotations]);

beforeAll(annotations.beforeAll);
