import { StarIcon } from "@/components/icon";
import useScreen from "@/hooks/use-screen";
import User from "@public/assets/testimonial/Ellipse_7.png";
import Image from "next/image";

export default function TestimonialCard() {
  const windowDimensions = useScreen();
  return (
    <div className="relative testimonial-card w-[166px] text-white rounded-md p-4 lg:w-[284px] lg:h-[420px]">
      <div
        className="testimonial-background absolute inset-0 bg-cover bg-center rounded-md"
        style={{
          backgroundImage: "url(/assets/testimonial/img.png)",
        }}
      ></div>
      <div className="relative flex flex-col justify-between h-full z-10">
        <p className="testimonail-content text-md leading-relaxed transition-all duration-500 lg:text-xl">
          “ Sau khóa học này đã giúp tôi thay đổi rất nhiều và nhìn
          được điểm mạnh của bản thân. “
        </p>
        <div className="testinomial-author mt-8">
          <Image
            className="rounded-full object-cover"
            width={64}
            height={64}
            src={User}
            alt="avatar"
          />
          <h5 className="font-medium text-md lg:text-exl">
            Nguyễn Thành Lanh
          </h5>
          <div className="relative flex gap-2 items-center">
            <span className="flex-auto text-sm font-thin lg:text-exl">
              Giáo viên
            </span>
            <div className="flex gap-y-1.5">
              <StarIcon
                width={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
                height={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
              />
              <StarIcon
                width={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
                height={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
              />
              <StarIcon
                width={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
                height={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
              />
              <StarIcon
                width={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
                height={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
              />
              <StarIcon
                width={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
                height={
                  windowDimensions.width < 600
                    ? 9
                    : windowDimensions.width / 70
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
