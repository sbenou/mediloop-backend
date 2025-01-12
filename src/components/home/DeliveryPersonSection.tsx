import { useNavigate } from "react-router-dom";
import { Bike, Bell, Wallet } from "lucide-react";
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
              Become a Delivery Partner
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our network of delivery partners and earn extra income
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Bike className="h-8 w-8 text-[#9b87f5]" />
                <div>
                  <h3 className="font-semibold">Simple Requirements</h3>
                  <p className="text-muted-foreground">All you need is a vehicle and a smartphone</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Bell className="h-8 w-8 text-[#7E69AB]" />
                <div>
                  <h3 className="font-semibold">Real-time Notifications</h3>
                  <p className="text-muted-foreground">Get instant alerts for new delivery requests</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Wallet className="h-8 w-8 text-[#9b87f5]" />
                <div>
                  <h3 className="font-semibold">Weekly Payments</h3>
                  <p className="text-muted-foreground">Receive your earnings every week</p>
                </div>
              </div>
            </div>
            <Button 
              className="mt-8"
              onClick={() => navigate("/become-transporter")}
            >
              Find Out More
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};