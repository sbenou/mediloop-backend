import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const DeliveryHeader = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-3xl mx-auto text-center mb-12">
      <h2 className="text-3xl font-bold mb-4 text-gray-900">
        {t('home.deliveryPartner.title')}
      </h2>
      <p className="text-lg text-gray-600 mb-8">
        {t('home.deliveryPartner.subtitle')}
      </p>
      <Button 
        onClick={() => navigate("/become-partner")}
        size="lg"
        className="bg-[#7E69AB] hover:bg-[#7E69AB]/90"
      >
        {t('home.deliveryPartner.findOutMore')}
      </Button>
    </div>
  );
};