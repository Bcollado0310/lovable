const Hero = () => {
  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Spline 3D Background */}
      <div className="absolute inset-0 w-full h-full">
        <iframe src="https://my.spline.design/worldplanet-gkuF7WBNdMFuPIMTDOwnVsZu/" frameBorder="0" width="100%" height="100%" className="w-full h-full object-cover" title="3D World Planet Animation" />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="space-y-8 animate-fade-in">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img src="/lovable-uploads/8f55156b-de31-48d5-8bd0-3d7df16b43aa.png" alt="Aurora Capital Logo" className="w-32 h-32 md:w-40 md:h-40 object-contain" />
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
            <span className="gradient-text">Aurora Equity</span>
            <br />
            <span className="text-foreground">is launching</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The future of real estate crowdfunding is here. 
            <span className="neon-text"> Revolutionary technology</span> meets 
            <span className="text-secondary"> sustainable investing</span>.
          </p>

          {/* CTA Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-6 py-3 neon-glow">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium">Join the exclusive waitlist</span>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-muted-foreground rounded-full flex justify-center">
              <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      
      <div className="absolute bottom-40 right-20 w-24 h-24 border border-secondary/20 rounded-full animate-pulse hidden lg:block" />
    </section>;
};
export default Hero;