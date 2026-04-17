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
  const [selectedSong, setSelectedSong] = useState(null);
  const [tracks, setTracks] = useState({});

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

  useEffect(() => {
    fetchTracks();

    console.log(" playlists", playlists);
    // console.log("tracks", tracks);
  }, []);

  useEffect(() => {
    console.log("tracks", tracks);
  }, [tracks]);

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
              borderColor: didUserMakeThis(playlist) ? "yellow" : "grey",
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
            <div>
              {tracks[playlist.id]?.length > 0 ? (
                tracks[playlist.id].map((track) => (
                  <div
                    key={track.item.id}
                    style={{
                      textAlign: "center",
                      width: "500px",
                      border: "1px solid #333",
                      borderRadius: "10px",
                      padding: "1rem",
                    }}
                  >
                    <h3 style={{ marginTop: "1rem" }}>{track.item.name}</h3>
                    <img
                      src={
                        track.item.album.images?.[0]?.url || "/placeholder.png"
                      }
                      alt={track.track.name}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "5px",
                      }}
                    />
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "#b3b3b3",
                        margin: 0,
                      }}
                    >
                      {track.item.artists
                        .map((artist) => artist.name)
                        .join(", ")}
                    </p>
                  </div>
                ))
              ) : (
                <div>hi</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ComparisonPage;
