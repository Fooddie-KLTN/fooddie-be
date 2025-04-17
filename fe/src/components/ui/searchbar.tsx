/**
 * SearchBar Component
 *
 * Provides a search input for finding courses and content.
 * The component is responsive and adapts to different screen sizes.
 */

"use client";

import { SearchBarProps } from "@/components/ui/navigation/types";
import { SearchIcon } from "lucide-react";
import { useState } from "react";



export default function SearchBar({
  windowDimensions = { width: 1200, height: 800 },
  
}: SearchBarProps) {
  // State for search input
  const [searchQuery, setSearchQuery] = useState<string>("");
  // Track focus state for enhanced styling
  const [isFocused, setIsFocused] = useState(false);

  // Determine if search should be visible based on screen width
  const isVisible = !(
    windowDimensions.width < 1190 && windowDimensions.width > 1024
  );

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implement search functionality here
    console.log("Searching for:", searchQuery);
  };

  if (!isVisible) return <></>;

  return (
    <form
      className={`
        flex items-center text-base w-full rounded-md 
        border transition-all duration-200 ease-in-out
        bg-white border-gray-200
        ${isFocused 
          ? "border-primary shadow-sm ring-1 ring-primary/30" 
          : "border-gray-200 hover:border-gray-300"
        }
      `}
      onSubmit={handleSubmit}
      role="search"
    >
      <SearchIcon className={`
        h-5 w-5 ml-3 mr-1
        ${isFocused ? "text-primary" : "text-gray-400"}
        ${searchQuery ? "text-primary/70" : ""}
        transition-colors duration-200
      `} />
      
      <input
        className="w-full py-2 pr-3 pl-1 bg-transparent outline-none appearance-none text-gray-700 rounded-r-md"
        type="text"
        placeholder="Tìm món ăn..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Tìm món ăn"
      />
    </form>
  );
}