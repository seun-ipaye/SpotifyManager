import { useState } from "react";

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  //     async function handleCreateRoom() {
  //     console.log("tryna create now");
  //     if (!eventName.trim()) {
  //       setError("Please enter an event name");
  //       return;
  //     }

  //     try {
  //       setLoading(true);
  //       setError("");

  //       const response = await fetch(
  //         `${import.meta.env.VITE_API_BASE_URL}/rooms`,
  //         {
  //           method: "POST",
  //           headers: {
  //             "Content-Type": "application/json",
  //           },
  //           body: JSON.stringify({
  //             title: eventName,
  //           }),
  //         },
  //       );

  //       if (!response.ok) {
  //         throw new Error("Failed to create room");
  //       }

  //       const room = await response.json();

  //       console.log("Created room:", room);

  //       navigate("/dashboard", { state: { room, roomID: room.id } });
  //     } catch (err) {
  //       setError(err.message || "Something went wrong");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "black",
        color: "white",
        textAlign: "center",
      }}
    >
      <h1
        style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        Edit Your Playlists!
      </h1>
      <p style={{ fontSize: "1.125rem", marginBottom: "1.5rem" }}>
        Easily modify your Spotify playlists
      </p>
      <button
        onClick={console.log("login")}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          backgroundColor: isHovered ? "green" : "white",
          color: isHovered ? "white" : "black",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          transition: "all 0.2s ease-in-out",
          padding: "0.5rem 1.5rem",
          border: "none",
          borderRadius: "0.5rem",
          cursor: isLoading ? "not-allowed" : "pointer",
          opacity: isLoading ? 0.5 : 1,
        }}
        disabled={isLoading}
      >
        {isLoading ? "Connecting..." : "Connect Your Spotify"}
      </button>
    </div>
  );
}
