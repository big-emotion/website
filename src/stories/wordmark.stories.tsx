import type { Meta, StoryObj } from "@storybook/nextjs";
import { Wordmark } from "@/components/wordmark";

const meta: Meta<typeof Wordmark> = {
  title: "Brand/Wordmark",
  component: Wordmark,
};

export default meta;
type Story = StoryObj<typeof Wordmark>;

export const Stacked: Story = {
  args: { stacked: true },
};

export const Inline: Story = {
  args: { stacked: false },
};
