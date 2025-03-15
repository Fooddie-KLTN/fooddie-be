"use client";
import SectionWrapper from "@/components/section-wrapper";
import PromotionHome from "@public/assets/promotion/3568_[Converted]-01_1.png";
import PromotionCollection from "@public/assets/promotion/Frame_1000004487.png";
import Image from "next/image";

export default function Promotion() {
  return (
    <SectionWrapper className="!py-0">
      <div className="relative mx-auto text-center w-full">
        <div className="mt-4 promotion relative overflow-hidden block aspect-[420/370] sm:aspect-[23/13]">
          <Image
            src={PromotionHome}
            alt={"promotion"}
            fill
            className="object-cover"
          />
        </div>
        <div className="absolute flex flex-col gap-3 top-4 left-0 right-0 text-center text-white lg:gap-2 lg:top-8">
          <h1 className="font-bold text-3xl lg:text-8xl">
            2018 - 2024
          </h1>
          <div className="mx-auto max-w-xs bg-white text-primary py-2 px-4 font-bold lg:max-w-xl lg:text-2xl lg:font-semibold lg:rounded-md lg:px-16 lg:py-3">
            7 NĂM HUẤN LUYỆN, ĐÀO TẠO
          </div>
          <p className="text-base font-light lg:text-xl lg:font-normal">
            Hơn 1000 học viên trong và ngoài nước
          </p>
          <div className="mt-4 promotion relative overflow-hidden block aspect-[450/140]">
            <Image
              src={PromotionCollection}
              alt={"promotion"}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </SectionWrapper>
  );
}
