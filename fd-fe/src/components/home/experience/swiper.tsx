// components/home/experience/swiper.tsx (SwiperSlider)
"use client";
import TikTokEmbed from "@/components/home/experience/tiktok";
import useScreen from "@/hooks/use-screen";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/navigation";
import { Controller, EffectCoverflow } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper/types";

// components/home/experience/swiper.tsx (SwiperSlider)
const SwiperSlider = ({
  onSwiper,
  posts,
  activeIndex,
  setActiveIndex,
}: {
  onSwiper: (swiper: SwiperType) => void;
  posts: { post_id: string }[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}) => {
  const windowDimensions = useScreen();

  return (
    <div
      className="relative mx-auto max-w-screen-lg min-w-[200px] min-h-[200px] py-12 col-span-1"
      style={{
        maxWidth:
          windowDimensions.width < 768
            ? windowDimensions.width * 0.8
            : windowDimensions.width / 1.5,
      }}
    >
      <Swiper
        onSwiper={onSwiper}
        modules={[Controller, EffectCoverflow]}
        slideToClickedSlide={true}
        loop={false}
        effect="coverflow"
        grabCursor={true}
        centeredSlides={true}
        slidesPerView={3.9}
        coverflowEffect={{
          rotate: 50,
          stretch: 2,
          depth: 100,
          modifier: 0.35,
          slideShadows: false,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        onClick={(swiper) => setActiveIndex(swiper.clickedIndex)}
        className="mockup-swiper w-full h-full"
      >
        {posts.map((post, index) => (
          <SwiperSlide key={post.post_id + index + "swiper"}>
            <div
              className="cursor-pointer w-full h-full overflow-hidden"
              onClick={() => setActiveIndex(index)}
            >
              <TikTokEmbed
                postId={post.post_id}
                thumbnail={true}
                scale={1}
              />
              {index === activeIndex && (
                <div className="absolute inset-0" />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      {/* ... */}
    </div>
  );
};

export default SwiperSlider;
