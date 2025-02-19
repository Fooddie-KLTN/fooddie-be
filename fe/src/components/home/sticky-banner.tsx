import {
  FacebookIcon,
  TiktokIcon,
  YoutubeIcon,
} from "@/components/icon";
import Link from "next/link";

export default function StickyBanner() {
  return (
    <div
      id="sticky-banner"
      tabIndex={-1}
      className="hidden lg:flex sticky z-50 justify-between items-center w-full p-0.5 px-4 border-b border-brandSolid bg-brandSolid"
    >
      <div className="social-media flex-none flex gap-x-2 items-center align-middle">
        <Link
          href="/FE/public"
          className="inline-flex w-4 h-4 items-center shrink-0"
        >
          <FacebookIcon />
          <span className="sr-only">facebook</span>
        </Link>
        <Link
          href="/FE/public"
          className="inline-flex items-center shrink-0"
        >
          <TiktokIcon />
          <span className="sr-only">tiktok</span>
        </Link>
        <Link
          href="/FE/public"
          className="inline-flex items-center shrink-0"
        >
          <YoutubeIcon />
          <span className="sr-only">youtube</span>
        </Link>
      </div>
      <p className="flex-1 font-normal text-base text-center text-gray-5000">
        <span className="text-brandSolid-foreground">
          Tham gia ngay để nhận khóa học miễn phí và hàng nghìn khóa
          học hấp dẫn.
          <Link
            href="https://flowbite.com"
            className="ml-1 inline font-semibold text-background"
          >
            Tham gia ngay
          </Link>
        </span>
      </p>
      <div className="flex-none items-center">
        <button
          data-dismiss-target="#sticky-banner"
          type="button"
          className="shrink-0 inline-flex justify-center w-7 h-7 items-center text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 "
        >
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
          <span className="sr-only">Close banner</span>
        </button>
      </div>
    </div>
  );
}
