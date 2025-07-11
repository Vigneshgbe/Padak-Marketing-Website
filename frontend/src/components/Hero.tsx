import { Button } from "@/components/ui/button";
import { ArrowRight, Play, TrendingUp, Users, Award } from "lucide-react";
import { Link } from "react-router-dom";

export const Hero = () => {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                Grow Your Business with{" "}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
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
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Happy Clients</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">99%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">5+</div>
                <div className="text-sm text-muted-foreground">Years Experience</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/register">
                <Button size="lg" className="group">
                  Start Your Journey
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="group">
                <Play className="mr-2 w-4 h-4" />
                Watch Demo
              </Button>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 backdrop-blur-sm border">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-lg p-6 shadow-lg">
                  <TrendingUp className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Growth Analytics</h3>
                  <p className="text-sm text-muted-foreground">Track your success with real-time data</p>
                </div>
                <div className="bg-background rounded-lg p-6 shadow-lg">
                  <Users className="w-8 h-8 text-accent mb-4" />
                  <h3 className="font-semibold mb-2">Team Collaboration</h3>
                  <p className="text-sm text-muted-foreground">Work together seamlessly</p>
                </div>
                <div className="bg-background rounded-lg p-6 shadow-lg col-span-2">
                  <Award className="w-8 h-8 text-primary mb-4" />
                  <h3 className="font-semibold mb-2">Certified Excellence</h3>
                  <p className="text-sm text-muted-foreground">Learn from industry experts with proven results</p>
                </div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent/20 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};