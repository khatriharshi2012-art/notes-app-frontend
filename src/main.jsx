import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { FeedbackProvider } from "./components/FeedbackProvider.jsx";
import "./index.css";

createRoot(document.getElementById('root')).render(
  <FeedbackProvider>
    <App />
  </FeedbackProvider>,
);
