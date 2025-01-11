import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Your Health, Delivered
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Get your prescriptions and healthcare products delivered straight to your door
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/products">Browse Products</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/search-pharmacy">Find a Pharmacy</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;