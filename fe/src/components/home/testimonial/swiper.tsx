"use client";
import TestimonialCard from "@/components/home/testimonial/card";
import { PaginationLeftIcon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import useScreen from "@/hooks/use-screen";
import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { Mousewheel, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

const SwiperTestimonial = () => {
  const [swiper, setSwiper] = useState<null | SwiperType>(null);
  const windowDimensions = useScreen();
  return (
    <div>
      <div className="top-3 left-4 absolute grid grid-cols-2 items-center justify-items-center sm:top-12 sm:left-[20%]">
        <h1 className="flex-auto text-white text-wrap tracking-normal font-semibold lg:text-4xl">
          CẢM NHẬN CỦA HỌC VIÊN
        </h1>
        <div className="flex-none">
          <Button
            size="icon"
            className="bg-transparent border border-white hover:bg-transparent hover:border-white focus-visible:ring-1 focus-visible:ring-white mr-2"
            onClick={() => swiper?.slidePrev()}
          >
            <PaginationLeftIcon />
          </Button>
          <Button
            size="icon"
            className="bg-transparent border border-white hover:bg-transparent hover:border-white focus-visible:ring-1 focus-visible:ring-white"
            onClick={() => swiper?.slideNext()}
          >
            <PaginationLeftIcon className="rotate-180" />
          </Button>
        </div>
      </div>
      <div className="max-w-screen-md absolute top-16 left-4 w-full h-full lg:max-w-screen-xl sm:top-[25%] sm:left-[10%]">
        <Swiper
          modules={[Navigation, Mousewheel]}
          slidesPerView={
            windowDimensions.width < 1536
              ? windowDimensions.width < 992
                ? windowDimensions.width < 576
                  ? windowDimensions.width < 375
                    ? windowDimensions.width < 350
                      ? 1
                      : 2
                    : 2.5
                  : 3.5
                : 4
              : 5
          }
          spaceBetween={
            windowDimensions.width < 1536
              ? windowDimensions.width < 992
                ? windowDimensions.width < 576
                  ? 2.1
                  : 2.5
                : 4
              : 5
          }
          className="relative w-full h-full"
          loop={true}
          onSwiper={setSwiper}
        >
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
          <SwiperSlide className="flex justify-center items-center">
            <TestimonialCard />
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
};

export default SwiperTestimonial;
