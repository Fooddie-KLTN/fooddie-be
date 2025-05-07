import {
  FacebookNegativeIcon,
  InstagramNegativeIcon,
  LinkedInNegativeIcon,
  MapPinIcon,
  PhoneIcon,
  PinterestNegativeIcon,
  TelegramNegativeIcon,
  TiktokNegativeIcon,
  UserIcon,
  XNegativeIcon,
  YoutubeNegativeIcon,
} from "@/components/icon";
import Brand from "@/components/ui/brand";
import AppleBadge from "@public/assets/index/store/appstore_badge.png";
import GooglePlayBadge from "@public/assets/index/store/google_play_badge.png";
import Image from "next/image";
import Link from "next/link";
import { ReactElement } from "react";

export default function Footer() {
  const footerNavs = [
    {
      label: "Về chúng tôi",
      items: [
        {
          href: "/about",
          name: "Giới thiệu",
        },
        {
          href: "/",
          name: "Khóa học",
        },
        {
          href: "/",
          name: "Trợ giúp",
        },
      ],
    },
    {
      label: "Điều khoản & Chính sách",
      items: [
        {
          href: "/",
          name: "Chính sách bảo mật",
        },
        {
          href: "/",
          name: "Điều khoản dịch vụ",
        },
        {
          href: "/",
          name: "Quy định thanh toán",
        },
      ],
    },
  ];

  const socialMedia: {
    name: string;
    href: string;
    icon: string | ReactElement;
  }[] = [
    {
      name: "Facebook",
      href: "/",
      icon: <FacebookNegativeIcon />,
    },
    {
      name: "Tiktok",
      href: "/",
      icon: <TiktokNegativeIcon />,
    },
    {
      name: "Youtube",
      href: "/",
      icon: <YoutubeNegativeIcon />,
    },
    {
      name: "LinkedIn",
      href: "/",
      icon: <LinkedInNegativeIcon />,
    },
    {
      name: "Telegram",
      href: "/",
      icon: <TelegramNegativeIcon />,
    },
    {
      name: "Instagram",
      href: "/",
      icon: <InstagramNegativeIcon />,
    },
    {
      name: "Pinterest",
      href: "/",
      icon: <PinterestNegativeIcon />,
    },
    {
      name: "X",
      href: "/",
      icon: <XNegativeIcon />,
    },
  ];

  return (
    <footer className="bg-primary px-8 py-6 mx-auto md:px-8">
      <div className="flex flex-col flex-wrap gap-8 items-start justify-between lg:flex-row">
        <div className="brand-information flex-1 lg:flex-1">
          <div className="max-w-xs text-white">
            <Brand variant="light" width={196} />
            <div className="w-full flex gap-2 items-center leading-relaxed mt-4 text-base font-light">
              <MapPinIcon className="w-5 h-5 flex-none" />
              Trường Đại học Công Nghệ Thông Tin - ĐHQG TP.HCM
            </div>
            <div className="flex gap-2 items-start leading-relaxed mt-4 text-base font-light">
              <PhoneIcon className="w-5 h-5 flex-none" />
              Hotline : 035 822 1363
            </div>
            <div className="flex gap-2 items-start leading-relaxed mt-4 text-base font-light">
              <UserIcon className="w-5 h-5 flex-none" />
              Legel Representative : Phù Đức Quân
            </div>
          </div>
        </div>
        <div className="navigate flex-1 grid grid-cols-2 items-start text-white lg:flex-none lg:flex lg:gap-16">
          {footerNavs.map((item, idx) => (
            <ul className="text-white space-y-4" key={idx}>
              <h4 className="font-semibold">{item.label}</h4>
              {item.items.map((el, idx) => (
                <li className="font-light text-base" key={idx}>
                  <Link
                    href={el.href}
                    className="hover:underline hover:text-indigo-600"
                  >
                    {el.name}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
        <div className="social-media flex-1 grid grid-cols-6 items-start gap-3 text-white lg:flex-1 lg:grid-cols-12 lg:items-center">
          <h4 className="font-semibold col-span-6 lg:col-span-12">
            Theo dõi chúng tôi
          </h4>
          {socialMedia.map((item, idx) => (
            <div
              className="text-white space-y-4 lg:col-span-1"
              key={idx}
            >
              <Link href={item.href} className="w-5 h-5">
                {item.icon}
              </Link>
              <span className="sr-only">{item.name}</span>
            </div>
          ))}
          <h4 className="mt-4 font-semibold col-span-6 lg:col-span-12">
            Tải App
          </h4>
          <Link
            className="w-full col-span-3 lg:col-span-12"
            href={"/"}
          >
            <Image
              width={135}
              height={40}
              src={AppleBadge}
              alt="Appstore Badge"
            />
          </Link>
          <Link
            className="w-full col-span-3 lg:col-span-12"
            href={"/"}
          >
            <Image
              width={135}
              height={40}
              src={GooglePlayBadge}
              alt="GooglePlay Badge"
            />
          </Link>
        </div>
      </div>
    </footer>
  );
}
