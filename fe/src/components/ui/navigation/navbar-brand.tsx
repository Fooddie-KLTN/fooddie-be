/**
 * NavbarBrand Component
 *
 * Displays the brand logo and mobile menu toggle button.
 * The component is responsive and shows the toggle button only on mobile devices.
 */

"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { MenuIcon, XIcon } from "lucide-react";
import Brand from "../brand";

interface NavbarBrandProps {
  state: boolean;
  setState: (state: boolean) => void;
  showButton?: boolean; // Add this new prop with optional flag
}

export default function NavbarBrand({
  state,
  setState,
  showButton = true,
}: NavbarBrandProps) {
  const isMobile = useIsMobile();
  return (
    <div className="flex items-center justify-between py-3 lg:block">
      <Brand className="w-12" width={isMobile ? 96 : 128} />
      <div className="lg:hidden">
        <button
          className="font-semibold"
          onClick={() => setState(!state)}
        >
          {showButton ? state ? <XIcon /> : <MenuIcon /> : <></>}
        </button>
      </div>
    </div>
  );
}
