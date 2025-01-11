import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`/avatar-${i}.jpg`} />
                    <AvatarFallback>U{i}</AvatarFallback>
                  </Avatar>
                  <div className="ml-4">
                    <div className="font-semibold">User {i}</div>
                    <div className="text-sm text-muted-foreground">Customer</div>
                  </div>
                </div>
                <p className="text-muted-foreground">
                  "Great service! Makes getting my prescriptions so much easier."
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;