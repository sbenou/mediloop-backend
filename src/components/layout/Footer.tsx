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
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 max-w-6xl mx-auto">
          {footerSections.map((section) => (
            <div key={section.title} className="flex flex-col items-center md:items-start">
              <h3 className="font-semibold text-lg mb-4">{section.title}</h3>
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