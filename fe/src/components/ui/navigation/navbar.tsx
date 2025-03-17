/**
 * Navbar Component
 *
 * Main navigation component for the application.
 * Provides responsive navigation with dropdowns, search, and user actions.
 *
 * Features:
 * - Responsive design for mobile and desktop
 * - Dropdown menus for navigation categories
 * - User authentication status handling
 * - Search functionality
 * - Cart and notification integration
 */

"use client";

import NavbarBrand from "@/components/ui/navigation/navbar-brand";
import { navigation } from "@/components/ui/navigation/navbar-data";
import NavbarMenu from "@/components/ui/navigation/navbar-menu";
import { useAuth } from "@/context/auth-context";
import { useAuthModal } from "@/context/modal-context";
import useScreen from "@/hooks/use-screen";
import { useEffect, useState } from "react";

export default function Navbar() {
  // State for mobile menu toggle
  const [state, setState] = useState<boolean>(false);

  // State for dropdown menu management
  const [dropdownState, setDropdownState] = useState({
    isActive: false,
    idx: 0,
  });

  // Get authentication context
  const { user } = useAuth();

  // Get modal context for login/register
  const { openModal } = useAuthModal();

  // Get screen dimensions for responsive behavior
  const windowDimensions = useScreen();

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (windowDimensions.width >= 1024 && state) {
      setState(false);
    }
  }, [windowDimensions.width, state]);

  // Close dropdown when clicking outside navigation
  useEffect(() => {
    document.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-menu"))
        setDropdownState({ isActive: false, idx: 0 });
    };
  }, []);

  return (
    <>
        <header className="sticky top-0 z-50 w-full navbar-gradient shadow-md">

      <nav
        className={``}
      >
        <div className="items-center gap-x-6 px-4 max-w-screen-2xl mx-auto lg:flex lg:px-8">
          <NavbarBrand state={state} setState={setState} />
          <NavbarMenu
            state={state}
            navigation={navigation}
            dropdownState={dropdownState}
            setDropdownState={setDropdownState}
            user={user}
            openModal={openModal}
            windowDimensions={windowDimensions}
          />
        </div>
      </nav>
      {state && (
        <div
          className="z-10 fixed top-0 w-screen h-screen bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setState(false)}
        />
      )}
            {/* Existing navbar content */}
    </header>
    </>
  );
}
