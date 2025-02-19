"use client";
import ProductItem from "@/components/home/collection/card";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import "swiper/css";
import "swiper/css/navigation";
import { Mousewheel, Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export type Product = {
  id: string | number;
  title: string;
  author: string;
  imageUrl: StaticImport | string;
  rating: string;
  ratingCount: string;
  originalPrice: string;
  salePrice: string;
};

const SwiperCollection = ({ product }: { product: Product[] }) => {
  return (
    <div className="w-full h-full flex flex-col items-center gap-1">
      <Swiper
        direction="horizontal"
        slidesPerView={1.5}
        spaceBetween={15}
        mousewheel={true}
        modules={[Navigation, Mousewheel]}
        className="vertical-swiper w-full h-full"
      >
        {product.map((product: Product) => (
          <SwiperSlide key={product.id}>
            <ProductItem
              className="border-none rounded-none px-0 !bg-transparent"
              key={product.id}
              imageUrl={product.imageUrl}
              title={product.title}
              authorName={product.author}
              rating={parseFloat(product.rating)}
              ratingCount={parseInt(product.ratingCount)}
              originalPrice={parseInt(product.originalPrice)}
              salePrice={parseInt(product.salePrice)}
              link="/"
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperCollection;
