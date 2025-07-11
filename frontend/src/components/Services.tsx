import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Users, 
  TrendingUp, 
  Globe, 
  Megaphone, 
  BarChart3,
  Smartphone,
  Mail,
  Video
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
  return (
    <section id="services" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Our Digital Marketing Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive digital marketing solutions designed to grow your business 
            and maximize your online presence across all channels.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm"
            >
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <service.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription className="text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};