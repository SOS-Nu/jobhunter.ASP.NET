import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig, loadEnv } from "vite";
// import { visualizer } from "rollup-plugin-visualizer";
import vue from "@vitejs/plugin-vue";
import dns from "dns";

//running on localhost instead of IP 127.0.0.1
dns.setDefaultResultOrder("verbatim");

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [
      react(),
      vue(),
      // visualizer() as PluginOption
    ],
    define: {
      global: "window", // Thay thế global bằng window trong trình duyệt
    },
    server: {
      port: parseInt(env.PORT),
      host: "0.0.0.0",
      allowedHosts: [
        "b212-2001-ee1-e605-7460-49e0-1317-1fb2-d762.ngrok-free.app",
      ],
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src/"),
        components: `${path.resolve(__dirname, "./src/components/")}`,
        styles: `${path.resolve(__dirname, "./src/styles/")}`,
        config: `${path.resolve(__dirname, "./src/config/")}`,
        pages: `${path.resolve(__dirname, "./src/pages/")}`,
        assets: `${path.resolve(__dirname, "./src/assets/")}`,
        helpers: `${path.resolve(__dirname, "./src/helpers/")}`,
      },
    },
    assetsInclude: ["**/*.xlsx", "**/*.csv"],
    build: {
      target: "esnext",
      minify: "esbuild",
      sourcemap: false,
      reportCompressedSize: false, // Tắt báo cáo dung lượng để tiết kiệm RAM
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        maxParallelFileOps: 2,
        output: {
          manualChunks: {
            vendor: [
              "react",
              "react-dom",
              "react-router-dom",
              "antd",
              "@ant-design/icons",
            ],
            vue_lib: ["vue", "i18next-vue"],
            utils: ["lodash", "dayjs", "axios"],
            charts: ["chart.js", "react-chartjs-2"],
          },
        },
      },
    },
  };
});
