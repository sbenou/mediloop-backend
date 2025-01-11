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
              {t('home.partner.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t('home.partner.description')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Users className="h-8 w-8 text-[#D6BCFA]" />
                <div>
                  <h3 className="font-semibold">{t('home.partner.features.reach.title')}</h3>
                  <p className="text-muted-foreground">{t('home.partner.features.reach.description')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-[#8B5CF6]" />
                <div>
                  <h3 className="font-semibold">{t('home.partner.features.support.title')}</h3>
                  <p className="text-muted-foreground">{t('home.partner.features.support.description')}</p>
                </div>
              </div>
            </div>
            <Button 
              className="mt-8"
              onClick={() => navigate("/become-partner")}
            >
              {t('home.partner.cta')}
            </Button>
          </div>
          <div className="relative">
            <img
              src="/transport.svg"
              alt={t('home.partner.imageAlt')}
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};