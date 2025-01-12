import { useNavigate } from "react-router-dom";
import { Users, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export const PartnerSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24 bg-accent">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Join Our Network
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Become a partner and grow your business
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-[#D6BCFA]" />
                <div>
                  <h3 className="font-semibold">Expand Your Reach</h3>
                  <p className="text-muted-foreground">Connect with more patients and grow your practice</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-[#8B5CF6]" />
                <div>
                  <h3 className="font-semibold">24/7 Support</h3>
                  <p className="text-muted-foreground">Get dedicated support whenever you need it</p>
                </div>
              </div>
            </div>
            <Button 
              className="mt-8"
              onClick={() => navigate("/become-partner")}
            >
              Learn More
            </Button>
          </div>
          <div className="relative">
            <img
              src="/transport.svg"
              alt="Partner with us"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};