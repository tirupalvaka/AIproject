import { useEffect, useState } from "react";

export default function TechnicalHealthFigma() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/figma-snapshot")
      .then((res) => res.json())
      .then((data) => {
        if (data.imageUrl) setImageUrl(data.imageUrl);
      })
      .catch(console.error);
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "1rem" }}>
      <h3>Technical Health (Figma)</h3>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Technical Health Dashboard"
          style={{ width: "80%", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }}
        />
      ) : (
        <p>Loading Figma dashboard...</p>
      )}
    </div>
  );
}

