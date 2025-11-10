import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const FAQ = () => {
  const faqs = [{
    question: "What is Aurora Equity and how does it work?",
    answer: "Aurora Equity is a revolutionary real estate crowdfunding platform that allows you to invest in premium properties with as little as €100. We use blockchain technology and AI-powered analytics to provide transparent, accessible, and profitable real estate investments. Simply join our platform, browse curated properties, and invest in fractional ownership of high-quality real estate assets."
  }, {
    question: "What are the minimum investment requirements?",
    answer: "Our minimum investment starts at just €100 per property, making real estate investing accessible to everyone. There's no maximum limit, and you can diversify across multiple properties to build your ideal portfolio. We believe everyone should have the opportunity to benefit from real estate appreciation and rental income."
  }, {
    question: "How are returns generated and distributed?",
    answer: "Returns come from two sources: rental income and property appreciation. Rental income is distributed monthly directly to your Aurora Equity wallet, while appreciation gains are realized when properties are sold or through our secondary market. Our AI algorithms continuously optimize portfolio performance to maximize your returns."
  }, {
    question: "What fees are associated with investing?",
    answer: "We maintain a transparent fee structure with no hidden costs. There's a 1% annual management fee and a 15% performance fee on profits above 8% annual returns. No entry fees, no exit fees, and no surprise charges. Our success is directly tied to your investment performance."
  }, {
    question: "How is my investment protected and secured?",
    answer: "Your investments are protected through multiple layers of security: blockchain-verified ownership records, regulated custodian banking partners, comprehensive property insurance, and strict regulatory compliance. All properties undergo rigorous due diligence by our expert team before being offered to investors."
  }, {
    question: "When will Aurora Equity officially launch?",
    answer: "We're targeting Q2 2024 for our official launch. Waitlist members will receive exclusive early access 30 days before public launch, along with special founding member benefits including reduced fees for the first year and priority access to premium property deals."
  }];
  return <section className="py-20 px-6 bg-slate-950">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Frequently Asked Questions</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about investing with Aurora Equity
          </p>
        </div>

        <div className="glass-card">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`} className="border-b border-muted/20 last:border-0">
                <AccordionTrigger className="text-left hover:text-primary transition-colors px-6 py-4">
                  <span className="font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>)}
          </Accordion>
        </div>

        {/* Additional Help */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            Still have questions? We're here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:hello@auroraequity.com" className="neon-text hover:underline font-medium">
              hello@auroraequity.com
            </a>
            <span className="hidden sm:block text-muted-foreground">•</span>
            <a href="tel:+441234567890" className="neon-text hover:underline font-medium">
              +44 123 456 7890
            </a>
          </div>
        </div>
      </div>
    </section>;
};
export default FAQ;