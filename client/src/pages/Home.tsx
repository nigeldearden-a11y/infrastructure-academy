import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    window.location.href = "/site.html";
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a1628",
        color: "#ffd700",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          INFRASTRUCTURE ACADEMY
        </h1>
        <p style={{ color: "#ffffff" }}>Loading...</p>
      </div>
    </div>
  );
}
