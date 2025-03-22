"use client";

import { SearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function HeroSection({ searchQuery, setSearchQuery }: HeroSectionProps) {
  return (
    <div className="bg-primary text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Food Delivery to Your Door</h1>
          <p className="mb-6 text-lg">Delicious meals, fast delivery, exceptional service. Order now!</p>
          <div className="flex items-center rounded-md bg-white p-2">
            <SearchIcon className="h-5 w-5 ml-2 text-gray-400" />
            <input 
              className="w-full p-2 outline-none text-gray-700"
              type="text" 
              placeholder="Search for food or restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button className="bg-primary hover:bg-primary/90">
              Search
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}