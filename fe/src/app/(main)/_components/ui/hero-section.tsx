"use client";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HeroSection({ searchQuery, setSearchQuery }: HeroSectionProps) {
  return (
    <div className="relative text-white py-24">
      {/* Background image */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <Image 
          src="/assets/hero.png" 
          alt="Food delivery background"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
      </div>
      
      {/* Content */}
      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">Food Delivery to Your Door</h1>
          <p className="mb-6 text-lg md:text-xl drop-shadow-sm">Delicious meals, fast delivery, exceptional service. Order now!</p>
          <div className="flex items-center rounded-md bg-white p-2">
            <SearchIcon className="h-5 w-5 ml-2 text-gray-400" />
            <input 
              className="w-full p-2 outline-none text-gray-700"
              type="text" 
              placeholder="Search for food or restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-primary hover:bg-primary/90 hover:text-primary">
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}