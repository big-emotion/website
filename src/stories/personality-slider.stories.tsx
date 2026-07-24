import type { Meta, StoryObj } from "@storybook/nextjs";
import { NextIntlClientProvider } from "next-intl";
import { PersonalitySlider } from "@/components/personality-slider";
import fr from "../../messages/fr.json";
import en from "../../messages/en.json";

const messagesByLocale = { fr, en };

const meta: Meta<typeof PersonalitySlider> = {
  title: "Culture/PersonalitySlider",
  component: PersonalitySlider,
  decorators: [
    // The provider locale follows the story's own `locale` arg, so the UI messages and
    // the pole wording can never disagree about which language is on screen.
    (Story, { args }) => (
      <NextIntlClientProvider locale={args.locale} messages={messagesByLocale[args.locale]}>
        <Story />
      </NextIntlClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PersonalitySlider>;

export const French: Story = {
  args: { locale: "fr" },
};

export const English: Story = {
  args: { locale: "en" },
};
