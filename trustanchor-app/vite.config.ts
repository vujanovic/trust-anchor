import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import config from "./src/config/config.json"
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: config.url,
        changeOrigin: true,
        secure: false,
      },
    },
    // https: {
    //   cert: fs.readFileSync('certs/localhost client.pem'),
    //   key: fs.readFileSync('certs/client.key'),
    //   passphrase: "sifra123"
    // },
  },
})
