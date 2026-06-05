import { envFrontend } from "./env-frontend";

export const siteConfig = {
  appName: envFrontend.NEXT_PUBLIC_APP_NAME,
  shortName: envFrontend.SHORT_NAME,
  description: envFrontend.DESCRIPTION,

  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",

  links: {
    instagram: "https://instagram.com/surb",
    whatsapp: "https://wa.me/5583999999999",
    email: "contato@surb.com.br",
  },
} as const;
