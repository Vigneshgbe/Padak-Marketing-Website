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
  ChevronUp,
  Palette,
  Code,
  Server,
  Instagram,
  FilmIcon,
  Scissors,
  PenTool,
  Database,
  CloudCog,
  ShoppingCart,
  Cpu,
  Monitor,
  Layers,
  Share2,
  LineChart,
  MessageCircle
} from "lucide-react";

export const Services = () => {
  const [activeCategory, setActiveCategory] = useState("digital-marketing");
  const [showAll, setShowAll] = useState(false);
  
  // Define service categories with their icons for the menu
  const categoryMenuItems = [
    { key: "digital-marketing", title: "Digital Marketing", icon: Megaphone },
    { key: "graphics-design", title: "Graphics Design", icon: Palette },
    { key: "video-editing", title: "Video Editing", icon: Video },
    { key: "web-development", title: "Web Development", icon: Globe },
    { key: "android-development", title: "Android Development", icon: Smartphone },
    { key: "hosting-services", title: "Hosting Services", icon: Server },
    { key: "social-media", title: "Social Media", icon: Instagram }
  ];
  
  const serviceCategories = {
    "digital-marketing": {
      title: "Digital Marketing",
      description: "Strategic online marketing solutions to enhance your brand visibility and drive conversions",
      services: [
        {
          icon: Search,
          title: "SEO Optimization",
          description: "Boost your search rankings with our proven SEO strategies.",
          features: ["Keyword Research", "On-Page SEO", "Technical SEO", "Link Building"]
        },
        {
          icon: TrendingUp,
          title: "PPC Advertising",
          description: "Maximize ROI with targeted pay-per-click advertising campaigns.",
          features: ["Google Ads", "Facebook Ads", "Campaign Optimization", "Conversion Tracking"]
        },
        {
          icon: Megaphone,
          title: "Content Marketing",
          description: "Tell your brand story with compelling content.",
          features: ["Blog Writing", "Lead Magnets", "Content Strategy", "Distribution"]
        },
        {
          icon: Mail,
          title: "Email Marketing",
          description: "Build lasting relationships with personalized email campaigns.",
          features: ["Automated Sequences", "A/B Testing", "Segmentation", "Performance Tracking"]
        },
        {
          icon: BarChart3,
          title: "Analytics & Reporting",
          description: "Make data-driven decisions with comprehensive analytics.",
          features: ["Google Analytics", "Custom Dashboards", "Performance Reports", "ROI Analysis"]
        },
        {
          icon: LineChart,
          title: "Conversion Optimization",
          description: "Improve your website's ability to convert visitors.",
          features: ["A/B Testing", "Landing Page Optimization", "User Experience", "Funnel Analysis"]
        }
      ]
    },
    "graphics-design": {
      title: "Graphics Design",
      description: "Professional visual solutions that communicate your brand's unique identity",
      services: [
        {
          icon: Palette,
          title: "Brand Identity",
          description: "Create a cohesive visual identity for your business.",
          features: ["Logo Design", "Brand Guidelines", "Color Palettes", "Typography"]
        },
        {
          icon: PenTool,
          title: "Print Design",
          description: "Professional designs for physical marketing materials.",
          features: ["Business Cards", "Brochures", "Posters", "Packaging"]
        },
        {
          icon: Layers,
          title: "Social Media Graphics",
          description: "Eye-catching visuals for your social media presence.",
          features: ["Post Graphics", "Profile Assets", "Story Templates", "Ad Creatives"]
        },
        {
          icon: Monitor,
          title: "Web Graphics",
          description: "Visual elements that enhance your online presence.",
          features: ["Banners", "Icons", "UI Elements", "Infographics"]
        }
      ]
    },
    "video-editing": {
      title: "Video Editing",
      description: "Engaging video content that captivates your audience and delivers your message",
      services: [
        {
          icon: Video,
          title: "Commercial Videos",
          description: "High-impact videos to promote your products or services.",
          features: ["Concept Development", "Production", "Editing", "Color Grading"]
        },
        {
          icon: FilmIcon,
          title: "Social Media Videos",
          description: "Engaging short-form videos for social platforms.",
          features: ["Stories", "Reels", "TikTok", "YouTube Shorts"]
        },
        {
          icon: Scissors,
          title: "Post-Production",
          description: "Professional editing to enhance your existing footage.",
          features: ["Cutting", "Transitions", "Effects", "Sound Design"]
        },
        {
          icon: Megaphone,
          title: "Motion Graphics",
          description: "Animated elements that bring your content to life.",
          features: ["Logo Animation", "Titles", "Lower Thirds", "Infographics"]
        }
      ]
    },
    "web-development": {
      title: "Web Development",
      description: "Custom websites and web applications built with the latest technologies",
      services: [
        {
          icon: Globe,
          title: "Responsive Websites",
          description: "Beautiful websites that work on all devices.",
          features: ["Mobile-First Design", "Fast Loading", "SEO Optimized", "User-Friendly"]
        },
        {
          icon: ShoppingCart,
          title: "E-Commerce Solutions",
          description: "Online stores that drive sales and growth.",
          features: ["Product Catalogs", "Secure Checkout", "Payment Integration", "Inventory Management"]
        },
        {
          icon: Code,
          title: "Custom Web Applications",
          description: "Tailored web apps that solve your business challenges.",
          features: ["User Authentication", "Database Integration", "API Development", "Cloud Deployment"]
        },
        {
          icon: Globe,
          title: "Maintenance & Support",
          description: "Keep your website secure, fast, and up-to-date.",
          features: ["Security Updates", "Performance Optimization", "Content Updates", "Technical Support"]
        }
      ]
    },
    "android-development": {
      title: "Android Development",
      description: "Custom mobile applications designed to meet your business needs",
      services: [
        {
          icon: Smartphone,
          title: "Native Android Apps",
          description: "Powerful apps built specifically for Android devices.",
          features: ["Java/Kotlin Development", "Material Design", "Device Optimization", "Play Store Publishing"]
        },
        {
          icon: Cpu,
          title: "Cross-Platform Apps",
          description: "Efficient apps that work on both Android and iOS.",
          features: ["React Native", "Flutter", "Shared Codebase", "Platform-Specific Features"]
        },
        {
          icon: Database,
          title: "App Backend Development",
          description: "Robust server-side solutions for your mobile apps.",
          features: ["API Development", "Database Design", "User Authentication", "Cloud Integration"]
        },
        {
          icon: BarChart3,
          title: "App Analytics & Optimization",
          description: "Improve user experience based on real usage data.",
          features: ["User Behavior Tracking", "Performance Monitoring", "A/B Testing", "Crash Analytics"]
        }
      ]
    },
    "hosting-services": {
      title: "Hosting Services",
      description: "Reliable and secure hosting solutions to ensure your website performs at its best",
      services: [
        {
          icon: Server,
          title: "Web Hosting",
          description: "Fast and reliable hosting for your website.",
          features: ["Shared Hosting", "VPS Hosting", "Dedicated Servers", "Cloud Hosting"]
        },
        {
          icon: CloudCog,
          title: "Managed Services",
          description: "Let us handle the technical aspects of your hosting.",
          features: ["Server Management", "Security", "Backups", "Updates"]
        },
        {
          icon: Database,
          title: "Database Hosting",
          description: "Optimized database solutions for your applications.",
          features: ["MySQL", "PostgreSQL", "MongoDB", "Redis"]
        },
        {
          icon: Globe,
          title: "Domain Services",
          description: "Register and manage your domain names.",
          features: ["Domain Registration", "DNS Management", "Domain Transfer", "SSL Certificates"]
        }
      ]
    },
    "social-media": {
      title: "Social Media Management",
      description: "Comprehensive social media strategies to build your brand and engage your audience",
      services: [
        {
          icon: Users,
          title: "Profile Management",
          description: "Professional handling of your social media accounts.",
          features: ["Profile Optimization", "Content Calendar", "Regular Posting", "Community Engagement"]
        },
        {
          icon: Instagram,
          title: "Platform Specific Strategy",
          description: "Tailored approaches for each social platform.",
          features: ["Instagram", "Facebook", "LinkedIn", "Twitter", "TikTok"]
        },
        {
          icon: MessageCircle,
          title: "Community Management",
          description: "Build and nurture your online community.",
          features: ["Comment Management", "Message Response", "Audience Growth", "Reputation Management"]
        },
        {
          icon: Share2,
          title: "Social Media Advertising",
          description: "Targeted ad campaigns across social platforms.",
          features: ["Audience Targeting", "Ad Creation", "Campaign Management", "Performance Analysis"]
        }
      ]
    }
  };

  // For the current tab's services
  const currentServices = serviceCategories[activeCategory].services;
  const displayedServices = showAll ? currentServices : currentServices.slice(0, 6);

  return (
    <section id="services" className="py-16 bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Our <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Services
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Comprehensive digital solutions designed to grow your business 
            and maximize your online presence across all channels.
          </p>
        </div>

        {/* Enhanced Professional Menu */}
        <div className="mb-10 overflow-x-auto scrollbar-hide">
          <div className="flex justify-center min-w-max">
            {categoryMenuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setActiveCategory(item.key);
                  setShowAll(false);
                }}
                className={`flex items-center px-4 py-3 mx-1 rounded-md transition-colors whitespace-nowrap ${
                  activeCategory === item.key
                    ? "bg-white text-orange-600 shadow-sm border border-orange-100"
                    : "text-gray-600 hover:bg-white/70 hover:text-orange-500"
                }`}
              >
                <item.icon className={`w-4 h-4 mr-2 ${
                  activeCategory === item.key ? "text-orange-500" : "text-gray-400"
                }`} />
                <span className="font-medium text-sm">{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Title & Description */}
        {/* <div className="text-center mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            {serviceCategories[activeCategory].title}
          </h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {serviceCategories[activeCategory].description}
          </p>
        </div> */}

        {/* Service Cards Grid - Using the original card layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedServices.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-0 bg-white relative overflow-hidden"
            >
              {/* Orange accent line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-all duration-300">
                  <service.icon className="w-6 h-6 text-white" />
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
            </Card>
          ))}
        </div>

        {/* Read More / Show Less Button - preserved from original design */}
        {currentServices.length > 6 && (
          <div className="mt-10 text-center">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              size="lg"
              className="group border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
            >
              {showAll ? (
                <>
                  Show Less
                  <ChevronUp className="ml-2 h-4 w-4 group-hover:-translate-y-1 transition-transform" />
                </>
              ) : (
                <>
                  Show More
                  <ChevronDown className="ml-2 h-4 w-4 group-hover:translate-y-1 transition-transform" />
                </>
              )}
            </Button>
          </div>
        )}
        
        {/* Minimal background elements for subtle enhancement */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl"></div>
      </div>
    </section>
  );
};