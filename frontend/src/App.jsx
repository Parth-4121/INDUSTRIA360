import { BrowserRouter, Routes, Route } from "react-router-dom";
import SchemeMatching from "./pages/SchemeMatching";
import Analytics from "./pages/Analytics";
import AnalyticsRecords from "./pages/AnalyticsRecords";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div>
              <h1>UdyogSetu AI</h1>
              <p>
                Intelligent Industrial Approval & Compliance
                Management Platform
              </p>
            </div>
          }
        />

        <Route
          path="/analytics"
          element={<Analytics />}
        />

        <Route
  path="/analytics/records"
  element={<AnalyticsRecords />}
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
