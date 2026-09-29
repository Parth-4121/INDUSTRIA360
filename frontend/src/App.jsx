import { BrowserRouter, Routes, Route } from "react-router-dom";
import SchemeMatching from "./pages/SchemeMatching";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>INDUSTRIA360</h1>
              <p>
                Intelligent Industrial Approval & Compliance
                Management Platform
              </p>
            </div>
          }
        />

        <Route
          path="/projects/:projectId/schemes"
          element={<SchemeMatching />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;