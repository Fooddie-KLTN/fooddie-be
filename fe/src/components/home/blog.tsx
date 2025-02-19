import Card from "@/components/home/blog/card";
import SectionWrapper from "@/components/section-wrapper";
import { Button } from "@/components/ui/button";
import BlogImage from "@public/assets/blog/image_171.png";
import { ArrowRightIcon } from "lucide-react";

export default function Blog() {
  return (
    <SectionWrapper className="px-4 bg-white flex flex-col items-center justify-center">
      <div className="w-full flex items-center justify-center gap-3 py-6 text-exl lg:text-e5xl font-semibold">
        <span className="bg-primary py-2 rounded-lg text-white text-center px-4 lg:px-24">
          Blog
        </span>
        <h1 className="lowercase text-primary text-wrap tracking-normal">
          nổi bật
        </h1>
      </div>
      <div className="max-w-6xl mt-4 mx-auto grid grid-cols-12 gap-6 overflow-hidden">
        <div className="col-span-12 lg:col-span-6">
          <Card
            variant="feature"
            title="Làn Da Hoàn Hảo Sau Phun Xăm"
            date="14/02/2025"
            content="Sau mỗi lần phun xăm, việc dưỡng da đúng cách sẽ quyết định 80% hiệu quả. Hãy chọn sản phẩm dưỡng phù hợp để giữ màu lên chuẩn và làn da luôn căng mướt..."
            href="/blog/post-1"
            imageSrc={BlogImage}
          />
        </div>
        <div className="col-span-12 lg:col-span-6">
          <Card
            variant="sub"
            title="Làn Da Hoàn Hảo Sau Phun Xăm"
            date="14/02/2025"
            content="Sau mỗi lần phun xăm, việc dưỡng da đúng cách sẽ quyết định 80% hiệu quả..."
            href="/blog/post-1"
            imageSrc={BlogImage}
          />
          <Card
            variant="sub"
            title="Làn Da Hoàn Hảo Sau Phun Xăm"
            date="14/02/2025"
            content="Sau mỗi lần phun xăm, việc dưỡng da đúng cách sẽ quyết định 80% hiệu quả..."
            href="/blog/post-1"
            imageSrc={BlogImage}
          />
          <Card
            variant="sub"
            title="Làn Da Hoàn Hảo Sau Phun Xăm"
            date="14/02/2025"
            content="Sau mỗi lần phun xăm, việc dưỡng da đúng cách sẽ quyết định 80% hiệu quả..."
            href="/blog/post-1"
            imageSrc={BlogImage}
          />
        </div>
      </div>
      <Button
        variant="outline"
        size="lg"
        className="mt-12 flex gap-1.5 text-semibold text-base"
      >
        Xem Thêm <ArrowRightIcon />
      </Button>
    </SectionWrapper>
  );
}
