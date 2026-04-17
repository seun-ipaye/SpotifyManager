import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function PlaylistsPage() {
  const [playlists, setPlaylists] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedPlaylists, setSelectedPlaylists] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaylists();
    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      // console.log("User state updated:", user.display_name, user.id);
      // Do something with the updated user state
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/playlists`,
        {
          credentials: "include",
        },
      );

      const data = await response.json();
      // console.log("Playlists response from backend:", data.items);

      // make sure we always set an array
      const items = Array.isArray(data.items) ? data.items : [];
      setPlaylists(items);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setPlaylists([]); // keep it as an array so .map is safe
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user`, {
        credentials: "include",
      });

      const data = await response.json();
      // console.log("User:", data);
      setUser(data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  function didUserMakeThis(playlist) {
    const playlistOwner = playlist.owner.id;
    const userid = user.id;
    if (playlistOwner == userid) {
      return true;
    } else {
      return false;
    }
  }

  const handlePlaylistSelect = (playlist) => {
    if (selectedPlaylists.includes(playlist)) return;

    if (selectedPlaylists.length === 1) {
      setSelectedPlaylists([...selectedPlaylists, playlist]);
      setShowModal(true);
    } else {
      setSelectedPlaylists([playlist]);
    }
  };

  const confirmComparison = () => {
    navigate("/comparison", {
      state: {
        selectedPlaylists: selectedPlaylists,
        userdata: user,
      },
    });
  };

  const cancelComparison = () => {
    setSelectedPlaylists([]);
    setShowModal(false);
  };

  return (
    <div>
      <BackButton />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "1rem",
        }}
      >
        {Array.isArray(playlists) && playlists.length > 0 ? (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handlePlaylistSelect(playlist)}
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1rem",
                border: selectedPlaylists.includes(playlist)
                  ? "2px solid #1DB954"
                  : "1px solid #e2e8f0",
                borderRadius: "0.5rem",
                cursor: "pointer",
                backgroundColor: didUserMakeThis(playlist)
                  ? "rgb(15, 15, 15)"
                  : "red",
              }}
            >
              <img
                src={playlist.images?.[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                style={{
                  width: "100%",
                  aspectRatio: "1 / 1",
                  objectFit: "cover",
                  marginBottom: "0.5rem",
                }}
              />
              <h3
                style={{
                  fontWeight: "bold",
                  marginBottom: "0.25rem",
                  color: "white",
                }}
              >
                {playlist.name}
              </h3>
              <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                {playlist.tracks?.total ?? 0} tracks
              </p>
            </div>
          ))
        ) : (
          <p style={{ color: "#64748b" }}>
            {Array.isArray(playlists)
              ? "No playlists found."
              : "Loading playlists..."}
          </p>
        )}
        {showModal && selectedPlaylists.length === 2 && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "#222",
              padding: "2rem",
              borderRadius: "0.5rem",
              textAlign: "center",
              zIndex: 1000,
            }}
          >
            <h3 style={{ color: "white", marginBottom: "1rem" }}>
              Do you want to compare "{selectedPlaylists[0].name}" and "
              {selectedPlaylists[1].name}"?
            </h3>
            <button
              onClick={confirmComparison}
              style={{
                backgroundColor: "#1DB954",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                cursor: "pointer",
                marginRight: "1rem",
              }}
            >
              Confirm
            </button>
            <button
              onClick={cancelComparison}
              style={{
                backgroundColor: "red",
                color: "white",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlaylistsPage;
