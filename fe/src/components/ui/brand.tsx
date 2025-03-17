import { cn } from "@/lib/utils";
import BrandImageLight from "@public/logo.svg";
import BrandImage from "@public/logo.svg";
import Image from "next/image";
import Link from "next/link";

const Brand = ({
  className,
  width = 64, // Increased size for better visibility
  variant = "dark",
}: {
  className?: string;
  width?: number;
  variant?: "light" | "dark";
}) => (
  <Link href="/" className={cn("my-auto flex items-center", className)}>
    <div className="relative">
      {variant === "light" ? (
        <Image
          src={BrandImageLight}
          alt="Fooddie"
          width={width}
          height={width * 0.6}
          className="object-contain"
          priority
        />
      ) : (
        <Image 
          src={BrandImage} 
          alt="Fooddie" 
          width={width} 
          height={width * 0.6} 
          className="object-contain"
          priority
        />
      )}
      <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-[#9F6508] via-[#F3C871] to-[#FFF3B4] rounded-full"></div>
    </div>
  </Link>
);

export default Brand;