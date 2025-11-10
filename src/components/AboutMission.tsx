import { Building2, Zap, Shield, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
const AboutMission = () => {
  return <section className="py-20 px-6 bg-slate-950">
      <div className="max-w-6xl mx-auto">
        {/* Mission Statement */}
        <div className="text-center mb-16 bg-slate-950">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="gradient-text">Our Mission</span>
          </h2>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed text-center text-zinc-500">
            We're democratizing real estate investment through cutting-edge technology, 
            making premium property opportunities accessible to everyone while maintaining 
            the highest standards of transparency and sustainability.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Avatar and Founder Info */}
          <div className="text-center lg:text-left">
            
            <blockquote className="text-lg text-foreground font-medium mb-4 italic">
              "Real estate shouldn't be reserved for the wealthy few. 
              Technology has given us the power to change that forever."
            </blockquote>
            <p className="text-muted-foreground">
              <span className="font-semibold text-primary">Alex Chen</span>, Founder & CEO
            </p>
          </div>

          {/* Vision Points */}
          <div className="space-y-6">
            <Card className="glass-card border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0 bg-secondary/20 rounded-full">
                    <Building2 className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Premium Properties</h3>
                    <p className="text-muted-foreground">
                      Access institutional-grade real estate investments previously 
                      available only to major funds and high-net-worth individuals.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-secondary/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Full Transparency</h3>
                    <p className="text-muted-foreground">
                      Blockchain-verified transactions, real-time portfolio tracking, 
                      and complete visibility into property performance and management.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Smart Returns</h3>
                    <p className="text-muted-foreground">
                      AI-powered market analysis and automated portfolio optimization 
                      to maximize your returns while minimizing risk.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-8">
          {[{
          number: '€2.5B+',
          label: 'Assets Under Management'
        }, {
          number: '15,000+',
          label: 'Investors Worldwide'
        }, {
          number: '12.8%',
          label: 'Average Annual Returns'
        }, {
          number: '150+',
          label: 'Properties in Portfolio'
        }].map((stat, index) => <div key={index} className="text-center">
              <div className="text-3xl md:text-5xl font-bold gradient-text mb-3">
                {stat.number}
              </div>
              <div className="text-base md:text-lg text-muted-foreground">
                {stat.label}
              </div>
            </div>)}
        </div>
      </div>
    </section>;
};
export default AboutMission;