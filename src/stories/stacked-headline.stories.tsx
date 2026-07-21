import type { Meta, StoryObj } from "@storybook/nextjs";
import { StackedHeadline } from "@/components/stacked-headline";

const meta: Meta<typeof StackedHeadline> = {
  title: "Typography/StackedHeadline",
  component: StackedHeadline,
};

export default meta;
type Story = StoryObj<typeof StackedHeadline>;

export const Default: Story = {
  args: {
    lines: ["Derriere", "chaque clic,", "une emotion"],
    as: "h1",
    className: "font-display text-4xl md:text-6xl",
  },
};
