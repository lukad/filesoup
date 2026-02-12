import { Router, Route, Routes } from "@solidjs/router";
import Seed from "./Seed";
import Leech from "./Leech";
import { ToastContainer } from "./Toast";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<Seed />} />
          <Route path="/:id" element={<Leech />} />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
}

export default App;
