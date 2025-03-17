import ProductItem from "@/components/home/collection/card";
import Swiper from "@/components/home/collection/swiper";
import SectionWrapper from "@/components/section-wrapper";
import { Button } from "@/components/ui/button";
import Image from "@public/assets/incoming/incoming_main@x4.png";
import * as Tabs from "@radix-ui/react-tabs";
import { ArrowRightIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function Collection() {
  const tabItems = [
    {
      name: "Tất cả",
      title: "",
      desc: "",
      image: "",
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
    },
    {
      name: "Thần số học",
      title: "",
      desc: "",
      image: "",
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
    },
    {
      name: "Phun xăm thẩm mỹ",
      title: "",
      desc: "",
      image: "",
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
      ],
    },
    {
      name: "Bán hàng",
      title: "",
      desc: "",
      image: "",
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
      ],
    },
    {
      name: "Đọc vị khách hàng",
      title: "",
      desc: "",
      image: "",
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
      ],
    },
    {
      name: "Sách nói Audio",
      title: "",
      desc: "",
      image: "",
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
      ],
    },
    {
      name: "Marketing",
      title: "",
      desc: "",
      image: "",
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
      ],
    },
    {
      name: "Huyền học",
      title: "",
      desc: "",
      image: "",
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
      ],
    },
    {
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
      ],
    },
  ];
  return (
    <SectionWrapper className="bg-white px-8 pt-0">
      <div className="w-full flex items-center justify-start gap-3 py-6 text-xl lg:text-e5xl font-semibold">
        <h1 className="text-primary text-wrap tracking-normal">
          Khóa học
        </h1>
        <span className="lowercase bg-primary px-4 py-2 rounded-md text-white text-center sm:rounded-lg">
          Nhiều ưu đãi
        </span>
      </div>
      <div className="hidden lg:flex flex-col items-center justify-center gap-6">
        <Tabs.Root
          className="max-w-screen-xl mx-auto md:mt-12"
          defaultValue="Tất cả"
        >
          <Tabs.List
            className="w-full bscrollbar border-b flex items-center gap-x-3 overflow-x-auto text-base flex-wrap"
            aria-label="Manage your account"
          >
            {tabItems.map((item, idx) => (
              <Tabs.Trigger
                key={idx}
                className="group outline-none py-1.5 border-b-2 border-white secondary data-[state=active]:text-primary max-w-full"
                value={item.name}
              >
                <div className="whitespace-nowrap overflow-hidden text-ellipsis py-1.5 px-3 text-base rounded-lg duration-150 group-hover:text-primary group-hover:bg-gray-50 group-active:bg-gray-100 font-semibold">
                  {item.name}
                </div>
              </Tabs.Trigger>
            ))}
          </Tabs.List>
          {tabItems.map((item, idx) => (
            <Tabs.Content
              key={idx}
              className="py-6"
              value={item.name}
            >
              <div className="grid grid-cols-12 gap-6">
                {item.products.map((product, idx) => (
                  <ProductItem
                    className="col-span-12 sm:col-span-6 lg:col-span-3"
                    key={product.id + idx}
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
            </Tabs.Content>
          ))}
        </Tabs.Root>
        <Button
          variant="outline"
          size="lg"
          className="flex gap-1.5 text-semibold text-base"
        >
          Xem Thêm <ArrowRightIcon />
        </Button>
      </div>
      <div className="lg:hidden flex flex-col items-center gap-12">
        {tabItems.map(
          (item, idx) =>
            idx < 3 && <Swiper key={idx} product={item.products} />,
        )}
      </div>
    </SectionWrapper>
  );
}
