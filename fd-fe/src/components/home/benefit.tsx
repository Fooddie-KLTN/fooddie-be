import Card from "@/components/home/benefit/card";
import SectionWrapper from "@/components/section-wrapper";
import Benefit3 from "@public/assets/benefit/image.png";
import Benefit1 from "@public/assets/benefit/image_152.png";
import Benefit2 from "@public/assets/benefit/image_153.png";
const benefits = [
  {
    title: "Hỗ trợ từ chuyên gia",
    desc: "Bạn sẽ được kết nối với các chuyên gia đầu ngành, tham gia các buổi hỏi đáp trực tiếp, và nhận hỗ trợ trong suốt quá trình học để giải đáp mọi thắc mắc.",
    image: Benefit1,
  },
  {
    title: "Cộng đồng học tập năng động",
    desc: "Tham gia vào cộng đồng học viên sôi nổi để thảo luận, chia sẻ kinh nghiệm và tạo động lực cùng các học viên khác trên nền tảng hiện đại.",
    image: Benefit2,
  },
  {
    title: "Tài liệu học tập trọn đời",
    desc: "Bạn được truy cập toàn bộ tài liệu khóa học trọn đời, bao gồm bài giảng, tài liệu hỗ trợ và cập nhật nội dung mới nhất từ khóa học.",
    image: Benefit3,
  },
];
export default function Benefits() {
  return (
    <SectionWrapper className="bg-[#E7F1FAD9]">
      <div className="w-full flex items-center justify-center gap-3 py-6 text-exl lg:text-e5xl font-semibold">
        <span className="bg-primary px-4 py-2 rounded-md text-white text-center sm:rounded-lg">
          Quyền lợi
        </span>
        <h1 className="lowercase text-primary text-wrap tracking-normal">
          Bạn sẽ nhận được
        </h1>
      </div>
      <div className="mt-12 flex flex-col gap-2">
        {benefits.map((item, idx: number) => (
          <Card
            key={`benefit-${idx}`}
            title={item.title}
            order={idx % 2 === 0 ? "ltf" : "rtl"}
            description={item.desc}
            imageSrc={item.image}
            linkUrl="/"
          />
        ))}
      </div>
    </SectionWrapper>
  );
}
