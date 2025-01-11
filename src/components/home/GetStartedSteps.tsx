import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const GetStartedSteps = () => {
  return (
    <section className="py-16 bg-accent/5">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <CardTitle>Find Your Pharmacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Search for pharmacies in your area and choose your preferred one
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <CardTitle>Upload Prescription</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Upload your prescription or browse available products
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <CardTitle>Get Delivery</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Receive your medications right at your doorstep
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default GetStartedSteps;