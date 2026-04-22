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

      // make sure we always set an array
      const items = Array.isArray(data.items) ? data.items : [];
      setPlaylists(items);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setPlaylists([]);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/user`, {
        credentials: "include",
      });

      const data = await response.json();
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
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerSide}>
          <BackButton />
        </div>

        <div style={styles.headerCenter}>
          <h1 style={styles.headerTitle}>Playlists</h1>
        </div>

        <div style={styles.headerRight}>
          {/* {user ? (
            <div
              onClick={''}
              style={{ cursor: "pointer", position: "relative", group: "true" }}
              title="Click to Logout"
            >
              <img
                src={user.images?.[0]?.url || "https://via.placeholder.com/40"}
                alt="Profile"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "2px solid #333",
                  objectFit: "cover"
                }}
              />
            </div>
          ) : ( */}
          <div style={styles.placeholderProfile} />
          {/* )} */}
        </div>
      </div>

      <div style={styles.playlistGrid}>
        {Array.isArray(playlists) && playlists.length > 0 ? (
          playlists.map((playlist) => (
            <div
              key={playlist.id}
              onClick={() => handlePlaylistSelect(playlist)}
              style={styles.playlistCard(selectedPlaylists.includes(playlist))}
            >
              {!didUserMakeThis(playlist) && (
                <div
                  style={styles.lockIcon}
                  title="You don't own this playlist"
                >
                  🔒
                </div>
              )}

              <img
                src={playlist.images?.[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                style={styles.playlistImage}
              />

              <h3 style={styles.playlistName}>{playlist.name}</h3>

              <p style={styles.trackCount}>
                {playlist.tracks?.total ?? 0} tracks
              </p>
            </div>
          ))
        ) : (
          <p style={styles.emptyText}>
            {Array.isArray(playlists)
              ? "No playlists found."
              : "Loading playlists..."}
          </p>
        )}

        {showModal && selectedPlaylists.length === 2 && (
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>
              Do you want to compare "{selectedPlaylists[0].name}" and "
              {selectedPlaylists[1].name}"?
            </h3>

            <button onClick={confirmComparison} style={styles.confirmButton}>
              Confirm
            </button>

            <button onClick={cancelComparison} style={styles.cancelButton}>
              Go Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#121212",
    minHeight: "100vh",
  },

  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1rem 2rem",
    backgroundColor: "#121212",
    position: "sticky",
    top: 0,
    zIndex: 100,
    borderBottom: "1px solid #282828",
  },

  headerSide: {
    flex: 1,
  },

  headerCenter: {
    flex: 1,
    textAlign: "center",
  },

  headerTitle: {
    margin: 0,
    fontSize: "1.5rem",
    fontWeight: "bold",
    color: "white",
  },

  headerRight: {
    flex: 1,
    display: "flex",
    justifyContent: "flex-end",
  },

  placeholderProfile: {
    width: "40px",
  },

  playlistGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    padding: "1rem",
  },

  playlistCard: (isSelected) => ({
    display: "flex",
    flexDirection: "column",
    position: "relative",
    padding: "1rem",
    border: isSelected ? "2px solid #1DB954" : "1px solid #e2e8f0",
    borderRadius: "0.5rem",
    cursor: "pointer",
    backgroundColor: "rgb(15, 15, 15)",
  }),

  lockIcon: {
    position: "absolute",
    top: "1.5rem",
    right: "1.5rem",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: "50%",
    width: "30px",
    height: "30px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  playlistImage: {
    width: "100%",
    aspectRatio: "1 / 1",
    objectFit: "cover",
    marginBottom: "0.5rem",
  },

  playlistName: {
    fontWeight: "bold",
    marginBottom: "0.25rem",
    color: "white",
  },

  trackCount: {
    fontSize: "0.875rem",
    color: "#64748b",
  },

  emptyText: {
    color: "#64748b",
  },

  modal: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    background: "#222",
    padding: "2rem",
    borderRadius: "0.5rem",
    textAlign: "center",
    zIndex: 1000,
  },

  modalTitle: {
    color: "white",
    marginBottom: "1rem",
  },

  confirmButton: {
    backgroundColor: "#1DB954",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontWeight: "bold",
    cursor: "pointer",
    marginRight: "1rem",
  },

  cancelButton: {
    backgroundColor: "red",
    color: "white",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

export default PlaylistsPage;
