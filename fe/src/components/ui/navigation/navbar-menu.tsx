/**
 * NavbarMenu Component
 *
 * Renders the main navigation menu including navigation items,
 * search bar, and user actions. Handles both mobile and desktop layouts.
 */

"use client";

import NavigationItems from "@/components/ui/navigation/navbar-item";
import UserActions from "@/components/ui/navigation/navbar-user";
import { NavbarMenuProps } from "@/components/ui/navigation/types";

export default function NavbarMenu({
  state,
  navigation,
  dropdownState,
  setDropdownState,
  user,
  openModal,
}: NavbarMenuProps) {
  return (
    <div
      className={`
        nav-menu w-full flex-1 pb-3 mt-8 
        lg:block lg:pb-0 lg:mt-0
        transition-all duration-300 ease-in-out
        ${state ? "block" : "hidden"}
      `}
    >
      <ul className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-6 lg:space-y-0">
        {/* Navigation items (links and dropdowns) - now in a flex container */}
        <NavigationItems
          navigation={navigation}
          dropdownState={dropdownState}
          setDropdownState={setDropdownState}
        />

        {/* Search bar - flexible width
        <li className="lg:flex-1 lg:mx-4">
          <SearchBar windowDimensions={windowDimensions} />
        </li> */}

        {/* User actions (login/profile, cart, etc.) */}
        <li className="lg:flex-none lg:flex lg:items-center">
          <UserActions user={user} openModal={openModal} />
        </li>
      </ul>
    </div>
  );
}