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
  windowDimensions,
}: SearchBarProps) {
  // State for search input
  const [searchQuery, setSearchQuery] = useState<string>("");

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
      className="flex items-center text-base space-x-2 border rounded-md p-2 transition-all focus-within:border-primary"
      onSubmit={handleSubmit}
      role="search"
    >
      <SearchIcon className="h-5 w-5 text-gray-500" />
      <input
        className="w-full outline-none appearance-none placeholder-gray-500 text-gray-700 sm:w-auto"
        type="text"
        placeholder="Tìm khóa học"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        aria-label="Tìm khóa học"
      />
    </form>
  );
}
