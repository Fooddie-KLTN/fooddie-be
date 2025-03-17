import ProductItem from "@/components/home/collection/card";
import Swiper from "@/components/home/collection/swiper";
import SectionWrapper from "@/components/section-wrapper";
import { Button } from "@/components/ui/button";
import Image from "@public/assets/incoming/incoming_main@x4.png";
import { ArrowRightIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Combo() {
  const comboItems = {
    name: "Tâm linh",
    title: "",
    desc: "",
    products: [
      {
        id: uuidv4(),
        title: "Trải nghiệm - thần số học Thượng Linh",
        author: "Trainer Lan Tây",
        imageUrl: Image,
        rating: "4.8",
        ratingCount: "97",
        originalPrice: "69000",
        salePrice: "169000",
      },
      {
        id: uuidv4(),
        title: "Trải nghiệm - thần số học Thượng Linh",
        author: "Trainer Lan Tây",
        imageUrl: Image,
        rating: "4.8",
        ratingCount: "97",
        originalPrice: "69000",
        salePrice: "169000",
      },
      {
        id: uuidv4(),
        title: "Trải nghiệm - thần số học Thượng Linh",
        author: "Trainer Lan Tây",
        imageUrl: Image,
        rating: "4.8",
        ratingCount: "97",
        originalPrice: "69000",
        salePrice: "169000",
      },
      {
        id: uuidv4(),
        title: "Trải nghiệm - thần số học Thượng Linh",
        author: "Trainer Lan Tây",
        imageUrl: Image,
        rating: "4.8",
        ratingCount: "97",
        originalPrice: "69000",
        salePrice: "169000",
      },
    ],
  };
  return (
    <SectionWrapper className="bg-[#F5F9FB] px-8">
      <div className="w-full flex items-center justify-start gap-3 py-6 text-xl lg:text-e5xl font-semibold">
        <h1 className="text-primary text-wrap tracking-normal">
          Combo
        </h1>
        <span className="lowercase bg-primary px-4 py-2 rounded-md text-white text-center sm:rounded-lg">
          Khóa học
        </span>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center gap-6">
        <div className="mt-12 grid grid-cols-4 items-center gap-6">
          {comboItems.products.map((product, idx) => (
            <ProductItem
              className="col-span-4 sm:col-span-2 lg:col-span-1"
              key={idx}
              imageUrl={product.imageUrl}
              title={product.title}
              authorName={product.author}
              rating={parseFloat(product.rating)}
              ratingCount={parseInt(product.ratingCount)}
              originalPrice={parseInt(product.originalPrice)}
              salePrice={parseInt(product.salePrice)}
              link="/"
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="lg"
          className="flex gap-1.5 text-semibold text-base"
        >
          Xem Thêm <ArrowRightIcon />
        </Button>
      </div>
      <div className="lg:hidden flex flex-col items-center gap-12">
        <Swiper product={comboItems.products} />
      </div>
    </SectionWrapper>
  );
}
