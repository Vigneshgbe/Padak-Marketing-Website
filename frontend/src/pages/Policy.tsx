import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  Eye, 
  Database, 
  Lock, 
  Users, 
  Mail,
  Cookie,
  Settings,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from "lucide-react";

const privacySections = [
  {
    icon: Eye,
    title: "Information We Collect",
    description: "Types of personal and non-personal information we gather when you use our services.",
    content: [
      {
        subtitle: "Personal Information",
        details: "We collect information you provide directly, such as your name, email address, phone number, company details, and any other information you choose to provide when contacting us or using our services."
      },
      {
        subtitle: "Usage Information",
        details: "We automatically collect information about how you interact with our website, including IP address, browser type, device information, pages visited, and time spent on our site."
      },
      {
        subtitle: "Marketing Data",
        details: "For our digital marketing services, we may collect campaign performance data, analytics information, and other marketing-related metrics with your explicit consent."
      }
    ]
  },
  {
    icon: Database,
    title: "How We Use Your Information",
    description: "The purposes for which we process your personal information.",
    content: [
      {
        subtitle: "Service Delivery",
        details: "We use your information to provide, maintain, and improve our digital marketing services, respond to your inquiries, and fulfill our contractual obligations."
      },
      {
        subtitle: "Communication",
        details: "We may use your contact information to send you service-related communications, updates about our services, and marketing communications (with your consent)."
      },
      {
        subtitle: "Analytics & Improvement",
        details: "We analyze usage patterns to improve our website, services, and user experience, always ensuring data is processed securely and responsibly."
      }
    ]
  },
  {
    icon: Users,
    title: "Information Sharing",
    description: "How and when we share your information with third parties.",
    content: [
      {
        subtitle: "Service Providers",
        details: "We may share information with trusted third-party service providers who assist us in operating our business, such as hosting providers, analytics tools, and marketing platforms."
      },
      {
        subtitle: "Legal Requirements",
        details: "We may disclose information when required by law, to protect our rights, or to comply with legal proceedings, court orders, or government requests."
      },
      {
        subtitle: "Business Transfers",
        details: "In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, with appropriate safeguards."
      }
    ]
  },
  {
    icon: Lock,
    title: "Data Security",
    description: "Measures we take to protect your information from unauthorized access.",
    content: [
      {
        subtitle: "Technical Safeguards",
        details: "We implement industry-standard security measures including encryption, secure servers, firewalls, and access controls to protect your personal information."
      },
      {
        subtitle: "Organizational Measures",
        details: "Our team is trained on data protection practices, and we limit access to personal information to employees who need it for their job functions."
      },
      {
        subtitle: "Regular Monitoring",
        details: "We regularly review and update our security practices, conduct security assessments, and monitor for potential vulnerabilities or breaches."
      }
    ]
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    description: "How we use cookies and similar technologies on our website.",
    content: [
      {
        subtitle: "Essential Cookies",
        details: "We use necessary cookies to ensure our website functions properly, maintain security, and provide core functionality you've requested."
      },
      {
        subtitle: "Analytics Cookies",
        details: "With your consent, we use analytics cookies to understand how visitors interact with our website, helping us improve user experience and content."
      },
      {
        subtitle: "Marketing Cookies",
        details: "We may use marketing cookies to show you relevant advertisements and measure campaign effectiveness, always with your explicit consent."
      }
    ]
  },
  {
    icon: Settings,
    title: "Your Rights",
    description: "Your rights regarding your personal information and how to exercise them.",
    content: [
      {
        subtitle: "Access & Portability",
        details: "You have the right to access your personal information and receive a copy in a structured, commonly used format."
      },
      {
        subtitle: "Correction & Deletion",
        details: "You can request correction of inaccurate information or deletion of your personal data, subject to legal and contractual obligations."
      },
      {
        subtitle: "Consent Management",
        details: "You can withdraw consent for marketing communications or data processing at any time, and we'll respect your choices promptly."
      }
    ]
  }
];

export default function PrivacyPolicy() {
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative">
      {/* Header Section */}
      <section className="py-16 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                  Privacy{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    Policy
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              At Padak, we are committed to protecting your privacy and ensuring the security 
              of your personal information. This policy explains how we collect, use, and safeguard your data.
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Last Updated: January 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Applies Globally</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </section>

      {/* Privacy Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {privacySections.map((section, index) => (
              <Card 
                key={index} 
                className="mb-6 group hover:shadow-xl transition-all duration-300 border-0 bg-background/90 backdrop-blur-sm hover:bg-white relative overflow-hidden"
              >
                {/* Orange accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
                      <section.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl group-hover:text-orange-600 transition-colors">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        {section.description}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={() => toggleSection(index)}
                      variant="ghost"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      {expandedSection === index ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                {expandedSection === index && (
                  <CardContent className="pt-0 border-t border-orange-100">
                    <div className="space-y-6 mt-6">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="space-y-3">
                          <h4 className="font-semibold text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"></div>
                            {item.subtitle}
                          </h4>
                          <p className="text-muted-foreground leading-relaxed pl-4">
                            {item.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
                
                {/* Subtle background pattern */}
                <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500/10 to-orange-400/10 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold">
                Questions About Your{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Privacy?
                </span>
              </h2>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              If you have any questions about this Privacy Policy or how we handle your information, 
              please don't hesitate to contact us.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Mail className="w-5 h-5 mr-2" />
                Contact Privacy Team
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <FileText className="w-5 h-5 mr-2" />
                Download Policy
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}