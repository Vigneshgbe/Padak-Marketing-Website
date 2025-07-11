import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Target, Lightbulb, Users2, Award, TrendingUp } from "lucide-react";

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
    <section id="about" className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                About <span className="text-primary">Padak</span>
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
                  <div key={index} className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <value.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{value.title}</h4>
                      <p className="text-muted-foreground">{value.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button size="lg" className="group">
              Learn More About Us
              <CheckCircle className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform" />
            </Button>
          </div>

          {/* Achievements */}
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
              {achievements.map((achievement, index) => (
                <Card key={index} className="text-center p-6 border-0 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardContent className="p-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                      <achievement.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-primary mb-2">
                      {achievement.number}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {achievement.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Team Image Placeholder */}
            <Card className="overflow-hidden border-0">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <div className="text-center">
                  <Users2 className="w-16 h-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Meet Our Expert Team</h3>
                  <p className="text-muted-foreground">
                    Dedicated professionals committed to your success
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};