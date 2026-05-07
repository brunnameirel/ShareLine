import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function ItemImage({ objectKey, alt, height = 200 }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!objectKey) return;

    fetch(`${API}/uploads/display-url?object_key=${encodeURIComponent(objectKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log("display url data:", data);
        setUrl(data.url)
      })
      .catch((err) => { 
        console.error("Image URL failed:", err);
        setUrl(null);
       });
  }, [objectKey]);

  if (!objectKey || !url) {
    return null;
  }

  return (
    <img
      src={url}
      alt={alt || 'Listing image'}
      style={{
        width: '100%',
        height,
        objectFit: 'cover',
        borderRadius: '12px',
      }}
    />
  );
}