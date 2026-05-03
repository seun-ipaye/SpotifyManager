// PlaylistComparison.js

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import BackButton from "../components/BackButton";
import { FaCopy, FaCut, FaTrash } from "react-icons/fa";

function PlaylistComparison() {
  const location = useLocation();
  const selectedPlaylists = location.state?.selectedPlaylists || [];
  const user = location.state?.userdata || null;

  const [playlists] = useState(selectedPlaylists);
  const [tracks, setTracks] = useState({});
  const [selectedTrack, setSelectedTrack] = useState(null);

  const [copyMode, setCopyMode] = useState(false);
  const [cutMode, setCutMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const ownedPlaylists = playlists.filter((playlist) =>
    didUserMakeThis(playlist),
  );

  const hasAtLeastOneOwnedPlaylist = ownedPlaylists.length > 0;
  const doesUserOwnAllPlaylists =
    playlists.length > 0 && ownedPlaylists.length === playlists.length;

  function didUserMakeThis(playlist) {
    return playlist?.owner?.id === user?.id;
  }

  const activateCopyMode = () => {
    if (!hasAtLeastOneOwnedPlaylist) return;

    setCopyMode(true);
    setCutMode(false);
    setDeleteMode(false);
  };

  const activateCutMode = () => {
    if (!doesUserOwnAllPlaylists) return;

    setCopyMode(false);
    setCutMode(true);
    setDeleteMode(false);
  };

  const activateDeleteMode = () => {
    if (!hasAtLeastOneOwnedPlaylist) return;

    setCopyMode(false);
    setCutMode(false);
    setDeleteMode(true);
  };

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
        trackData[playlist.id] = data.items || [];
      } catch (error) {
        console.error("Error fetching tracks:", error);
        trackData[playlist.id] = [];
      }
    }

    setTracks(trackData);
  };

  const handleSongClick = (song) => {
    setSelectedTrack(song);
  };

  const handleDragStart = (e, song, sourcePlaylistId) => {
    e.dataTransfer.setData("songURI", song?.item?.uri);
    e.dataTransfer.setData("sourcePlaylistId", sourcePlaylistId);
    e.target.style.border = "2px solid green";
  };

  const handleDragEnd = (e) => {
    e.target.style.border = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const addTrackToPlaylist = async (playlistId, trackUri) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/playlists/${playlistId}/add_track`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_uri: trackUri }),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to add track.");
    }

    return response.json();
  };

  const deleteTrackFromPlaylist = async (playlistId, trackUri) => {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/playlists/${playlistId}/delete_track`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track_uri: trackUri }),
        credentials: "include",
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete track.");
    }

    return response.json();
  };

  const handleDrop = async (e, targetPlaylistId) => {
    e.preventDefault();

    const songURI = e.dataTransfer.getData("songURI");
    const sourcePlaylistId = e.dataTransfer.getData("sourcePlaylistId");

    if (!songURI || !sourcePlaylistId) return;

    if (sourcePlaylistId === targetPlaylistId) {
      return;
    }

    const sourcePlaylist = playlists.find((p) => p.id === sourcePlaylistId);
    const targetPlaylist = playlists.find((p) => p.id === targetPlaylistId);

    if (!didUserMakeThis(targetPlaylist)) {
      alert("You can't add songs to a playlist you don't own!");
      return;
    }

    if (cutMode && !didUserMakeThis(sourcePlaylist)) {
      alert("You can't cut songs from a playlist you don't own!");
      return;
    }

    const targetTracks = tracks[targetPlaylistId] || [];
    const isDuplicate = targetTracks.some((t) => t.item.uri === songURI);

    if (isDuplicate) {
      alert("This song is already in this playlist!");
      return;
    }

    try {
      await addTrackToPlaylist(targetPlaylistId, songURI);

      if (cutMode) {
        await deleteTrackFromPlaylist(sourcePlaylistId, songURI);
      }

      fetchTracks();
    } catch (error) {
      console.error("Drop failed:", error);
      alert(error.message || "Something went wrong.");
    }
  };

  const openDeleteModal = (track, playlist) => {
    setDeleteTarget({
      track,
      playlistId: playlist.id,
      playlistName: playlist.name,
    });
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const { track, playlistId } = deleteTarget;
    const playlist = playlists.find((p) => p.id === playlistId);

    if (!didUserMakeThis(playlist)) {
      alert("You can't delete songs from a playlist you don't own!");
      closeDeleteModal();
      return;
    }

    const trackUri = track.item.uri;

    try {
      await deleteTrackFromPlaylist(playlistId, trackUri);

      setTracks((prevTracks) => ({
        ...prevTracks,
        [playlistId]: prevTracks[playlistId].filter(
          (t) => t.item.uri !== trackUri,
        ),
      }));

      if (selectedTrack?.item?.uri === trackUri) {
        setSelectedTrack(null);
      }

      closeDeleteModal();
    } catch (error) {
      console.error("Failed to delete track:", error);
      alert(error.message || "Failed to delete track. Please try again.");
    }
  };

  useEffect(() => {
    fetchTracks();
    if (hasAtLeastOneOwnedPlaylist) {
      setCopyMode(true);
    }
  }, [hasAtLeastOneOwnedPlaylist]);

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div style={styles.topBarLeft}>
          <BackButton />
        </div>

        <div style={styles.topBarCenter}>
          <h1 style={styles.title}>Playlist Comparison</h1>
        </div>

        <div style={styles.topBarRight}>
          <button
            onClick={activateCopyMode}
            style={styles.modeButton(
              copyMode,
              "#1DB954",
              !hasAtLeastOneOwnedPlaylist,
            )}
            title={
              hasAtLeastOneOwnedPlaylist
                ? "Copy mode"
                : "You don't own any of these playlists"
            }
            disabled={!hasAtLeastOneOwnedPlaylist}
          >
            <FaCopy />
          </button>

          <button
            onClick={activateCutMode}
            style={styles.modeButton(
              cutMode,
              "#facc15",
              !doesUserOwnAllPlaylists,
            )}
            title={
              doesUserOwnAllPlaylists
                ? "Cut mode"
                : "You must own all selected playlists to use cut mode"
            }
            disabled={!doesUserOwnAllPlaylists}
          >
            <FaCut />
          </button>

          <button
            onClick={activateDeleteMode}
            style={styles.modeButton(
              deleteMode,
              "#ef4444",
              !hasAtLeastOneOwnedPlaylist,
            )}
            title={
              hasAtLeastOneOwnedPlaylist
                ? "Delete mode"
                : "You don't own any of these playlists"
            }
            disabled={!hasAtLeastOneOwnedPlaylist}
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <div style={styles.playlistsWrapper}>
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            style={styles.playlistCard(didUserMakeThis(playlist))}
            onDrop={(e) => handleDrop(e, playlist.id)}
            onDragOver={handleDragOver}
          >
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

            <div style={styles.tracksList}>
              {tracks[playlist.id]?.length > 0 ? (
                tracks[playlist.id].map((track) => (
                  <div
                    key={`${playlist.id}-${track.item.id}`}
                    style={styles.trackRow(
                      selectedTrack?.item?.id === track.item.id,
                    )}
                    onClick={() => handleSongClick(track)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, track, playlist.id)}
                    onDragEnd={handleDragEnd}
                  >
                    {deleteMode && didUserMakeThis(playlist) && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(track, playlist);
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

      {deleteTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h2 style={styles.modalTitle}>Delete Song?</h2>

            <p style={styles.modalText}>
              Are you sure you want to remove{" "}
              <strong>{deleteTarget.track?.item?.name}</strong> from{" "}
              <strong>{deleteTarget.playlistName}</strong>?
            </p>

            <div style={styles.modalButtons}>
              <button onClick={closeDeleteModal} style={styles.cancelButton}>
                Go back
              </button>

              <button onClick={handleDelete} style={styles.confirmDeleteButton}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#000",
    color: "#fff",
    padding: "24px 32px 40px",
  },

  topBar: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    marginBottom: "32px",
  },

  topBarLeft: {
    display: "flex",
    justifyContent: "flex-start",
  },

  topBarCenter: {
    display: "flex",
    justifyContent: "center",
  },

  topBarRight: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },

  title: {
    fontSize: "32px",
    fontWeight: "800",
    margin: 0,
  },

  modeButton: (active, color, disabled = false) => ({
    width: active ? "48px" : "40px",
    height: active ? "48px" : "40px",
    borderRadius: "50%",
    border: `2px solid ${disabled ? "#555" : color}`,
    backgroundColor: disabled ? "#222" : active ? color : "transparent",
    color: disabled ? "#777" : "#fff",
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: active ? "20px" : "16px",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.45 : 1,
  }),

  playlistsWrapper: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "40px",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "0 12px",
    alignItems: "start",
  },

  playlistCard: (ownedByUser) => ({
    backgroundColor: "#121212",
    border: ownedByUser ? "1px solid #1DB954" : "1px solid #333",
    borderRadius: "16px",
    padding: "20px",
    minHeight: "600px",
  }),

  headerSection: {
    textAlign: "center",
    marginBottom: "20px",
  },

  playlistImage: {
    width: "180px",
    height: "180px",
    objectFit: "cover",
    borderRadius: "8px",
  },

  playlistTitle: {
    fontSize: "22px",
    fontWeight: "700",
    marginTop: "12px",
    marginBottom: "6px",
  },

  songCount: {
    color: "#b3b3b3",
    margin: 0,
  },

  tracksList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "450px",
    overflowY: "auto",
    paddingRight: "4px",
  },

  trackRow: (selected) => ({
    position: "relative",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: selected ? "#1f2937" : "#181818",
    border: selected ? "1px solid #1DB954" : "1px solid transparent",
    borderRadius: "10px",
    padding: "10px 14px",
    cursor: "pointer",
    transition: "all 0.2s ease",
  }),

  deleteButton: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    backgroundColor: "#ef4444",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "900",
    cursor: "pointer",
    border: "2px solid #fff",
    zIndex: 2,
  },

  trackImage: {
    width: "48px",
    height: "48px",
    objectFit: "cover",
    borderRadius: "6px",
  },

  trackInfo: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },

  trackName: {
    fontSize: "15px",
    fontWeight: "700",
    margin: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    textAlign: "center",
  },

  artistNames: {
    fontSize: "13px",
    color: "#b3b3b3",
    margin: "4px 0 0",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    textAlign: "center",
  },

  emptyState: {
    color: "#b3b3b3",
    textAlign: "center",
    fontStyle: "italic",
  },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },

  modalBox: {
    backgroundColor: "#121212",
    border: "1px solid #333",
    borderRadius: "16px",
    padding: "28px",
    width: "90%",
    maxWidth: "420px",
    textAlign: "center",
    boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
  },

  modalTitle: {
    color: "#fff",
    fontSize: "24px",
    marginBottom: "12px",
  },

  modalText: {
    color: "#d1d5db",
    fontSize: "16px",
    lineHeight: "1.5",
    marginBottom: "24px",
  },

  modalButtons: {
    display: "flex",
    gap: "12px",
    justifyContent: "center",
  },

  cancelButton: {
    backgroundColor: "#333",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "700",
  },

  confirmDeleteButton: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: "999px",
    padding: "10px 20px",
    cursor: "pointer",
    fontWeight: "700",
  },
};

export default PlaylistComparison;
