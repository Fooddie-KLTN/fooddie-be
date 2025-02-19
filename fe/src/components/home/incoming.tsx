"use client";
import VerticalShowSwiper, {
  Show,
} from "@/components/home/incoming/swiper";
import SectionWrapper from "@/components/section-wrapper";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/context/modal-context";
import useScreen from "@/hooks/use-screen";
import IncomingMain from "@public/assets/incoming/incoming_main@x4.png";
import Show1 from "@public/assets/incoming/show_1.png";
import Show2 from "@public/assets/incoming/show_2.png";
import Show3 from "@public/assets/incoming/show_3.png";
import Image from "next/image";
import { useState } from "react";

const shows: Show[] = [
  {
    id: "1a",
    title: "Tái sinh vận mệnh",
    description:
      '"Tái Sinh Làm Chủ Vận Mệnh" là hành trình truyền cảm hứng về sự thay đổi và làm mới bản thân. Cuốn sách đưa bạn qua những câu chuyện, triết lý và phương pháp thực tiễn để khai phá tiềm năng',
    image: Show1,
  },
  {
    id: "2b",
    title: "KHOA HỌC TÂM LÍ",
    description:
      "Cung cấp kiến thức chuyên sâu về cách áp dụng tâm lý học vào các chiến lược kinh doanh và thương mại. Bạn sẽ học cách hiểu rõ hành vi tiêu dùng, xây dựng lòng trung thành của khách hàng,",
    image: Show2,
  },
  {
    id: "3c",
    title: "CHỦ NGHĨA KHẮC KỈ",
    description:
      'Khóa học "Chủ Nghĩa Khắc Kỷ" đưa bạn vào hành trình khám phá một trong những triết lý sống cổ xưa nhưng vẫn mang tính ứng dụng cao trong cuộc sống hiện đại. Với nền tảng là các tư',
    image: Show3,
  },
  {
    id: "2",
    title: "KHOA HỌC TÂM LÍ",
    description:
      "Cung cấp kiến thức chuyên sâu về cách áp dụng tâm lý học vào các chiến lược kinh doanh và thương mại. Bạn sẽ học cách hiểu rõ hành vi tiêu dùng, xây dựng lòng trung thành của khách hàng,",
    image: Show2,
  },
  {
    id: "3",
    title: "CHỦ NGHĨA KHẮC KỈ",
    description:
      'Khóa học "Chủ Nghĩa Khắc Kỷ" đưa bạn vào hành trình khám phá một trong những triết lý sống cổ xưa nhưng vẫn mang tính ứng dụng cao trong cuộc sống hiện đại. Với nền tảng là các tư',
    image: Show3,
  },
];

export default function Incoming() {
  const [selectedShow, setSelectedShow] = useState<Show>(shows[0]);
  const [activeShowId, setActiveShowId] = useState<string | number>(
    shows[0].id,
  );
  const windowDimensions = useScreen();

  const handleSelectShow = (show: Show) => {
    setSelectedShow(show);
    setActiveShowId(show.id);
  };

  const { openModal } = useAuthModal();

  return (
    <SectionWrapper
      className={`pb-0 bg-white ${windowDimensions.width < 360 ? "hidden" : "block"}`}
    >
      <div className="w-full flex items-center justify-center gap-3 pt-6 text-exl lg:text-e5xl font-semibold">
        <h1 className="text-primary text-wrap tracking-normal">
          Khóa học
        </h1>
        <span className="lowercase bg-primary px-4 py-2 rounded-md text-white text-center sm:rounded-lg">
          Sắp ra mắt
        </span>
      </div>
      <div className="relative">
        <div className="aspect-[15/13] md:aspect-[291/240]">
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
              alt={"Tái sinh vận mệnh"}
              src={IncomingMain}
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
        <div
          className="absolute bg-black/10 transform -translate-x-1/2 rounded-xl !backdrop-blur-md"
          style={{
            left:
              windowDimensions.width < 1536
                ? windowDimensions.width < 992
                  ? windowDimensions.width < 576
                    ? windowDimensions.width / 2.725
                    : windowDimensions.width / 2.705
                  : windowDimensions.width / 3.805
                : windowDimensions.width / 3.75,
            top:
              windowDimensions.width < 1536
                ? windowDimensions.width < 992
                  ? windowDimensions.width < 576
                    ? windowDimensions.width / 8.425
                    : windowDimensions.width / 4.705
                  : windowDimensions.width / 4.5
                : windowDimensions.width / 3.25,
          }}
        >
          <div className="max-w-sm flex flex-col gap-4 rounded-lg p-5 sm:p-12 sm:gap-6 sm:max-w-lg">
            <h2 className="incoming-title uppercase text-white tracking-tighter leading-none font-bold text-exl sm:text-e3xl lg:text-e5xl xl:text-e8xl sm:pr-24">
              {selectedShow.title}
            </h2>
            <div className="incoming-information tracking-normal text-md !line-clamp-4 sm:text-elg sm:leading-tight lg:!line-clamp-5">
              <p className="block text-white">
                {selectedShow.description}
              </p>
            </div>
            <Button
              onClick={() => openModal("register")}
              className="bg-white w-2/3 text-primary rounded-xl text-md font-semibold !p-1 hover:bg-opacity-60 hover:text-white sm:w-1/2 sm:text-base lg:rounded-3xl lg:!p-6"
              size="lg"
            >
              Đăng ký ngay
            </Button>
          </div>
        </div>
        <div
          className="absolute"
          style={{
            right: windowDimensions.width / 100 + 10,
            top:
              windowDimensions.width < 992
                ? windowDimensions.width < 576
                  ? windowDimensions.width / 100
                  : (windowDimensions.width / 100) * 6.025
                : (windowDimensions.width / 100) * 7,
          }}
        >
          <VerticalShowSwiper
            screenSize={windowDimensions.width}
            shows={shows}
            onSelectShow={handleSelectShow}
            activeShowId={activeShowId}
          />
        </div>
      </div>
    </SectionWrapper>
  );
}
