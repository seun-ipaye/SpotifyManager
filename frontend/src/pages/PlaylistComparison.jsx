import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import didUserMakeThis from "./PlaylistsPage";

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

  const isDuplicate = targetTracks.some(t => t.track.uri === songURI);

  if (isDuplicate) {
    alert("This song is already in this playlist!");
    return;
  }

  // 1. Frontend Ownership Check (Optional but good)
  // Find the target playlist in your state
  const targetPlaylist = playlists.find(p => p.id === targetPlaylistId);
  if (!didUserMakeThis(targetPlaylist)) {
    alert("You can't add songs to a playlist you don't own!");
    return;
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/playlists/${targetPlaylistId}/add_track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ track_uri: songURI }), // matches your TrackAdd Pydantic model
      credentials: "include", // Essential for the access_token cookie!
    });

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
    <div style={{ backgroundColor: "#121212", minHeight: "100vh", color: "white", padding: "2rem" }}>
      <BackButton />
      <div onClick={() => setDeleteMode(!deleteMode)} style={{backgroundColor: "orange"}}>
        Click me to delete mode
      </div>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>Playlist Comparison</h1>
      
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            style={{
              width: "450px",
              backgroundColor: "#181818",
              borderRadius: "12px",
              padding: "1.5rem",
              border: "1px solid",
              borderColor: didUserMakeThis(playlist) ? "#1DB954" : "#333", // Green for yours, grey for others
            }}
            onDrop={(e) => handleDrop(e, playlist.id)}
            onDragOver={handleDragOver}
          >
            {/* Header Section */}
            <div style={{ textAlign: "center", marginBottom: "2rem" }}>
              <img
                src={playlist.images?.[0]?.url || "/placeholder.png"}
                alt={playlist.name}
                style={{
                  width: "180px",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                }}
              />
              <h2 style={{ marginTop: "1rem", fontSize: "1.5rem" }}>{playlist.name}</h2>
              <p style={{ color: "#b3b3b3" }}>{tracks[playlist.id]?.length || 0} songs</p>
            </div>
  
            {/* Tracks List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {tracks[playlist.id]?.length > 0 ? (
                tracks[playlist.id].map((track) => (
                  <div
                    key={track.item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      padding: "0.5rem",
                      borderRadius: "6px",
                      border:
                        selectedTrack?.item.id === track.item.id
                          ? "2px solid green"
                          : "none",
                      backgroundColor: "rgba(255, 255, 255, 0.05)",
                      position: "relative"
                    }}
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
                        style={{
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
                          fontWeight: "bold"
                        }}
                      >
                        ✕
                      </div>
                    )}
                    <img
                      src={track.item.album.images?.[2]?.url || track.item.album.images?.[0]?.url || "/placeholder.png"}
                      alt={track.item.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "4px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ overflow: "hidden" }}>
                      <h4
                        style={{
                          margin: 0,
                          fontSize: "0.95rem",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {track.item.name}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.8rem",
                          color: "#b3b3b3",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {track.item.artists.map((a) => a.name).join(", ")}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "#666" }}>No tracks loaded...</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComparisonPage;
