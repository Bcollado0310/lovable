import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Preloader from '@/components/Preloader';
import Hero from '@/components/Hero';
import WaitlistForm from '@/components/WaitlistForm';
import AboutMission from '@/components/AboutMission';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import { LogIn, Shield, LogOut, Hammer, LineChart } from 'lucide-react';

const Index = () => {
  const [showPreloader, setShowPreloader] = useState(true);
  const { user, isAdmin, signOut } = useAuth();
  const isDev = import.meta.env.DEV;

  const handlePreloaderComplete = () => {
    setShowPreloader(false);
  };

  return (
    <>
      {showPreloader && <Preloader onComplete={handlePreloaderComplete} />}
      {!showPreloader && (
        <div className="min-h-screen">
          {/* Auth Navigation */}
          <nav className="fixed top-4 right-4 z-50 flex gap-2">
            {isDev && (
              <>
                <Button asChild variant="outline" size="sm" className="glass">
                  <Link to="/dev">
                    <Hammer className="h-4 w-4 mr-2" />
                    Developer Portal
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="glass">
                  <Link to="/dashboard">
                    <LineChart className="h-4 w-4 mr-2" />
                    Investor Dashboard
                  </Link>
                </Button>
              </>
            )}
            {user ? (
              <>
                {isAdmin && (
                  <Button asChild variant="outline" size="sm" className="glass">
                    <Link to="/admin">
                      <Shield className="h-4 w-4 mr-2" />
                      Admin Dashboard
                    </Link>
                  </Button>
                )}
                <Button onClick={signOut} variant="outline" size="sm" className="glass">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Button asChild variant="outline" size="sm" className="glass">
                <Link to="/auth">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </Link>
              </Button>
            )}
          </nav>
          
          <Hero />
          <WaitlistForm />
          <AboutMission />
          <FAQ />
          <Footer />
        </div>
      )}
    </>
  );
};

export default Index;
