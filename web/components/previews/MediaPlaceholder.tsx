"use client";

import { useState } from "react";
import { Cover, type CoverKind } from "../Cover";
import type { MediaItem, MediaAspectRatio } from "./types";
import { PlayIcon, VolumeIcon, HeartIcon } from "./SocialIcons";

type MediaPlaceholderProps = {
  media?: MediaItem[];
  aspectRatio?: MediaAspectRatio;
  altText?: string;
  interactive?: boolean;
  onDoubleTap?: () => void;
  className?: string;
  style?: React.CSSProperties;
};

const ASPECT_RATIO_STYLES: Record<MediaAspectRatio, string> = {
  "1:1": "1 / 1",
  "4:5": "4 / 5",
  "9:16": "9 / 16",
  "16:9": "16 / 9",
  "1.91:1": "1.91 / 1",
  auto: "auto",
};

export function MediaPlaceholder({
  media = [],
  aspectRatio = "1:1",
  altText = "Contenido multimedia de la publicación",
  interactive = true,
  onDoubleTap,
  className = "",
  style,
}: MediaPlaceholderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showHeartAnim, setShowHeartAnim] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const items: MediaItem[] =
    media.length > 0
      ? media
      : [
          {
            type: "cover",
            coverKind: "cup" as CoverKind,
            alt: altText,
          },
        ];

  const currentItem = items[activeIndex] ?? items[0];
  const isVideo = currentItem?.type === "video";
  const isCarousel = items.length > 1;

  // Derive aspect ratio: prop priority, then item preference
  const effectiveRatio = currentItem?.aspectRatio ?? aspectRatio;
  const ratioCss = ASPECT_RATIO_STYLES[effectiveRatio] || "1 / 1";

  function handleDoubleTap() {
    if (!interactive) return;
    setShowHeartAnim(true);
    setTimeout(() => setShowHeartAnim(false), 900);
    onDoubleTap?.();
  }

  function handlePrev(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  }

  function handleNext(e: React.MouseEvent) {
    e.stopPropagation();
    setActiveIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  }

  return (
    <div
      className={`media-placeholder-container ${className}`}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: ratioCss,
        backgroundColor: "#0d1b14",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        userSelect: "none",
        ...style,
      }}
      onDoubleClick={handleDoubleTap}
    >
      {/* Media item rendering */}
      {currentItem?.url && !imgErrors[activeIndex] ? (
        isVideo ? (
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0d1b14",
            }}
          >
            {/* Poster / thumbnail if available */}
            {currentItem.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentItem.thumbnailUrl}
                alt={currentItem.alt || altText}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <video
                src={currentItem.url}
                playsInline
                muted={isMuted}
                loop
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentItem.url}
            alt={currentItem.alt || altText}
            onError={() =>
              setImgErrors((prev) => ({ ...prev, [activeIndex]: true }))
            }
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        )
      ) : (
        /* Fallback Hubly Vector Cover Art */
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #10291f 0%, #0a7a55 100%)",
            position: "relative",
          }}
        >
          <div
            style={{
              width: "60%",
              maxWidth: "280px",
              aspectRatio: "1 / 1",
              borderRadius: "18px",
              overflow: "hidden",
              boxShadow: "0 20px 40px -15px rgba(0,0,0,0.4)",
            }}
          >
            <Cover
              kind={
                (currentItem?.coverKind as CoverKind) ||
                (["cup", "beans", "sun", "steam", "leaf"][activeIndex % 5] as CoverKind)
              }
            />
          </div>

          {/* Subtitle tag */}
          <div
            style={{
              position: "absolute",
              bottom: "16px",
              left: "16px",
              padding: "4px 10px",
              borderRadius: "8px",
              background: "rgba(16, 41, 31, 0.75)",
              backdropFilter: "blur(8px)",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            {isVideo ? "Video / Reel de ejemplo" : isCarousel ? `Slide ${activeIndex + 1}/${items.length}` : "Imagen de ejemplo"}
          </div>
        </div>
      )}

      {/* Video controls overlay */}
      {isVideo && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            aria-label={isPlaying ? "Pausar video" : "Reproducir video"}
            style={{
              position: "absolute",
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.55)",
              backdropFilter: "blur(6px)",
              color: "#ffffff",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "transform 0.15s ease, background-color 0.2s",
              opacity: isPlaying ? 0 : 0.92,
            }}
          >
            <PlayIcon size={26} />
          </button>

          {/* Duration badge */}
          {currentItem.duration && (
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(0,0,0,0.65)",
                color: "#ffffff",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "0.75rem",
                fontWeight: 600,
                backdropFilter: "blur(4px)",
              }}
            >
              {currentItem.duration}
            </div>
          )}

          {/* Mute button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
            }}
            aria-label={isMuted ? "Activar audio" : "Silenciar audio"}
            style={{
              position: "absolute",
              bottom: "12px",
              right: "12px",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "rgba(0,0,0,0.6)",
              color: "#ffffff",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <VolumeIcon size={16} muted={isMuted} />
          </button>
        </>
      )}

      {/* Carousel navigation & badges */}
      {isCarousel && (
        <>
          {/* Slide counter pill */}
          <div
            style={{
              position: "absolute",
              top: "14px",
              right: "14px",
              background: "rgba(16, 41, 31, 0.75)",
              color: "#ffffff",
              padding: "4px 10px",
              borderRadius: "99px",
              fontSize: "0.75rem",
              fontWeight: 700,
              backdropFilter: "blur(6px)",
              letterSpacing: "0.03em",
              zIndex: 3,
            }}
          >
            {activeIndex + 1}/{items.length}
          </div>

          {/* Previous arrow */}
          {activeIndex > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Anterior slide"
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                color: "#10291f",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                zIndex: 3,
              }}
            >
              ‹
            </button>
          )}

          {/* Next arrow */}
          {activeIndex < items.length - 1 && (
            <button
              type="button"
              onClick={handleNext}
              aria-label="Siguiente slide"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.85)",
                color: "#10291f",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                zIndex: 3,
              }}
            >
              ›
            </button>
          )}

          {/* Bottom pagination dots */}
          <div
            style={{
              position: "absolute",
              bottom: "12px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "5px",
              zIndex: 3,
            }}
          >
            {items.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: idx === activeIndex ? "7px" : "5px",
                  height: idx === activeIndex ? "7px" : "5px",
                  borderRadius: "50%",
                  background:
                    idx === activeIndex
                      ? "#3897f0"
                      : "rgba(255, 255, 255, 0.55)",
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Double tap heart pulse animation */}
      {showHeartAnim && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            animation: "heartPulse 0.9s ease-out forwards",
            zIndex: 10,
          }}
        >
          <div
            style={{
              transform: "scale(2.2)",
              filter: "drop-shadow(0 4px 16px rgba(0,0,0,0.4))",
            }}
          >
            <HeartIcon size={56} filled color="#ffffff" />
          </div>
        </div>
      )}
    </div>
  );
}
