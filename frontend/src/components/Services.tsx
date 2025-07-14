import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Users, 
  TrendingUp, 
  Globe, 
  Megaphone, 
  BarChart3,
  Smartphone,
  Mail,
  Video,
  ChevronDown,
  ChevronUp
} from "lucide-react";

const services = [
  {
    icon: Search,
    title: "SEO Optimization",
    description: "Boost your search rankings with our proven SEO strategies and techniques.",
    features: ["Keyword Research", "On-Page SEO", "Technical SEO", "Link Building"]
  },
  {
    icon: Users,
    title: "Social Media Marketing",
    description: "Engage your audience across all major social media platforms.",
    features: ["Content Strategy", "Community Management", "Social Ads", "Analytics"]
  },
  {
    icon: TrendingUp,
    title: "PPC Advertising",
    description: "Maximize ROI with targeted pay-per-click advertising campaigns.",
    features: ["Google Ads", "Facebook Ads", "Campaign Optimization", "Conversion Tracking"]
  },
  {
    icon: Globe,
    title: "Web Development",
    description: "Create stunning, responsive websites that convert visitors into customers.",
    features: ["Responsive Design", "E-commerce", "CMS Integration", "Performance Optimization"]
  },
  {
    icon: Megaphone,
    title: "Content Marketing",
    description: "Tell your brand story with compelling content that drives engagement.",
    features: ["Blog Writing", "Video Production", "Infographics", "Content Strategy"]
  },
  {
    icon: BarChart3,
    title: "Analytics & Reporting",
    description: "Make data-driven decisions with comprehensive analytics and insights.",
    features: ["Google Analytics", "Custom Dashboards", "Performance Reports", "ROI Analysis"]
  },
  {
    icon: Smartphone,
    title: "Mobile Marketing",
    description: "Reach customers on their mobile devices with targeted mobile campaigns.",
    features: ["App Store Optimization", "Mobile Ads", "SMS Marketing", "Location-Based Marketing"]
  },
  {
    icon: Mail,
    title: "Email Marketing",
    description: "Build lasting relationships with personalized email marketing campaigns.",
    features: ["Automated Sequences", "A/B Testing", "Segmentation", "Performance Tracking"]
  },
  {
    icon: Video,
    title: "Video Marketing",
    description: "Engage audiences with professional video content and marketing strategies.",
    features: ["Video Production", "YouTube Marketing", "Video SEO", "Live Streaming"]
  }
];

export const Services = () => {
  const [showAll, setShowAll] = useState(false);
  const displayedServices = showAll ? services : services.slice(0, 6);

  return (
    <section id="services" className="py-16 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Our Digital Marketing{" "}
            <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive digital marketing solutions designed to grow your business 
            and maximize your online presence across all channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 bg-background/90 backdrop-blur-sm hover:bg-white relative overflow-hidden"
            >
              {/* Orange accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              
              <CardHeader className="pb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                  <service.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                  {service.title}
                </CardTitle>
                <CardDescription className="text-base leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              {/* Subtle background pattern */}
              <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
            </Card>
          ))}
        </div>

        {/* Read More / Show Less Button */}
        {services.length > 6 && (
          <div className="mt-12 text-center">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              size="lg"
              className="group border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              {showAll ? (
                <>
                  Show Less Services
                  <ChevronUp className="ml-2 h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                </>
              ) : (
                <>
                  Read More Services
                  <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
    </section>
  );
};