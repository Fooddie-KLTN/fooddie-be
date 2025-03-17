/**
 * NavigationItems Component
 *
 * Renders the main navigation items with dropdown functionality.
 * Handles both desktop and mobile navigation layouts.
 */

"use client";

import {
  NavigationItemsProps,
  NavItem,
  SubNavItem,
} from "@/components/ui/navigation/types";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * SubNavItem Component - Renders a single dropdown navigation item
 */
const SubNavItemComponent = ({ item }: { item: SubNavItem }) => (
  <Link
    href={item.path}
    className="block transition-colors hover:bg-gray-50 rounded-md p-2"
  >
    <div className="max-w-xs flex gap-3 text-base">
      <span className="flex-none text-primary">{item.icon}</span>
      <span className="flex-1 text-black font-semibold">
        {item.title}
        <p className="lg:pr-6 text-wrap break-after-all text-teriary font-light mt-1">
          {item.desc}
        </p>
      </span>
    </div>
  </Link>
);

export default function NavigationItems({
  navigation,
  dropdownState,
  setDropdownState,
}: NavigationItemsProps) {
  // Reference to detect clicks outside dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownState({ isActive: false, idx: dropdownState.idx });
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownState.idx, setDropdownState]);

  /**
   * Toggle dropdown state for a specific navigation item
   */
  const toggleDropdown = (idx: number) => {
    setDropdownState({
      idx,
      isActive:
        dropdownState.idx === idx ? !dropdownState.isActive : true,
    });
  };

  return (
    <div
      ref={dropdownRef}
      className="flex flex-col lg:flex-row lg:items-center lg:space-x-6"
    >
      {navigation.map((item: NavItem, idx: number) => (
        <li className="flex-none" key={`nav-item-${idx}`}>
          {item.isDropdown ? (
            // Dropdown navigation item
            <div className="relative">
              <button
                className="w-full font-semibold flex items-center justify-between gap-1 text-teriary text-base p-2 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => toggleDropdown(idx)}
                aria-expanded={
                  dropdownState.idx === idx && dropdownState.isActive
                }
                aria-haspopup="true"
              >
                {item.title}
                {dropdownState.idx === idx &&
                dropdownState.isActive ? (
                  <ChevronUpIcon className="h-4 w-4" />
                ) : (
                  <ChevronDownIcon className="h-4 w-4" />
                )}
              </button>

              {/* Dropdown menu */}
              {item.isDropdown &&
                dropdownState.idx === idx &&
                dropdownState.isActive && (
                  <div
                    className="mt-2 z-10 bg-background lg:absolute lg:border lg:shadow-md lg:mt-0 lg:rounded-xl w-64 lg:w-72"
                    style={{
                      top: "100%",
                      left: 0,
                    }}
                  >
                    <ul className="mx-auto mt-2 flex flex-col gap-2 lg:p-4">
                      {item.navs?.map((navItem, subIdx: number) => (
                        <li
                          key={`subnav-${idx}-${subIdx}`}
                          className="group"
                        >
                          <SubNavItemComponent item={navItem} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          ) : (
            // Regular navigation link
            <Link
              href={item.path}
              className="block text-navigation p-2 rounded-md hover:bg-gray-50 transition-colors font-semibold"
            >
              {item.title}
            </Link>
          )}
        </li>
      ))}
    </div>
  );
}
