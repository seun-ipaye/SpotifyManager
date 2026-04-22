import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";

function ComparisonPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlaylists = location.state?.selectedPlaylists || [];
  const user = location.state?.userdata || null; // if user is null prolly go back to front page

  const [playlists, setPlaylists] = useState(selectedPlaylists);
  const [tracks, setTracks] = useState({});
  const [selectedTrack, setSelectedTrack] = useState(null);

  const [copyMode, setCopyMode] = useState(true);
  const [cutMode, setCutMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  function didUserMakeThis(playlist) {
    const playlistOwner = playlist.owner.id;
    const userid = user.id;
    if (playlistOwner == userid) {
      return true;
    } else {
      return false;
    }
  }

  const fetchTracks = async () => {
    const trackData = {};
    for (const playlist of selectedPlaylists) {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/playlist/${playlist.id}/tracks`,
          {
            credentials: "include",
          },
        );

        const data = await response.json();
        // console.log("tracks", data.items);
        trackData[playlist.id] = data.items || [];
      } catch (error) {
        console.error("Error fetching playlists:", error);
      }
    }

    setTracks(trackData);
  };

  const handleSongClick = (song) => {
    setSelectedTrack(song);
  };

  const handleDragStart = (e, song) => {
    e.dataTransfer.setData("songURI", song?.track.uri);
    e.target.style.border = "2px solid green";
  };

  const handleDragEnd = (e) => {
    e.target.style.border = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetPlaylistId) => {
    e.preventDefault();
    const songURI = e.dataTransfer.getData("songURI");

    if (!songURI) return;

    const targetTracks = tracks[targetPlaylistId] || [];

    const isDuplicate = targetTracks.some((t) => t.track.uri === songURI);

    if (isDuplicate) {
      alert("This song is already in this playlist!");
      return;
    }

    // 1. Frontend Ownership Check (Optional but good)
    // Find the target playlist in your state
    const targetPlaylist = playlists.find((p) => p.id === targetPlaylistId);
    if (!didUserMakeThis(targetPlaylist)) {
      alert("You can't add songs to a playlist you don't own!");
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/playlists/${targetPlaylistId}/add_track`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ track_uri: songURI }), // matches your TrackAdd Pydantic model
          credentials: "include", // Essential for the access_token cookie!
        },
      );

      if (response.ok) {
        console.log("Success!");
        // 2. Refresh the tracks so the new song appears
        fetchTracks();
      } else {
        const error = await response.json();
        console.error("Backend error:", error.detail);
      }
    } catch (err) {
      console.error("Failed to move song:", err);
    }
  };

  useEffect(() => {
    fetchTracks();

    console.log(" playlists", playlists);
    // console.log("tracks", tracks);
  }, []);

  return (
    <div style={styles.page}>
      <BackButton />
      <div
        onClick={() => setDeleteMode(!deleteMode)}
        style={styles.deleteModeToggle}
      >
        Click me to delete mode
      </div>
      <h1 style={styles.title}>Playlist Comparison</h1>

      <div style={styles.playlistsWrapper}>
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            style={styles.playlistCard(didUserMakeThis(playlist))}
            onDrop={(e) => handleDrop(e, playlist.id)}
            onDragOver={handleDragOver}
          >
            {/* Header Section */}
            <div style={styles.headerSection}>
              <img
                src={playlist.images?.[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                style={styles.playlistImage}
              />
              <h2 style={styles.playlistTitle}>{playlist.name}</h2>
              <p style={styles.songCount}>
                {tracks[playlist.id]?.length || 0} songs
              </p>
            </div>

            {/* Tracks List */}
            <div style={styles.tracksList}>
              {tracks[playlist.id]?.length > 0 ? (
                tracks[playlist.id].map((track) => (
                  <div
                    key={track.item.id}
                    style={styles.trackRow(
                      selectedTrack?.item.id === track.item.id,
                    )}
                    onClick={(e) => handleSongClick(track)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, track)}
                    onDragEnd={handleDragEnd}
                  >
                    {deleteMode && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          //handleDelete(track, playlist.id);
                        }}
                        style={styles.deleteButton}
                      >
                        ✕
                      </div>
                    )}
                    <img
                      src={
                        track.item.album.images?.[2]?.url ||
                        track.item.album.images?.[0]?.url ||
                        "/placeholder.png"
                      }
                      alt={track.item.name}
                      style={styles.trackImage}
                    />
                    <div style={styles.trackInfo}>
                      <h4 style={styles.trackName}>{track.item.name}</h4>
                      <p style={styles.artistNames}>
                        {track.item.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={styles.emptyState}>No tracks loaded...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: "#121212",
    minHeight: "100vh",
    color: "white",
    padding: "2rem",
  },

  deleteModeToggle: {
    backgroundColor: "orange",
  },

  title: {
    textAlign: "center",
    marginBottom: "2rem",
  },

  playlistsWrapper: {
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    alignItems: "flex-start",
  },

  playlistCard: (isOwner) => ({
    width: "450px",
    backgroundColor: "#181818",
    borderRadius: "12px",
    padding: "1.5rem",
    border: "1px solid",
    borderColor: isOwner ? "#1DB954" : "#333",
  }),

  headerSection: {
    textAlign: "center",
    marginBottom: "2rem",
  },

  playlistImage: {
    width: "180px",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
  },

  playlistTitle: {
    marginTop: "1rem",
    fontSize: "1.5rem",
  },

  songCount: {
    color: "#b3b3b3",
  },

  tracksList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },

  trackRow: (isSelected) => ({
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    padding: "0.5rem",
    borderRadius: "6px",
    border: isSelected ? "2px solid green" : "none",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    position: "relative",
  }),

  deleteButton: {
    position: "absolute",
    right: "10px",
    backgroundColor: "#ff4444",
    color: "white",
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    zIndex: 20,
    fontWeight: "bold",
  },

  trackImage: {
    width: "50px",
    height: "50px",
    borderRadius: "4px",
    flexShrink: 0,
  },

  trackInfo: {
    overflow: "hidden",
  },

  trackName: {
    margin: 0,
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  artistNames: {
    margin: 0,
    fontSize: "0.8rem",
    color: "#b3b3b3",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },

  emptyState: {
    textAlign: "center",
    color: "#666",
  },
};

export default ComparisonPage;
