// client/src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import LandingPage from "./pages/LandingPage";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistComparison from "./pages/PlaylistComparison";

function App() {
  return (
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Routes>
          <Route path="/comparison" element={<PlaylistComparison />} />
          <Route path="/playlists" element={<PlaylistsPage />} />
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </Router>
    </DndProvider>
  );
}

export default App;
