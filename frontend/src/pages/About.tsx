import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { CheckCircle, Target, Lightbulb, Users2, Award, TrendingUp, ArrowRight, Sparkles, Star, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const About = () => {
  const navigate = useNavigate();
  
  const achievements = [
    { icon: Users2, number: "40+", label: "Happy Clients", description: "Worldwide" },
    { icon: Award, number: "2+", label: "Awards Won", description: "Excellence" },
    { icon: TrendingUp, number: "200%", label: "Average Growth", description: "Client ROI" },
    { icon: CheckCircle, number: "65+", label: "Projects Done", description: "Successfully" }
  ];

  const values = [
    {
      icon: Target,
      title: "Results-Driven Approach",
      description: "We focus on measurable outcomes that directly impact your business growth and bottom line."
    },
    {
      icon: Lightbulb,
      title: "Continuous Innovation",
      description: "Staying ahead of digital trends to provide cutting-edge solutions that give you competitive advantage."
    },
    {
      icon: Users2,
      title: "True Partnership",
      description: "We work as an extension of your team, deeply invested in your long-term success and growth."
    }
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <section id="about" className="py-24 bg-gradient-to-br from-orange-50/40 via-background to-orange-100/30 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Content */}
            <div className="space-y-10">
              <div>
                {/* <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-100 to-orange-50 text-orange-600 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  About Our Agency
                </div> */}
                <h2 className="text-4xl lg:text-5xl font-bold mb-8 leading-tight">
                  Transforming Businesses with{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    Digital Excellence
                  </span>
                </h2>
                <div className="space-y-4">
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Founded with a vision to empower businesses in the digital age, Padak has been 
                    at the forefront of digital marketing innovation for over 5 years. We combine 
                    creative excellence with data-driven strategies to deliver exceptional results 
                    that transform businesses.
                  </p>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    Our team of certified experts specializes in creating comprehensive digital 
                    marketing solutions that not only meet but exceed expectations. From ambitious 
                    startups to established enterprises, we've helped businesses across industries 
                    achieve remarkable growth through our proven methodologies.
                  </p>
                </div>
              </div>

              {/* Values */}
              <div className="space-y-8">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-gradient-to-r from-orange-500 to-orange-400 w-12"></div>
                  <h3 className="text-2xl font-bold">Our Core Values</h3>
                </div>
                <div className="space-y-5">
                  {values.map((value, index) => (
                    <div key={index} className="flex items-start space-x-4 group p-4 rounded-2xl hover:bg-orange-50/50 transition-all duration-300">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <value.icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-lg mb-2 group-hover:text-orange-600 transition-colors">
                          {value.title}
                        </h4>
                        <p className="text-muted-foreground leading-relaxed">{value.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button 
                  size="lg" 
                  className="group bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-base font-semibold"
                >
                  Discover Our Story
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => navigate('/team')}
                  className="group border-orange-200 hover:border-orange-300 hover:bg-orange-400 hover:text-white transition-all duration-300 px-8 py-6 text-base font-semibold"
                >
                  Meet the Team
                  <Users2 className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Achievements & Visual */}
            <div className="space-y-10">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <Card 
                    key={index} 
                    className="text-center p-8 border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <CardContent className="p-0 relative z-10">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <achievement.icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent mb-2">
                        {achievement.number}
                      </div>
                      <div className="text-base font-semibold text-gray-800 mb-1">
                        {achievement.label}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {achievement.description}
                      </div>
                    </CardContent>
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-400/10 rounded-full blur-2xl group-hover:bg-orange-400/20 transition-all duration-300"></div>
                  </Card>
                ))}
              </div>

              {/* Team Visual Card */}
              <Card className="overflow-hidden border-0 bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 group">
                <div className="aspect-[16/10] bg-gradient-to-br from-orange-100 via-orange-50 to-white flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-400/5"></div>
                  
                  {/* Pattern overlay */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute inset-0" style={{
                      backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(251, 146, 60, 0.1) 35px, rgba(251, 146, 60, 0.1) 70px)`
                    }}></div>
                  </div>
                  
                  <div className="text-center relative z-10 p-8">
                    <div className="flex justify-center gap-2 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-orange-400 text-orange-400" />
                      ))}
                    </div>
                    <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-orange-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Users2 className="w-12 h-12 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Meet Our Expert Team</h3>
                    <p className="text-muted-foreground text-lg mb-2">
                      25+ Dedicated Professionals
                    </p>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Certified experts in SEO, PPC, Social Media, Content Marketing, and Web Development
                    </p>
                  </div>
                  
                  {/* Enhanced decorative elements */}
                  <div className="absolute top-6 right-6 w-32 h-32 bg-orange-400/15 rounded-full blur-3xl animate-pulse"></div>
                  <div className="absolute bottom-6 left-6 w-40 h-40 bg-orange-500/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.7s' }}></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-orange-300/10 rounded-full blur-3xl"></div>
                </div>
              </Card>

              {/* Trust Indicators */}
              <div className="bg-gradient-to-r from-orange-50 to-orange-100/50 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Industry Leader</p>
                    <p className="text-sm text-muted-foreground">Trusted by Fortune 500 companies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced floating background elements */}
          <div className="absolute top-20 right-10 w-64 h-64 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 left-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-orange-300/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        </div>
      </section>
    </div>
  );
};