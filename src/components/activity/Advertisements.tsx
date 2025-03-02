
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Gift, Tag, BadgePercent } from "lucide-react";

interface Advertisement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  linkText: string;
  color: string;
}

export const Advertisements = () => {
  // Sample advertisements - in a real app, these would come from an API
  const advertisements: Advertisement[] = [
    {
      id: "1",
      title: "Special Discount",
      description: "Get 20% off on all prescriptions this week only!",
      icon: <BadgePercent className="h-10 w-10" />,
      linkText: "Claim Now",
      color: "bg-blue-100 text-blue-800 border-blue-200"
    },
    {
      id: "2",
      title: "Free Delivery",
      description: "Free delivery on orders over €30 for Premium members",
      icon: <Tag className="h-10 w-10" />,
      linkText: "Learn More",
      color: "bg-green-100 text-green-800 border-green-200"
    },
    {
      id: "3",
      title: "Loyalty Program",
      description: "Join our loyalty program and earn points with every purchase",
      icon: <Gift className="h-10 w-10" />,
      linkText: "Join Now",
      color: "bg-purple-100 text-purple-800 border-purple-200"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Offers & Announcements</h2>
      </div>

      <div className="space-y-4">
        {advertisements.map((ad) => (
          <Card 
            key={ad.id} 
            className={`p-4 border rounded-md ${ad.color} hover:opacity-90 transition-all cursor-pointer`}
          >
            <div className="flex items-start">
              <div className="mr-4">
                {ad.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{ad.title}</h3>
                <p className="text-sm mt-1">{ad.description}</p>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-sm mt-2 font-medium"
                >
                  {ad.linkText} <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
