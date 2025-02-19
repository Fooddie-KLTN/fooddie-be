// components/tiktok-embed.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TikTokEmbed = ({
  postId,
  isActive = false,
  thumbnail = false,
  reloadKey,
  scale = 0.55,
}: {
  postId: string;
  isActive?: boolean;
  thumbnail?: boolean;
  reloadKey?: number;
  scale?: number;
}) => {
  const [embedData, setEmbedData] = useState<{
    url: string | null;
    thumbnail?: string;
  }>({ url: null });

  useEffect(() => {
    const fetchEmbedData = async () => {
      try {
        const response = await fetch(
          `https://www.tiktok.com/oembed?url=https://www.tiktok.com/@tiktok/video/${postId}`,
        );
        const data = await response.json();
        setEmbedData({
          url: `https://www.tiktok.com/embed/v2/${postId}?lang=en-US`,
          thumbnail: data.thumbnail_url,
        });
      } catch (error) {
        console.error("Failed to fetch TikTok data:", error);
      }
    };

    fetchEmbedData();
  }, [postId, reloadKey]);

  if (thumbnail) {
    return (
      <div className="relative aspect-[315/511] w-full overflow-hidden">
        {embedData.thumbnail ? (
          <Image
            src={embedData.thumbnail}
            alt="TikTok thumbnail"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="h-full w-full animate-pulse" />
        )}
      </div>
    );
  }

  return (
    <div
      className="relative h-0 min-w-[130px] top-1 pb-[285%] pl-[140%] w-full"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {isActive && (
        <iframe
          key={`${postId}-${reloadKey}`}
          src={embedData.url || "/"}
          loading={"lazy"}
          scrolling={"no"}
          className="absolute top-2 left-0 w-full h-full rounded-3xl"
          allowFullScreen
          allow="encrypted-media; accelerometer; clipboard-write; gyroscope; autoplay;"
        />
      )}
    </div>
  );
};

export default TikTokEmbed;
