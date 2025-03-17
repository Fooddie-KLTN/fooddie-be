"use client";

import { SearchIcon } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * A search bar component with a blue ring when focused.
 * @param {{ value: string, onChange: (value: string) => void, placeholder?: string }} props
 * @param {string} props.value The value of the search bar.
 * @param {(value: string) => void} props.onChange The function to call when the value changes.
 * @param {string} [props.placeholder="T m ki m..."] The placeholder text.
 */
export function SearchBar({ value, onChange, placeholder = "Tìm kiếm..." }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`
        relative flex items-center w-full overflow-hidden
        rounded-lg border border-gray-200 bg-white
        transition-all duration-300 ease-in-out
        ${isFocused ? 'ring-2 ring-primary border-transparent' : 'hover:border-gray-300'}
      `}
    >
      <SearchIcon 
        className={`
          w-5 h-5 ml-3 transition-colors duration-300
          ${isFocused ? ' text-primary' : 'text-gray-400'}
          ${value ? 'text-gray-700' : ''}
        `}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 bg-transparent
          text-gray-700 placeholder-gray-400
          focus:outline-none
          transition-all duration-300
        `}
      />
    </div>
  );
}