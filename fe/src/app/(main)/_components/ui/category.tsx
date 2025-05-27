"use client";

import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";
import { Category } from "@/interface";
import Image from "next/image";

interface CategorySectionProps {
  categories: Category[];
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export default function CategorySection({ 
  categories, 
  activeCategory, 
  setActiveCategory 
}: CategorySectionProps) {
  return (
    <div className="mb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <Button variant="ghost" className="text-primary flex items-center">
          View all <ChevronRightIcon className="h-4 w-4 ml-1" />
        </Button>
      </div>
      
      <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar">
        <button 
          onClick={() => setActiveCategory('All')}
          className={`flex flex-col items-center min-w-[80px] p-3 rounded-lg transition ${
            activeCategory === 'All' ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          <span className="text-xl">🍽️</span>
          <span className="mt-2 text-sm font-medium">All</span>
        </button>
        
        {categories.map((category) => (
          <button 
            key={category.id}
            onClick={() => setActiveCategory(category.name)}
            className={`flex flex-col items-center min-w-[80px] p-3 rounded-lg transition ${
              activeCategory === category.name ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Image src={category.image} alt={category.name} width={40} height={40} className="mb-2 rounded-full" />
            <span className="mt-2 text-sm font-medium">{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}