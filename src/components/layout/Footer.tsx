import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();

  const footerSections = [
    {
      title: t('footer.company.title'),
      links: [
        { label: t('footer.company.about'), href: "#" },
        { label: t('footer.company.careers'), href: "#" },
        { label: t('footer.company.press'), href: "#" },
        { label: t('footer.company.blog'), href: "#" },
      ],
    },
    {
      title: t('footer.support.title'),
      links: [
        { label: t('footer.support.help'), href: "#" },
        { label: t('footer.support.safety'), href: "#" },
        { label: t('footer.support.guidelines'), href: "#" },
      ],
    },
    {
      title: t('footer.legal.title'),
      links: [
        { label: t('footer.legal.cookies'), href: "#" },
        { label: t('footer.legal.privacy'), href: "#" },
        { label: t('footer.legal.terms'), href: "#" },
        { label: t('footer.legal.law'), href: "#" },
      ],
    },
    {
      title: t('footer.install.title'),
      links: [
        { label: t('footer.install.appStore'), href: "#" },
        { label: t('footer.install.googlePlay'), href: "#" },
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
              {t('footer.description')}
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
              {t('footer.copyright')}
            </p>
            <div className="flex gap-4">
              <Button variant="link" size="sm">{t('footer.links.privacy')}</Button>
              <Button variant="link" size="sm">{t('footer.links.terms')}</Button>
              <Button variant="link" size="sm">{t('footer.links.contact')}</Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;