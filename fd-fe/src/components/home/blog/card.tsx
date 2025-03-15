import { CalendarIcon } from "@/components/icon";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";
import Link from "next/link";

type BlogCardProps = {
  variant?: "feature" | "sub";
  title: string;
  date: string;
  content: string;
  href: string;
  imageSrc: string | StaticImport; // Use StaticImageData type from next/image if available
};

export default function Card({
  variant = "feature",
  title,
  date,
  content,
  href = "/",
  imageSrc,
}: BlogCardProps) {
  return (
    <article
      className={`relative ${
        variant === "feature"
          ? "grid gap-4"
          : "flex items-start gap-4 mb-4"
      }`}
    >
      {/* Image Container */}
      <div
        className={`relative overflow-hidden rounded-3xl bg-gray-100 ${
          variant === "sub" ? "w-[45%] flex-shrink-0" : ""
        }`}
      >
        <Link href={href} className="stretched-link" />
        <div className="aspect-[584/402] rounded-2xl">
          <span
            style={{
              boxSizing: "border-box",
              display: "block",
              overflow: "hidden",
              width: "initial",
              height: "initial",
              background: "none",
              opacity: "1",
              border: "0",
              margin: "0",
              padding: "0",
              position: "absolute",
              top: "0",
              left: "0",
              bottom: "0",
              right: "0",
            }}
          >
            <Image
              alt={title}
              src={imageSrc}
              decoding="async"
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                bottom: "0",
                right: "0",
                boxSizing: "border-box",
                padding: "0",
                border: "none",
                margin: "auto",
                display: "block",
                width: "0",
                height: "0",
                minWidth: "100%",
                maxWidth: "100%",
                minHeight: "100%",
                maxHeight: "100%",
                objectFit: "contain",
              }}
            />
          </span>
        </div>
      </div>

      {/* Text Content */}
      {variant === "feature" ? (
        <>
          <header className="flex flex-col gap-2">
            <h3>
              <Link
                href={href}
                className="article-title text-truncate-row font-semibold leading-tight text-black text-e3xl"
              >
                {title}
              </Link>
            </h3>
            <div className="md:pt-1 pt-2 mt-1 flex flex-wrap items-center text-lg font-normal text-gray-500">
              <div className="mx-1 font-normal">
                <CalendarIcon />
              </div>
              <div>{date}</div>
            </div>
          </header>
          <div className="article-content line-clamp-2 lg:line-clamp-6">
            <p>{content}</p>
          </div>
        </>
      ) : (
        <div className="w-2/3 flex flex-col gap-2">
          <header className="flex flex-col">
            <h3>
              <Link
                href={href}
                className="article-title text-truncate-row font-semibold text-black text-elg"
              >
                {title}
              </Link>
            </h3>
            <div className="md:pt-1 pt-2 mt-1 flex flex-wrap items-center text-base font-semibold text-gray-500">
              <div className="mx-1 font-normal">
                <CalendarIcon />
              </div>
              <div>{date}</div>
            </div>
          </header>
          <div className="article-content text-lg font-light hidden lg:block">
            <p>{content}</p>
          </div>
        </div>
      )}
    </article>
  );
}
