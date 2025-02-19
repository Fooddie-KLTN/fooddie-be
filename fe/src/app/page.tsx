import Benefits from "@/components/home/benefit";
import Blog from "@/components/home/blog";
import Coaching from "@/components/home/coaching";
import Collection from "@/components/home/collection";
import Combo from "@/components/home/combo";
import ContactPage from "@/components/home/contact";
import Cta from "@/components/home/cta";
import Experience from "@/components/home/experience";
import Incoming from "@/components/home/incoming";
import HomeSwiper from "@/components/home/main/swiper";
import Promotion from "@/components/home/promotion";
import Testimonial from "@/components/home/testimonial";
import Timeline from "@/components/home/timeline";

export default function Home() {
  return (
    <>
      <HomeSwiper />
      <Cta />
      <Incoming />
      <Collection />
      <Combo />
      <Promotion />
      <Timeline />
      <Benefits />
      <Blog />
      <Coaching />
      <Experience />
      <Testimonial />
      <ContactPage />
    </>
  );
}
