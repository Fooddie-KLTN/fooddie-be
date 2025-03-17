import SwiperTestimonial from "@/components/home/testimonial/swiper";
import SectionWrapper from "@/components/section-wrapper";
import TestimonialBackground from "@public/assets/testimonial/z6203573007167_36a7b08c38b0facadf0c76e0ad2af468.png";
import Image from "next/image";
import Link from "next/link";

export default function Testimonial() {
  return (
    <SectionWrapper className="overflow-y-hidden py-0">
      <div className="relative overflow-hidden bg-gray-100">
        <Link href={"/"} className="stretched-link" />
        <div className="aspect-[345/323] sm:aspect-[2/1]">
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
              alt={""}
              src={TestimonialBackground}
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
                objectFit: "cover",
              }}
            />
          </span>
        </div>
        <SwiperTestimonial />
      </div>
    </SectionWrapper>
  );
}
