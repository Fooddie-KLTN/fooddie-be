import SectionWrapper from "@/components/section-wrapper";
import Timeline3 from "@public/assets/timeline/Frame_1000004251.png";
import Timeline1 from "@public/assets/timeline/Frame_1000004252.png";
import Timeline2 from "@public/assets/timeline/Frame_1000004253.png";
import Image from "next/image";
import Link from "next/link";

const posts = [
  {
    title: "2020",
    img: Timeline1,
    desc: "Hơn 1000 học viên trong và ngoài nước.",
    href: "javascript:void(0)",
  },
  {
    title: "2021",
    img: Timeline2,
    desc: "Hơn 1000 học viên trong và ngoài nước.",
    href: "javascript:void(0)",
  },
  {
    title: "2022",
    img: Timeline3,
    desc: "Hơn 1000 học viên trong và ngoài nước.",
    href: "javascript:void(0)",
  },
  {
    title: "2023 - 2024",
    img: Timeline3,
    desc: "Hơn 1000 học viên trong và ngoài nước.",
    href: "javascript:void(0)",
  },
];

export default function Timeline() {
  return (
    <SectionWrapper>
      <div className="max-w-screen-xl w-full mx-auto px-4 md:px-8">
        {posts.map((items, key) => (
          <div
            className="w-full my-12 sm:flex gap-8 items-start sm:my-6"
            key={key}
          >
            <Link href={items.href}>
              <Image
                src={items.img}
                loading="lazy"
                alt={items.title}
                width={498}
                height={307}
                className="w-fullrounded-lg"
              />
            </Link>
            <div className="flex-none mt-3 space-y-2">
              <h3 className="text-4xl text-primary duration-150 font-bold">
                {items.title}
              </h3>
              <p className="text-gray-600 text-base font-medium text-primary">
                {items.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  );
}
