import {
  DollarCircleIcon,
  RefreshRightIcon,
  SecurityUserIcon,
} from "@/components/icon";
import SectionWrapper from "@/components/section-wrapper";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  weight: ["400", "600"],
  subsets: ["latin"],
  display: "swap",
});

export default function Cta() {
  const stats = [
    {
      title: "Uy tín",
      desc: "Hàng ngàn học viên đã tin tưởng chúng tôi! Khóa học chất lượng từ các chuyên gia hàng đầu.",
      icon: <DollarCircleIcon />,
    },
    {
      title: "Chất lượng",
      desc: "Kiến thức thực tiễn, nội dung tinh gọn và phương pháp hiệu quả chúng tôi.",
      icon: <SecurityUserIcon />,
    },
    {
      title: "Cam kết",
      desc: "Hỗ trợ tận tình, hoàn tiền dễ dàng nếu không hài lòng vè dịch vụ của chúng tôi.",
      icon: <RefreshRightIcon />,
    },
  ];

  return (
    <SectionWrapper
      className={`hidden sm:block bg-brand ${poppins.className} pb-16`}
    >
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="w-full flex items-center justify-center gap-3 text-lg sm:text-3xl sm:py-3 lg:py-6 lg:text-e5xl font-semibold">
          <span className="bg-primary px-4 py-2 rounded-md text-white text-center sm:rounded-lg">
            Tại sao
          </span>
          <h1 className="lowercase text-primary text-wrap tracking-normal">
            Chọn chúng tôi
          </h1>
        </div>
        <div className="max-w-6xl mx-auto sm:mt-6 lg:mt-8 bg-white rounded-lg py-8">
          <ul className="flex flex-col gap-4 items-top sm:flex-row">
            {stats.map((item, idx) => (
              <li
                key={idx}
                className="w-full flex flex-col gap-8 items-center text-center"
              >
                <div className="flex-none flex items-center justify-center bg-primary w-16 h-16 rounded-lg p-2.5">
                  {item.icon}
                </div>
                <div className="flex-none">
                  <h4 className="mb-1.5 tracking-wide font-semibold text-xl text-secondary">
                    {item.title}
                  </h4>
                  <p className="flex justify-between px-8 text-lg text-secondary tracking-wide leading-relaxed font-light">
                    {item.desc}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </SectionWrapper>
  );
}
