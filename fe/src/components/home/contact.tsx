import { QuoteCloseIcon, QuoteOpenIcon } from "@/components/icon";
import SectionWrapper from "@/components/section-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import BackgroundContact from "@public/assets/contact/Layer_1_2.png";
import Image from "next/image";

const ContactPage = () => (
  <SectionWrapper className="bg-brand !pb-0 mt-0">
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-screen-xl mx-auto px-6 xl:px-0">
        <div className="mt-24 grid lg:grid-cols-2 gap-16 md:gap-10">
          {/* Contact Form */}
          <Card className="bg-white border-none shadow-none mb-10">
            <CardHeader className="sm:text-center px-4">
              <h2 className="text-2xl font-bold">Liên hệ tư vấn</h2>
              <p className="text-muted-foreground">
                Vui lòng để lại lời nhắn chúng tôi sẽ liên hệ bạn
                trong thời gian sớm nhất
              </p>
            </CardHeader>
            <CardContent className="p-6 md:px-10">
              <form>
                <div className="grid md:grid-cols-1 gap-x-8 gap-y-5">
                  <div className="col-span-2 sm:col-span-2">
                    <Label className="!text-base" htmlFor="firstName">
                      Họ và tên
                    </Label>
                    <Input
                      placeholder="Nhập họ tên"
                      id="firstName"
                      className="mt-1 bg-white h-11 !text-base"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <Label
                      className="!text-base"
                      htmlFor="email"
                      datatype={"email"}
                    >
                      Email
                    </Label>
                    <Input
                      placeholder="Nhập email"
                      id="email"
                      className="mt-1 bg-white h-11 sm:!text-base"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-2">
                    <Label
                      className="!text-base"
                      htmlFor="phonenumber"
                      datatype={"number"}
                    >
                      Số điện thoại
                    </Label>
                    <Input
                      placeholder="Nhập số điện thoại"
                      id="phonenumber"
                      className="mt-1 bg-white h-11 !text-base"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="message" className="!text-base">
                      Nội dung
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Nhập nội dung liên hệ..."
                      className="mt-1 bg-white !text-base"
                      rows={6}
                    />
                  </div>
                </div>
                <div className="w-full flex justify-center">
                  <Button
                    type="submit"
                    className="mt-6 w-[40%] !text-base"
                    size="lg"
                  >
                    Đăng ký tư vấn
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          {/* Figure */}
          <div className="relative lg:block hidden">
            <div className="relative flex w-2/3">
              <QuoteOpenIcon className="absolute top-0" />
              <div className="text-elg mt-8 ml-8">
                Bạn có tin chỉ trong vài khoá học có thể thay đổi hoàn
                toàn cuộc sống của bạn.
              </div>
              <QuoteCloseIcon className="absolute -bottom-5 right-0" />
            </div>
            <Image
              className="absolute w-2/3 bottom-0 right-0"
              alt={"contact"}
              width={465}
              height={537}
              src={BackgroundContact}
              decoding="async"
            />
          </div>
        </div>
      </div>
    </div>
  </SectionWrapper>
);

export default ContactPage;
