import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import * as BUI from "@thatopen/ui"

BUI.Manager.init();

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "bim-label": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        icon?: string;
      };
    }
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
