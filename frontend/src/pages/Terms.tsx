import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Handshake, 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  Scale,
  RefreshCw,
  Ban,
  Gavel,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Code,
  Palette,
  Video,
  BookOpen,
  Share2
} from "lucide-react";

const termsSection = [
  // ... (your termsSection array remains unchanged)
];

export default function TermsConditions() {
  const [expandedSections, setExpandedSections] = useState([]);

  const toggleSection = (index) => {
    if (expandedSections.includes(index)) {
      setExpandedSections(expandedSections.filter(i => i !== index));
    } else {
      setExpandedSections([...expandedSections, index]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative">
      {/* Reduced top space header section */}
      <section className="py-10 md:py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Terms &{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    Conditions
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              These terms and conditions outline the rules and regulations for using Padak's 
              services, including courses, internships, digital marketing, and development services.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                <span>Last Updated: August 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 md:w-4 md:h-4 text-blue-500" />
                <span>Effective Immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-3 h-3 md:w-4 md:h-4 text-purple-500" />
                <span>Applicable Worldwide</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </section>

      {/* Terms Sections */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {termsSection.map((section, index) => (
              <Card 
                key={index} 
                className="mb-5 group hover:shadow-xl transition-all duration-300 border-0 bg-background/90 backdrop-blur-sm hover:bg-white relative overflow-hidden"
              >
                {/* Orange accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                
                <CardHeader 
                  onClick={() => toggleSection(index)}
                  className="pb-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg flex-shrink-0">
                      <section.icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg md:text-xl group-hover:text-orange-600 transition-colors">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-sm md:text-base leading-relaxed">
                        {section.description}
                      </CardDescription>
                    </div>
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSection(index);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                    >
                      {expandedSections.includes(index) ? (
                        <ChevronUp className="w-4 h-4 md:w-5 md:h-5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                
                {expandedSections.includes(index) && (
                  <CardContent className="pt-0 border-t border-orange-100">
                    <div className="space-y-4 mt-4">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex} className="space-y-2">
                          <h4 className="font-semibold text-foreground flex items-center gap-2 text-base">
                            <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-orange-400 rounded-full"></div>
                            {item.subtitle}
                          </h4>
                          <div className="text-muted-foreground leading-relaxed pl-4 text-sm md:text-base">
                            {item.details}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
                
                {/* Subtle background pattern */}
                <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-orange-400/5 rounded-full blur-xl group-hover:bg-orange-400/10 transition-all duration-300"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-6 bg-gradient-to-r from-orange-500/5 to-orange-400/5 border-t border-orange-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-orange-200 bg-orange-50/50 backdrop-blur-sm">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-1 text-base md:text-lg">Important Notice</h3>
                    <p className="text-orange-700 text-xs md:text-sm leading-relaxed">
                      These terms and conditions are legally binding. By using our services, enrolling in our courses, 
                      or participating in our programs, you agree to be bound by these terms. If you do not agree with 
                      any part of these terms, please do not use our services. For questions or clarifications, please 
                      contact our legal team before proceeding.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 md:py-14 bg-gradient-to-r from-orange-500/10 to-orange-400/10 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                <Gavel className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold">
                Legal{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Questions?
                </span>
              </h2>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              If you have any questions about these Terms and Conditions or need clarification 
              on any provisions, our legal team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="mailto:legal@padak.com">
                  <Gavel className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Contact Legal Team
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Download Terms
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}