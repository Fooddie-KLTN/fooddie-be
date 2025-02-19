import { StaticImport } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";

const Card = ({
  title,
  description,
  imageSrc,
  order,
  linkUrl,
}: {
  title: string;
  description: string;
  imageSrc: string | StaticImport;
  order: "ltf" | "rtl";
  linkUrl: string;
}) => {
  return (
    <figure className="mb-12 flex px-2 text-left">
      {order === "ltf" ? (
        <div className="mx-auto grid grid-cols-3 items-center justify-center lg:gap-24">
          <div className="col-span-2 max-w-2xl mt-0 pl-4 text-teriary">
            <h4 className="text-gray-7000 mb-2 text-xl font-bold">
              {title}
            </h4>
            <p className="my-1.5 text-base text-gray-500 text-justify tracking-tight pr-6 lg:pr-0 lg:text-lg">
              {description}
            </p>
          </div>
          {/* Image with Slanted Shadow */}
          <div className="flex-auto relative">
            {/* Slanted Shadow */}
            <div className="absolute inset-0" />
            {/* Slanted Shadow */}
            <div
              className="absolute bg-primary z-10 aspect-[273/172]"
              style={{
                inset: "-10% 14% 0 -6%",
                backgroundColor: "#3F8BB8",
              }}
            />
            {/* Image */}
            <Image
              className="max-w-full relative z-10 border-none"
              alt={title}
              src={imageSrc}
              width="272"
              height="172"
              loading="lazy"
            />
          </div>
        </div>
      ) : (
        <div className="mx-auto grid grid-cols-3 items-center justify-center">
          {/* Image with Slanted Shadow */}
          <div className="col-span-1 flex-auto relative">
            {/* Slanted Shadow */}
            <div className="absolute inset-0" />
            {/* Slanted Shadow */}
            <div
              className="absolute bg-primary"
              style={{
                inset: "-9% 24% 14% -5%",
                backgroundColor: "#3F8BB8",
              }}
            />
            {/* Image */}
            <Image
              className="max-w-full relative z-10 border-none"
              alt={title}
              src={imageSrc}
              width="272"
              height="172"
              loading="lazy"
            />
          </div>

          <div className="col-span-2 max-w-2xl mt-0 pl-4 text-teriary">
            <h4 className="text-gray-7000 mb-2 text-xl font-bold">
              {title}
            </h4>
            <p className="my-1.5 text-base text-gray-500 text-justify tracking-tight lg:text-lg">
              {description}
            </p>
          </div>
        </div>
      )}
    </figure>
  );
};

export default Card;
