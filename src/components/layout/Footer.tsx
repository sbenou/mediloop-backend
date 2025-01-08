import { Button } from "@/components/ui/button";

const Footer = () => {
  const footerSections = [
    {
      title: "Company",
      links: [
        { label: "About Us", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Press", href: "#" },
        { label: "Blog", href: "#" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "#" },
        { label: "Safety Center", href: "#" },
        { label: "Community Guidelines", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Cookies Policy", href: "#" },
        { label: "Privacy Policy", href: "#" },
        { label: "Terms of Service", href: "#" },
        { label: "Law Enforcement", href: "#" },
      ],
    },
    {
      title: "Install App",
      links: [
        { label: "App Store", href: "#" },
        { label: "Google Play", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t">
      <div className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 py-12 max-w-6xl mx-auto">
          <div className="flex flex-col items-center md:items-start space-y-2 md:col-span-1">
            <h2 className="text-2xl font-bold text-primary">Luxmed</h2>
            <p className="text-muted-foreground text-sm text-center md:text-left">
              Revolutionizing healthcare access through innovative digital solutions. Making medical services and prescriptions more accessible for everyone.
            </p>
          </div>
          <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-8 md:pl-40">
            {footerSections.map((section) => (
              <div key={section.title} className="flex flex-col items-center md:items-start space-y-2">
                <h3 className="font-semibold text-lg">{section.title}</h3>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Button variant="link" className="h-auto p-0 text-muted-foreground hover:text-primary">
                        {link.label}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 max-w-6xl mx-auto">
            <p className="text-sm text-muted-foreground">
              © 2024 Luxmed. All rights reserved.
            </p>
            <div className="flex gap-4">
              <Button variant="link" size="sm">Privacy Policy</Button>
              <Button variant="link" size="sm">Terms of Service</Button>
              <Button variant="link" size="sm">Contact</Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;