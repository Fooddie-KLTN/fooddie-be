"use client";
import HeroImage1 from "@public/assets/hero/hero_1.png";
import Image, { StaticImageData } from "next/image";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

// Temporary demo images (replace with your actual images)
const images = [HeroImage1, HeroImage1, HeroImage1];

export default function HomeSwiper() {
  const pagination = {
    clickable: true,
  };

  return (
    <div className="relative w-full h-full">
      <Swiper
        pagination={pagination}
        modules={[Pagination]}
        className="relative w-full h-full"
        loop={true}
        keyboard={{ enabled: true }}
        autoplay={{ delay: 5000 }}
      >
        {images.map((img: StaticImageData, index: number) => (
          <SwiperSlide
            className="flex items-center aspect-[144/65]"
            key={index}
          >
            <Image
              src={img}
              loading={index === 0 ? "eager" : "lazy"}
              alt={`Slide ${index + 1}`}
              fill
              className="block"
              priority={index === 0}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}
