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
    (Story, { parameters }) => {
      const locale = (parameters.locale as "fr" | "en") ?? "fr";
      return (
        <NextIntlClientProvider locale={locale} messages={messagesByLocale[locale]}>
          <Story />
        </NextIntlClientProvider>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof PersonalitySlider>;

export const French: Story = {
  parameters: { locale: "fr" },
};

export const English: Story = {
  parameters: { locale: "en" },
};
