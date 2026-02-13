import { Router, Route, Routes } from "@solidjs/router";
import Seed from "./Seed";
import Leech from "./Leech";
import { ToastProvider } from "./Toast";

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Seed />} />
          <Route path="/:id" element={<Leech />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
