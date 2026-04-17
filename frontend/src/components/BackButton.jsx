import React from "react";
import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        padding: "10px 16px",
        backgroundColor: "#1DB954",
        color: "white",
        border: "none",
        borderRadius: "999px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
      }}
    >
      ←
    </button>
  );
}

export default BackButton;
