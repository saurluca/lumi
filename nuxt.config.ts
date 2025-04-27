// https://nuxt.com/docs/api/configuration/nuxt-config

import tailwindcss from "@tailwindcss/vite";
export default defineNuxtConfig({
  compatibilityDate: "2025-01-23",
  future: { compatibilityVersion: 4 },
  modules: ["@nuxtjs/supabase", "@nuxt/ui"],
  devtools: { enabled: false },
  ssr: false,
  css: ["./app/assets/css/main.css"],
  ui: {
    prefix: 'U'
  },

  supabase: {
    redirect: true,
    exclude: ["/login", "/sign_up"],
  },

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  app: {
    head: {
      title: "Lumi",
    },
  },


})