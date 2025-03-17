"use client";
import TikTokEmbed from "@/components/home/experience/tiktok";
import useScreen from "@/hooks/use-screen";
import "swiper/css";
import { Controller } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";

const MockupSwiper = ({
  onSwiper,
  posts,
  activeIndex,
  reloadKey,
}: {
  onSwiper: (swiper: SwiperType) => void;
  posts: { post_id: string }[];
  activeIndex: number;
  reloadKey: number;
}) => {
  const windowDimensions = useScreen();

  return (
    <div
      style={{
        width:
          windowDimensions.width < 768
            ? windowDimensions.width / 2.7
            : windowDimensions.width / 5,
      }}
    >
      <div className="relative w-full pb-[200%] mb-5">
        {/* Phone frame overlay */}
        <div
          className="absolute inset-0 w-full h-full bg-no-repeat bg-cover bg-center z-20 pointer-events-none"
          style={{
            backgroundImage: "url(assets/mockup/iphone.png)",
          }}
        />
        <div className="absolute top-0 bottom-0 left-0 right-0 z-10 overflow-hidden">
          <Swiper
            modules={[Controller]}
            onSwiper={onSwiper}
            initialSlide={activeIndex}
            loop={false}
            allowTouchMove={false}
            slidesPerView={1}
          >
            {posts.map((post, index) => (
              <SwiperSlide key={post.post_id}>
                <TikTokEmbed
                  postId={post.post_id}
                  isActive={index === activeIndex}
                  reloadKey={reloadKey}
                  scale={0.67}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </div>
  );
};

export default MockupSwiper;
