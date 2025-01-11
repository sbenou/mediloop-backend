import { useNavigate } from "react-router-dom";
import { ShoppingBag, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export const DeliveryPersonSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1">
            <img
              src="/delivery-person.svg"
              alt="Become a delivery person"
              className="w-full h-auto"
            />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t('home.deliveryPerson.title')}
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t('home.deliveryPerson.description')}
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <ShoppingBag className="h-8 w-8 text-[#7E69AB]" />
                <div>
                  <h3 className="font-semibold">{t('home.deliveryPerson.benefit1.title')}</h3>
                  <p className="text-muted-foreground">{t('home.deliveryPerson.benefit1.description')}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <FileText className="h-8 w-8 text-[#6E59A5]" />
                <div>
                  <h3 className="font-semibold">{t('home.deliveryPerson.benefit2.title')}</h3>
                  <p className="text-muted-foreground">{t('home.deliveryPerson.benefit2.description')}</p>
                </div>
              </div>
            </div>
            <Button 
              className="mt-8"
              onClick={() => navigate("/become-transporter")}
            >
              {t('home.deliveryPerson.cta')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};