import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, CreditCard } from "lucide-react";

const FeaturesGrid = () => {
  return (
    <section className="py-16 bg-accent/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Clock className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Fast Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get your medications delivered quickly and efficiently
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <MapPin className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Wide Coverage</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Access pharmacies across the entire country
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CreditCard className="w-12 h-12 text-primary mb-4" />
              <CardTitle>Secure Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Your transactions are always safe and secure
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;