"use client";
import SwiperSlider from "@/components/home/experience/swiper";
import MockupSwiper from "@/components/home/experience/swiper-phone";
import SectionWrapper from "@/components/section-wrapper";
import { useEffect, useState } from "react";
import { Swiper } from "swiper/types";

const tikTokArr = [
  { post_id: "7448846605966396718" },
  { post_id: "7381170252199021867" },
  { post_id: "7380781218582793515" },
  { post_id: "7449599172979985710" },
  { post_id: "7468952584049511722" },
];

export default function Experience() {
  const [swiper1, setSwiper1] = useState<Swiper | null>(null);
  const [swiper2, setSwiper2] = useState<Swiper | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reloadKey, setReloadKey] = useState(0); // Add reload key

  useEffect(() => {
    if (swiper1 && swiper2) {
      swiper1.controller.control = swiper2;
      swiper2.controller.control = swiper1;

      const handleSlideChange = (swiper: Swiper) => {
        setActiveIndex(swiper.realIndex);
        setReloadKey((prev) => prev + 1); // Increment reload key
      };

      swiper1.on("slideChange", handleSlideChange);
      swiper2.on("slideChange", handleSlideChange);

      return () => {
        swiper1.off("slideChange", handleSlideChange);
        swiper2.off("slideChange", handleSlideChange);
      };
    }
  }, [swiper1, swiper2]);
  return (
    <>
      <SectionWrapper className="px-2 !py-0 bg-brand">
        <div className="relative px-4">
          <div className="w-full flex items-center justify-start gap-3 py-4 text-lg lg:text-e5xl font-semibold">
            <span className="bg-primary px-4 py-2 rounded-md text-white text-center">
              Trải nghiệm
            </span>
            <h1 className="lowercase text-primary text-wrap tracking-normal">
              học tập thực tế
            </h1>
          </div>
          <p className="absolute text-[#667085] w-[55%] top-[95%] text-lg sm:text-elg">
            Hàng ngàn học viên đã tin tưởng chúng tôi!
          </p>
        </div>
        <div className="max-w-screen-lg mx-auto w-full flex items-center justify-center">
          <SwiperSlider
            onSwiper={setSwiper1}
            posts={tikTokArr}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
          />
          <MockupSwiper
            onSwiper={setSwiper2}
            posts={tikTokArr}
            activeIndex={activeIndex}
            reloadKey={reloadKey}
          />
        </div>
      </SectionWrapper>
    </>
  );
}
