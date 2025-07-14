import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative py-12 lg:py-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 via-background to-orange-50/30"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Grow Your Business with{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Digital Excellence
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Transform your brand with our comprehensive digital marketing solutions. 
                From strategy to execution, we're your trusted partner in digital success.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">500+</div>
                <div className="text-sm text-muted-foreground">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">99%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">5+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="/register">
                <Button size="lg" className="group bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </a>
              <Button variant="outline" size="lg" className="group border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white">
                <Play className="mr-2 w-4 h-4" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Visual - Replaced with Padak Logo */}
          <div className="relative flex justify-center items-center">
            <div className="relative">
              <img 
                src="https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/here-logo-digital-marketing-partner.png?raw=true" 
                alt="Padak Logo" 
                className="w-80 h-80 lg:w-96 lg:h-96 object-contain drop-shadow-2xl"
              />
              
              {/* Floating Elements with Orange Theme */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-400/20 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-orange-500/20 rounded-full blur-xl animate-pulse delay-1000"></div>
              <div className="absolute top-1/2 -right-12 w-16 h-16 bg-orange-300/20 rounded-full blur-lg animate-bounce"></div>
              
              {/* Subtle glow effect around logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-orange-500/10 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};