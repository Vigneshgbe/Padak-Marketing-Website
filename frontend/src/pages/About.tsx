import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Target, Lightbulb, Users2, Award, TrendingUp, ArrowRight, Sparkles } from "lucide-react";

export const About = () => {
  const achievements = [
    { icon: Users2, number: "500+", label: "Happy Clients" },
    { icon: Award, number: "50+", label: "Awards Won" },
    { icon: TrendingUp, number: "300%", label: "Average Growth" },
    { icon: CheckCircle, number: "1000+", label: "Projects Completed" }
  ];

  const values = [
    {
      icon: Target,
      title: "Results-Driven",
      description: "We focus on measurable outcomes that directly impact your business growth and success."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "We stay ahead of digital trends to provide cutting-edge marketing solutions."
    },
    {
      icon: Users2,
      title: "Partnership",
      description: "We work as an extension of your team, committed to your long-term success."
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-br from-orange-50/30 via-background to-orange-100/20 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                About Our Agency
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Transforming Businesses with{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Digital Excellence
                </span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                Founded with a vision to empower businesses in the digital age, Padak has been 
                at the forefront of digital marketing innovation for over 5 years. We combine 
                creative excellence with data-driven strategies to deliver exceptional results.
              </p>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our team of certified experts specializes in creating comprehensive digital 
                marketing solutions that not only meet but exceed our clients' expectations. 
                From startups to enterprise companies, we've helped businesses achieve 
                remarkable growth through our proven methodologies.
              </p>
            </div>

            {/* Values */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold">Our Core Values</h3>
              <div className="space-y-4">
                {values.map((value, index) => (
                  <div key={index} className="flex items-start space-x-4 group">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <value.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1 group-hover:text-orange-600 transition-colors">
                        {value.title}
                      </h4>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              size="lg" 
              className="group bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Learn More About Us
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          {/* Achievements */}
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <Card 
                  key={index} 
                  className="text-center p-6 border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  <CardContent className="p-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <achievement.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent mb-2">
                      {achievement.number}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium">
                      {achievement.label}
                    </div>
                  </CardContent>
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-orange-400/10 rounded-full blur-xl group-hover:bg-orange-400/20 transition-all duration-300"></div>
                </Card>
              ))}
            </div>

            {/* Team Image Placeholder */}
            <Card className="overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
              <div className="aspect-video bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-400/10"></div>
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                    <Users2 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Meet Our Expert Team</h3>
                  <p className="text-muted-foreground">
                    Dedicated professionals committed to your success
                  </p>
                </div>
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-24 h-24 bg-orange-400/20 rounded-full blur-2xl"></div>
                <div className="absolute bottom-4 left-4 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl"></div>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating background elements */}
        <div className="absolute top-10 right-20 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
    </section>
  );
};