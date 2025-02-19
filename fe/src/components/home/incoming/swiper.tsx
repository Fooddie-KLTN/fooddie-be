"use client";
import {
  PaginationArrowDownIcon,
  PaginationArrowUpIcon,
} from "@/components/icon";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import { useState } from "react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { Mousewheel, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export type Show = {
  id: string | number;
  title: string;
  description: string;
  image: string | StaticImport;
  href?: string;
};

const VerticalShowSwiper = ({
  screenSize,
  shows,
  onSelectShow,
  activeShowId,
}: {
  screenSize: number;
  shows: Show[];
  onSelectShow: (show: Show) => void;
  activeShowId: string | number;
}) => {
  const [swiper, setSwiper] = useState<null | SwiperType>(null);

  return (
    <div className="w-full h-full flex flex-col items-center gap-1">
      <Button
        size="icon"
        className="bg-transparent hover:bg-transparent border-none"
        onClick={() => swiper?.slidePrev()}
      >
        <PaginationArrowUpIcon />
      </Button>
      <Swiper
        direction="vertical"
        slidesPerView={3}
        spaceBetween={useIsMobile() ? 5 : 20}
        mousewheel={true}
        modules={[Navigation, Mousewheel]}
        onSwiper={setSwiper}
        className="vertical-swiper w-full h-full"
        style={{ maxHeight: (screenSize / 100) * 60 }}
      >
        {shows.map((show) => (
          <SwiperSlide
            className=""
            key={show.id}
            onClick={() => onSelectShow(show)}
          >
            <div className="relative w-full h-full cursor-pointer transition-transform aspect-square">
              <div className="w-full h-full">
                <span
                  style={{
                    boxSizing: "border-box",
                    display: "block",
                    overflow: "hidden",
                    width: "initial",
                    height: "initial",
                    background: "none",
                    opacity: "1",
                    border: "0px",
                    margin: "0px",
                    padding: "0px",
                    position: "absolute",
                    inset: "0px",
                    filter:
                      show.id === activeShowId
                        ? "none"
                        : "brightness(40%)",
                  }}
                >
                  <Image
                    src={show.image}
                    alt={show.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="w-full h-full rounded-lg object-cover"
                  />
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      <Button
        size="icon"
        className="bg-transparent hover:bg-transparent border-none"
        onClick={() => swiper?.slideNext()}
      >
        <PaginationArrowDownIcon />
      </Button>
    </div>
  );
};

export default VerticalShowSwiper;
