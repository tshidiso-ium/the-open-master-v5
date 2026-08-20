import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const reactPath = fileURLToPath(new URL("./node_modules/react/index.js", import.meta.url));
const reactJsxRuntimePath = fileURLToPath(new URL("./node_modules/react/jsx-runtime.js", import.meta.url));
const reactJsxDevRuntimePath = fileURLToPath(new URL("./node_modules/react/jsx-dev-runtime.js", import.meta.url));
const reactDomPath = fileURLToPath(new URL("./node_modules/react-dom/index.js", import.meta.url));
const reactDomClientPath = fileURLToPath(new URL("./node_modules/react-dom/client.js", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^react$/, replacement: reactPath },
      { find: /^react\/jsx-runtime$/, replacement: reactJsxRuntimePath },
      { find: /^react\/jsx-dev-runtime$/, replacement: reactJsxDevRuntimePath },
      { find: /^react-dom$/, replacement: reactDomPath },
      { find: /^react-dom\/client$/, replacement: reactDomClientPath }
    ],
    dedupe: ["react", "react-dom"]
  },
  optimizeDeps: {
    force: true,
    include: ["react", "react/jsx-dev-runtime", "react-dom/client"]
  },
  server: {
    port: 5174
  }
});
