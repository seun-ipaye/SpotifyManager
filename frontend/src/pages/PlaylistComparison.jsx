import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function ComparisonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlaylists = location.state?.selectedPlaylists || [];
  const [playlists, setPlaylists] = useState(selectedPlaylists);
  const [selectedSong, setSelectedSong] = useState(null);

  return (
    <div>
      <BackButton />
      comparison
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "4rem",
          marginTop: "2rem",
        }}
      >
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            style={{
              textAlign: "center",
              width: "500px",
              border: "1px solid #333",
              borderRadius: "10px",
              padding: "1rem",
            }}
          >
            <img
              src={playlist.images?.[0]?.url || "/placeholder.png"}
              alt={playlist.name}
              style={{
                width: "250px",
                height: "250px",
                objectFit: "cover",
                borderRadius: "10px",
                justifySelf: "center",
              }}
            />
            <h2 style={{ marginTop: "1rem" }}>{playlist.name}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComparisonPage;
