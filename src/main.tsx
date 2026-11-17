import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./app/LanguageProvider";
import { ShortcutTooltipProvider } from "./components/ui/shortcut-tooltip";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LanguageProvider>
      <ShortcutTooltipProvider>
        <App />
      </ShortcutTooltipProvider>
    </LanguageProvider>
  </React.StrictMode>,
);
