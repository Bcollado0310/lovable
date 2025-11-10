import { Separator } from '@/components/ui/separator';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background/50 backdrop-blur-sm border-t border-muted/20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src="/lovable-uploads/8f55156b-de31-48d5-8bd0-3d7df16b43aa.png" 
                alt="Aurora Capital Logo" 
                className="w-8 h-8 object-contain"
              />
              <h3 className="font-bold text-lg gradient-text">Aurora Equity</h3>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Revolutionizing real estate investment through blockchain technology 
              and democratized access to premium properties.
            </p>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/cookies" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* Company Info */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="/careers" className="text-muted-foreground hover:text-primary transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <a href="/press" className="text-muted-foreground hover:text-primary transition-colors">
                  Press Kit
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>hello@auroraequity.com</li>
              <li>+44 123 456 7890</li>
              <li>
                London, United Kingdom<br />
                Registered in England
              </li>
            </ul>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Legal Disclaimer */}
        <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground">Important Legal Disclaimer</p>
          <p>
            <strong>Investment Risk Warning:</strong> All investments carry risk and may lose value. 
            Past performance is not indicative of future results. Real estate investments are illiquid 
            and may not be suitable for all investors. You should carefully consider your investment 
            objectives and risk tolerance before investing.
          </p>
          <p>
            <strong>Regulatory Status:</strong> Aurora Equity Ltd is authorized and regulated by the 
            Financial Conduct Authority (FCA) under reference number [TBD]. All investment activities 
            are conducted in accordance with FCA regulations and European securities law.
          </p>
          <p>
            <strong>Tax Implications:</strong> Tax treatment depends on individual circumstances and 
            may change. You should seek independent tax advice. Capital gains tax may apply to profits 
            from property disposals.
          </p>
          <p>
            <strong>Investor Protection:</strong> Eligible deposits are protected under the Financial 
            Services Compensation Scheme (FSCS) up to £85,000 per person, per firm. Investment assets 
            are held by regulated custodians separate from Aurora Equity's corporate assets.
          </p>
        </div>

        <Separator className="my-8" />

        {/* Copyright */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Aurora Equity Ltd. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Company No. 12345678 | FCA Ref. [TBD]
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;