
import { useInView } from "react-intersection-observer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export const TestimonialsSection = () => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Patient",
      image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158",
      quote: "The platform made it so easy to connect with my doctor and get my prescriptions filled. Highly recommended!"
    },
    {
      name: "Dr. Michael Chen",
      role: "Healthcare Provider",
      image: "https://images.unsplash.com/photo-1581092795360-fd1ca04f0952",
      quote: "This system has streamlined my practice and improved patient care significantly."
    },
    {
      name: "Emily Rodriguez",
      role: "Pharmacist",
      image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7",
      quote: "Managing prescriptions and connecting with patients has never been easier."
    },
    {
      name: "David Thompson",
      role: "Patient",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      quote: "Quick delivery and excellent service. I can always count on getting my medications on time."
    },
    {
      name: "Lisa Parker",
      role: "Healthcare Provider",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      quote: "The digital prescription system has made my workflow much more efficient."
    }
  ];

  return (
    <section 
      ref={ref}
      className={`py-16 md:py-24 bg-white transform transition-all duration-700 ${
        inView ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
      }`}
    >
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          What Our Users Say
        </h2>
        <div className="max-w-6xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
              slidesToScroll: 2
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="bg-card rounded-lg p-6 shadow-sm h-full">
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
                    <blockquote className="text-lg italic text-muted-foreground line-clamp-4">
                      "{testimonial.quote}"
                    </blockquote>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12" />
            <CarouselNext className="hidden md:flex -right-12" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};
