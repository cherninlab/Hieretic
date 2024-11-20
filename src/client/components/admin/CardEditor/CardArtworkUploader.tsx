import React, { useCallback, useState } from 'react';
import styles from './CardEditor.module.css';

interface CardArtworkUploaderProps {
  artwork?: string;
  onChange: (file: File) => void;
}

export function CardArtworkUploader({ artwork, onChange }: CardArtworkUploaderProps) {
  const [preview, setPreview] = useState<string | null>(artwork || null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = useCallback(
    (file: File) => {
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
        onChange(file);
      }
    },
    [onChange],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileChange(file);
    },
    [handleFileChange],
  );

  return (
    <div className={styles.artworkUploaderSection}>
      <h4>Card Artwork</h4>
      <div
        className={`${styles.artworkDropzone} ${isDragging ? styles.dragging : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {preview ? (
          <div className={styles.artworkPreviewContainer}>
            <img src={preview} alt="Card artwork" className={styles.artworkPreview} />
            <div className={styles.artworkOverlay}>
              <span>Drop new image or click to change</span>
            </div>
          </div>
        ) : (
          <div className={styles.artworkPlaceholder}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span>Drop image here or click to upload</span>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          className={styles.artworkInput}
        />
      </div>
    </div>
  );
}
