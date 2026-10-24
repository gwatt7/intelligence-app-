import { Barlow_Condensed, Inter } from "next/font/google";

// Dashboard-only fonts, matching the reference design: a condensed athletic
// display face for headings/numbers and Inter for body text. Exposed as CSS
// variables so they apply only where the dashboard adds these classes.
export const dashDisplayFont = Barlow_Condensed({
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-dash-display",
});

export const dashBodyFont = Inter({
  subsets: ["latin"],
  variable: "--font-dash-body",
});

export const dashFontVars = `${dashDisplayFont.variable} ${dashBodyFont.variable}`;
