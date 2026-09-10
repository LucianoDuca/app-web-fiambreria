import { createRoot } from "react-dom/client";
import App from "./App";
import "./App.css";

// Sin StrictMode a propósito: evita el doble montaje en desarrollo, que con la
// cámara del escáner puede dejar dos streams abiertos.
createRoot(document.getElementById("root")!).render(<App />);
