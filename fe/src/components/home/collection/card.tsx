"use client";
import { CartIcon } from "@/components/icon";
import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";

interface ProductItemProps {
  className?: string;
  imageUrl: string | StaticImport;
  title: string;
  authorName: string;
  rating: number;
  ratingCount: number;
  originalPrice: number;
  salePrice: number;
  link: string;
}

const ProductItem: React.FC<ProductItemProps> = ({
  className,
  imageUrl,
  title,
  authorName,
  originalPrice,
  salePrice,
  rating,
  ratingCount,
  link,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-gray-700 transition ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <AspectRatio ratio={25 / 14} className="flex">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </AspectRatio>

      {/* Body Section */}
      <div className="flex-1 px-4 pb-3 pt-4">
        <h3 className="line-clamp-3 text-lg font-bold leading-snug transition">
          {title}
        </h3>
      </div>

      {/* Footer Section */}
      <div className="mb-4 px-4 pt-0">
        {/* Organization Info */}
        <div className="mb-3 flex flex-nowrap items-center space-x-2">
          <div className="flex-1 text-xs leading-4 text-gray-600 md:text-sm">
            {authorName}
          </div>
        </div>

        <div className="mb-3 flex flex-nowrap items-center space-x-2">
          <div className="flex-1 text-xs leading-4 text-gray-600 md:text-sm">
            <div className="mt-1 flex items-center text-base gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
                className="mr-1 h-4 w-4 text-yellow-400"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
              {rating}
              <span className="text-sm">
                ({ratingCount} đánh giá)
              </span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="dn-detail">
          <div className="dn-money mb-2 flex items-end">
            <strong className="item-end flex leading-5 text-gray-700">
              {originalPrice.toLocaleString()}đ
            </strong>
            <span className="pl-2 text-xs text-gray-500 md:text-sm line-through">
              {salePrice.toLocaleString()}đ
            </span>
          </div>
        </div>
      </div>
      {/* Hover Overlay */}
      <div
        className={`
          absolute inset-x-0 bottom-0
          h-[15%] 
          bg-white/95 
          backdrop-blur-sm
          ${isHovered ? "translate-y-0 block" : "translate-y-full hidden"}
        `}
      >
        <div className="flex items-center justify-center">
          {/* Buy Now Button */}
          <Link
            className="w-3/4 text-center mx-auto pt-4 flex-none h-16 bg-primary text-white font-semibold"
            href={link}
          >
            Mua ngay
          </Link>
          <Link
            className="w-full flex items-center justify-center flex-1 pb-2 bg-[#2788C9E5] h-16"
            href={link}
          >
            <CartIcon />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductItem;
