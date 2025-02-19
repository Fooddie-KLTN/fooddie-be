import SectionWrapper from "@/components/section-wrapper";
import CoachingImage from "@public/assets/coaching/Frame_1000004507.png";
import Image from "next/image";
import Link from "next/link";

export default function Coaching() {
  return (
    <SectionWrapper className="pb-0">
      <div className="relative overflow-hidden bg-gray-100">
        <Link href={"/"} className="stretched-link" />
        <div className="aspect-[375/127]">
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
              src={CoachingImage}
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
      </div>
    </SectionWrapper>
  );
}
