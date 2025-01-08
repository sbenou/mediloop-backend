import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Regular Customer",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
    quote: "Luxmed has made managing my prescriptions so much easier. The delivery service is prompt and reliable!"
  },
  {
    name: "Michael Chen",
    role: "Patient",
    image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952",
    quote: "The ability to compare medication prices across different pharmacies has saved me both time and money."
  },
  {
    name: "Emily Rodriguez",
    role: "Healthcare Professional",
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
    quote: "As a healthcare provider, I appreciate how Luxmed streamlines the prescription process for my patients."
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 bg-white animate-slide-up [animation-delay:800ms] opacity-0 [animation-fill-mode:forwards]">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          What Our Users Say
        </h2>
        <div className="max-w-4xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/1 lg:basis-1/1">
                  <div className="bg-card rounded-lg p-6 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{testimonial.name}</h3>
                        <p className="text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                    <blockquote className="text-lg italic text-muted-foreground">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};