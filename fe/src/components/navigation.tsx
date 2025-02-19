"use client";
import Brand from "@/components/ui/brand";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { auth, googleProvider, facebookProvider } from "../../firebaseconfig";
import { useAuthModal } from "@/context/modal-context";
import useScreen from "@/hooks/use-screen";
import Link from "next/link";
import { useEffect, useState } from "react";

// Replace javascript:void(0) with path in production
const navigation = [
  {
    title: "Về chúng tôi",
    path: "javascript:void(0)",
    isDropdown: true,
    navs: [
      {
        title: "Giới thiệu",
        desc: "Khám phá và làm chủ những kỹ năng mới",
        path: "javascript:void(0)",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="23"
            height="22"
            viewBox="0 0 23 22"
            fill="none"
          >
            <path
              d="M11.4951 21C17.018 21 21.4951 16.5228 21.4951 11C21.4951 5.47715 17.018 1 11.4951 1C5.97227 1 1.49512 5.47715 1.49512 11C1.49512 16.5228 5.97227 21 11.4951 21Z"
              stroke="#2E6F9B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.99512 7.96533C8.99512 7.48805 8.99512 7.24941 9.09486 7.11618C9.18178 7.00007 9.31483 6.92744 9.4595 6.9171C9.6255 6.90525 9.82624 7.03429 10.2277 7.29239L14.9483 10.3271C15.2967 10.551 15.4709 10.663 15.5311 10.8054C15.5836 10.9298 15.5836 11.0702 15.5311 11.1946C15.4709 11.337 15.2967 11.449 14.9483 11.6729L10.2277 14.7076C9.82624 14.9657 9.6255 15.0948 9.4595 15.0829C9.31483 15.0726 9.18178 14.9999 9.09486 14.8838C8.99512 14.7506 8.99512 14.512 8.99512 14.0347V7.96533Z"
              stroke="#2E6F9B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Blog",
        desc: "Sản phẩm chất lượng đồng hành cùng bạn trong mọi hành trình",
        path: "javascript:void(0)",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="23"
            height="22"
            viewBox="0 0 23 22"
            fill="none"
          >
            <path
              d="M8.63138 8.13628L4.42405 3.92896M4.42405 18.0711L8.66309 13.8321M14.3562 13.8638L18.5635 18.0711M18.5635 3.92896L14.3239 8.16862M21.4951 11C21.4951 16.5228 17.018 21 11.4951 21C5.97227 21 1.49512 16.5228 1.49512 11C1.49512 5.47715 5.97227 1 11.4951 1C17.018 1 21.4951 5.47715 21.4951 11ZM15.4951 11C15.4951 13.2091 13.7043 15 11.4951 15C9.28598 15 7.49512 13.2091 7.49512 11C7.49512 8.79086 9.28598 7 11.4951 7C13.7043 7 15.4951 8.79086 15.4951 11Z"
              stroke="#2E6F9B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Khám phá",
    path: "javascript:void(0)",
    isDropdown: true,
    navs: [
      {
        title: "Khóa học",
        desc: "Khám phá và làm chủ những kỹ năng mới",
        path: "javascript:void(0)",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="23"
            height="22"
            viewBox="0 0 23 22"
            fill="none"
          >
            <path
              d="M11.4951 21C17.018 21 21.4951 16.5228 21.4951 11C21.4951 5.47715 17.018 1 11.4951 1C5.97227 1 1.49512 5.47715 1.49512 11C1.49512 16.5228 5.97227 21 11.4951 21Z"
              stroke="#2E6F9B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.99512 7.96533C8.99512 7.48805 8.99512 7.24941 9.09486 7.11618C9.18178 7.00007 9.31483 6.92744 9.4595 6.9171C9.6255 6.90525 9.82624 7.03429 10.2277 7.29239L14.9483 10.3271C15.2967 10.551 15.4709 10.663 15.5311 10.8054C15.5836 10.9298 15.5836 11.0702 15.5311 11.1946C15.4709 11.337 15.2967 11.449 14.9483 11.6729L10.2277 14.7076C9.82624 14.9657 9.6255 15.0948 9.4595 15.0829C9.31483 15.0726 9.18178 14.9999 9.09486 14.8838C8.99512 14.7506 8.99512 14.512 8.99512 14.0347V7.96533Z"
              stroke="#2E6F9B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
      {
        title: "Góc sản phẩm phong cách",
        desc: "Sản phẩm chất lượng, đồng hành cùng bạn trong mọi hành trình",
        path: "javascript:void(0)",
        icon: (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="23"
            height="22"
            viewBox="0 0 23 22"
            fill="none"
          >
            <path
              d="M8.63138 8.13628L4.42405 3.92896M4.42405 18.0711L8.66309 13.8321M14.3562 13.8638L18.5635 18.0711M18.5635 3.92896L14.3239 8.16862M21.4951 11C21.4951 16.5228 17.018 21 11.4951 21C5.97227 21 1.49512 16.5228 1.49512 11C1.49512 5.47715 5.97227 1 11.4951 1C17.018 1 21.4951 5.47715 21.4951 11ZM15.4951 11C15.4951 13.2091 13.7043 15 11.4951 15C9.28598 15 7.49512 13.2091 7.49512 11C7.49512 8.79086 9.28598 7 11.4951 7C13.7043 7 15.4951 8.79086 15.4951 11Z"
              stroke="#2E6F9B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ),
      },
    ],
  },
];

export default function Navbar() {
  // Closing and open state
  const [state, setState] = useState(false);
  const { user } = useAuth();

  // Track dropdown state of inner navigation dropdown. Only the element that matches the id í open
  // Default: 0 = closing
  const [dropdownState, setDropdownState] = useState({
    isActive: false,
    idx: 0,
  });

  // Click event listener on the document to close the dropdown menu
  // when a click occurs outside the navigation menu.
  useEffect(() => {
    document.onclick = (e) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".nav-menu"))
        setDropdownState({ isActive: false, idx: 0 });
    };
  }, []);

  // Get the sreensize to determine whether to hide search bar due to responsiveness
  const windowDimensions = useScreen();
  const { openModal } = useAuthModal();
  return (
    <>
      <nav
        className={`sticky top-0 z-50 bg-white w-full lg:border-none ${state ? "shadow-lg lg:shadow-none" : ""}`}
      >
        <div className="items-center gap-x-6 px-4 max-w-screen-2xl mx-auto lg:flex lg:px-8">
          <div className="flex items-center justify-between py-3 lg:block">
            <Link href="/">
              <Brand width={155} height={50} />
            </Link>
            <div className="lg:hidden">
              <button
                className="font-semibold"
                onClick={() => setState(!state)}
              >
                {state ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zM3 12a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 12zm8.25 5.25a.75.75 0 01.75-.75h8.25a.75.75 0 010 1.5H12a.75.75 0 01-.75-.75z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div
            className={`nav-menu w-full text-navigation flex-1 pb-3 mt-8 lg:block lg:pb-0 lg:mt-0 ${state ? "block" : "hidden"}`}
          >
            <ul className="items-center space-y-6 lg:flex lg:space-x-6 lg:space-y-0">
              {navigation.map((item, idx: number) => {
                return (
                  <li className="flex-none" key={idx}>
                    {item.isDropdown ? (
                      <button
                        className="w-full font-semibold flex items-center justify-between gap-1 text-teriary text-base"
                        onClick={() =>
                          setDropdownState({
                            idx,
                            isActive: !dropdownState.isActive,
                          })
                        }
                      >
                        {item.title}
                        {dropdownState.idx == idx &&
                        dropdownState.isActive ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-5 h-5"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <Link
                        href={item.path}
                        className="block text-navigation"
                      >
                        {item.title}
                      </Link>
                    )}
                    {item.isDropdown &&
                    dropdownState.idx == idx &&
                    dropdownState.isActive ? (
                      <div
                        className="mt-6 z-10 bg-background lg:absolute lg:border-y lg:shadow-md lg:mt-0 lg:rounded-xl"
                        style={{
                          top: "3.5rem",
                          left: `${17 + idx * 10}%`,
                        }}
                      >
                        <ul className="mx-auto mt-2 flex flex-col gap-6 lg:pl-6 lg:py-4">
                          {item?.navs?.map((navItem, idx) => (
                            <li key={idx} className="group">
                              <Link href={navItem.path}>
                                <div className="max-w-xs flex gap-3 text-base">
                                  <span className="flex-none">
                                    {navItem.icon}
                                  </span>
                                  <span className="flex-1 text-primary font-semibold">
                                    {navItem.title}
                                    <p className="lg:pr-6 text-wrap break-after-all text-teriary font-light mt-1">
                                      {navItem.desc}
                                    </p>
                                  </span>
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      ""
                    )}
                  </li>
                );
              })}
              <div className="flex-auto w-full">
                <form
                  className={`flex items-center text-base space-x-2 border rounded-md p-2 ${windowDimensions.width < 1190 && windowDimensions.width > 1024 ? "hidden" : "block"}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 flex-none text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    className="w-full outline-none appearance-none placeholder-gray-500 text-gray-500 sm:w-auto"
                    type="text"
                    placeholder="Tìm khóa học"
                  />
                </form>
              </div>
              <div className="flex-1">
                <Button
                  onClick={() => openModal("activate")}
                  variant="outline"
                  className="w-full text-base border-primary hover:bg-primary hover:text-white"
                >
                  Kích hoạt khóa học
                </Button>
              </div>
              <div className="flex-1">
                <Button
                  variant="ghost"
                  className="hover:bg-transparent bg-transparent w-8 h-8"
                  size="icon"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="24"
                    viewBox="0 0 25 24"
                    fill="none"
                  >
                    <g clipPath="url(#clip0_745_11986)">
                      <path
                        d="M4.91328 2.44448L4.81535 2.07143H4.42966H2.03571C1.60178 2.07143 1.25 1.71965 1.25 1.28571C1.25 0.851776 1.60178 0.5 2.03571 0.5H4.76143H4.76147C5.14013 0.499969 5.50717 0.630742 5.8005 0.870201L5.80051 0.870203C6.08526 1.10265 6.28357 1.42365 6.36425 1.78161L6.36618 1.79015L6.3684 1.79862L6.94209 3.98409L7.04001 4.35714H7.4257H23.0368C23.5823 4.35953 24.0677 4.73585 24.2061 5.26378C24.2506 5.43394 24.2578 5.61138 24.2272 5.78382L24.225 5.79428L24.2244 5.79744L22.8675 12.4165L22.866 12.4239L22.8647 12.4313L22.8602 12.4569L22.8601 12.458C22.8438 12.5526 22.8058 12.7633 22.7403 12.9129L22.7403 12.913C22.5781 13.2839 22.2267 13.5619 21.8225 13.628L21.8224 13.628C21.7146 13.6456 21.5842 13.6443 21.5222 13.6432L21.52 13.6431L21.5022 13.6429V13.6429H21.4954H9.51842H8.90851L9.02813 14.2409L9.4567 16.3838L9.53709 16.7857H9.94699H20.0359C20.4698 16.7857 20.8216 17.1375 20.8216 17.5714C20.8216 18.0053 20.4698 18.3571 20.0359 18.3571H9.59582C9.21713 18.3571 8.85008 18.2264 8.55675 17.9869L8.55671 17.9869C8.26361 17.7476 8.06206 17.4144 7.98615 17.0437C7.98609 17.0434 7.98603 17.0431 7.98597 17.0428L7.26537 13.4398C7.25978 13.4118 7.25576 13.3842 7.25324 13.357L7.25082 13.3309L7.24567 13.3052L5.58472 5.00042L5.57958 4.97471L5.57178 4.94968C5.56805 4.93771 5.56462 4.92577 5.56149 4.91385L5.56147 4.91377L4.91328 2.44448ZM4.42966 2.57143L5.07785 5.04072C5.08296 5.06019 5.0885 5.07945 5.09443 5.09847L4.42966 2.57143ZM18.7171 20.4743C19.5283 20.4743 20.1861 21.1321 20.1861 21.9435C20.1861 22.7549 19.5283 23.4126 18.7171 23.4126C17.9056 23.4126 17.2479 22.7549 17.2479 21.9435C17.2479 21.1321 17.9057 20.4743 18.7171 20.4743ZM10.1455 20.4743C10.9569 20.4743 11.6146 21.1321 11.6146 21.9435C11.6146 22.7548 10.9569 23.4126 10.1455 23.4126C9.33417 23.4126 8.67644 22.7548 8.67644 21.9435C8.67644 21.1321 9.3342 20.4743 10.1455 20.4743Z"
                        stroke="black"
                      />
                    </g>
                    <defs>
                      <clipPath id="clip0_745_11986">
                        <rect
                          width="24"
                          height="24"
                          fill="white"
                          transform="translate(0.75)"
                        />
                      </clipPath>
                    </defs>
                  </svg>
                </Button>
              </div>
              <div className="flex-none flex gap-2 mx-auto">
                <Button
                  variant="ghost"
                  className="w-full text-base border border-transparent hover:bg-transparent hover:text-primary"
                  onClick={() => openModal("login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="default"
                  className="w-full text-base border hover:text-primary hover:border-primary"
                  onClick={() => openModal("register")}
                >
                  Đăng ký
                </Button>
              </div>
            </ul>
          </div>
        </div>
      </nav>
      {state ? (
        <div
          className="z-10 fixed top-0 w-screen h-screen bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setState(false)}
        ></div>
      ) : (
        ""
      )}
    </>
  );
}
