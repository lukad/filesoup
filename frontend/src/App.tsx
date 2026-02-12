import { Router, Route, Routes } from "@solidjs/router";
import Seed from "./Seed";
import Leech from "./Leech";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Seed />} />
        <Route path="/:id" element={<Leech />} />
      </Routes>
    </Router>
  );
}

export default App;
