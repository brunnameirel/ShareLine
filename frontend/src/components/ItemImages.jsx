import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL;

export default function ListingImage({ objectKey, alt }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!objectKey) return;

    fetch(`${API}/uploads/display-url?object_key=${encodeURIComponent(objectKey)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => setUrl(data.url))
      .catch(() => setUrl(null));
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
        height: '180px',
        objectFit: 'cover',
        borderRadius: '12px',
      }}
    />
  );
}