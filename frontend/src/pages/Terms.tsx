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
  Globe
} from "lucide-react";

const termsSection = [
  {
    icon: Handshake,
    title: "Acceptance of Terms",
    description: "By accessing and using our services, you agree to be bound by these terms and conditions.",
    content: [
      {
        subtitle: "Agreement Formation",
        details: "These Terms and Conditions constitute a legally binding agreement between you and Padak Digital Marketing Partner. By accessing our website or using our services, you acknowledge that you have read, understood, and agree to be bound by these terms."
      },
      {
        subtitle: "Capacity to Contract",
        details: "You represent that you are at least 18 years old and have the legal capacity to enter into this agreement. If you are accepting these terms on behalf of a company or organization, you warrant that you have the authority to bind that entity."
      },
      {
        subtitle: "Updates and Changes",
        details: "We reserve the right to modify these terms at any time. We will notify you of significant changes, and continued use of our services after such modifications constitutes acceptance of the updated terms."
      }
    ]
  },
  {
    icon: Users,
    title: "Service Description",
    description: "Overview of the digital marketing services we provide and their scope.",
    content: [
      {
        subtitle: "Digital Marketing Services",
        details: "Padak provides comprehensive digital marketing services including but not limited to SEO optimization, social media marketing, PPC advertising, web development, content marketing, analytics, email marketing, and video marketing services."
      },
      {
        subtitle: "Service Customization",
        details: "Our services are tailored to meet your specific business needs. The exact scope, deliverables, and timeline for each project will be outlined in separate service agreements or statements of work."
      },
      {
        subtitle: "Performance Standards",
        details: "While we strive to deliver optimal results, digital marketing outcomes can vary based on market conditions, competition, and other factors beyond our control. We commit to industry best practices and professional standards."
      }
    ]
  },
  {
    icon: CreditCard,
    title: "Payment Terms",
    description: "Billing, payment schedules, and financial obligations for our services.",
    content: [
      {
        subtitle: "Payment Schedule",
        details: "Payment terms will be specified in your service agreement. Generally, we require payment upon project completion for one-time services, or monthly/quarterly for ongoing services. All payments are due within 30 days of invoice date."
      },
      {
        subtitle: "Accepted Payment Methods",
        details: "We accept various payment methods including bank transfers, credit cards, and digital payment platforms. All payments must be made in the currency specified in your invoice."
      },
      {
        subtitle: "Late Payment Policy",
        details: "Late payments may incur additional fees as specified in your service agreement. We reserve the right to suspend services for accounts that are more than 30 days overdue until payment is received."
      }
    ]
  },
  {
    icon: Shield,
    title: "Client Responsibilities",
    description: "Your obligations and responsibilities when working with our team.",
    content: [
      {
        subtitle: "Information Provision",
        details: "You agree to provide accurate, complete, and timely information necessary for us to perform our services. This includes access to relevant accounts, data, and materials required for campaign execution."
      },
      {
        subtitle: "Approval and Feedback",
        details: "You are responsible for reviewing and approving deliverables within the timeframes specified in your service agreement. Delays in approval may impact project timelines and costs."
      },
      {
        subtitle: "Compliance with Laws",
        details: "You warrant that your business, products, and services comply with all applicable laws and regulations. You are responsible for ensuring that all content and campaigns meet legal requirements in your jurisdiction."
      }
    ]
  },
  {
    icon: AlertTriangle,
    title: "Limitations of Liability",
    description: "Legal limitations on our liability and responsibility for service outcomes.",
    content: [
      {
        subtitle: "Service Limitations",
        details: "Digital marketing results are subject to various external factors including algorithm changes, market conditions, and competition. We cannot guarantee specific outcomes, rankings, or conversion rates."
      },
      {
        subtitle: "Liability Cap",
        details: "Our total liability for any claims related to our services shall not exceed the amount paid by you for the specific services that gave rise to the claim during the 12 months preceding the claim."
      },
      {
        subtitle: "Excluded Damages",
        details: "We shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or business opportunities, even if we have been advised of the possibility of such damages."
      }
    ]
  },
  {
    icon: RefreshCw,
    title: "Cancellation & Refunds",
    description: "Policies regarding service cancellation, termination, and refund procedures.",
    content: [
      {
        subtitle: "Cancellation Policy",
        details: "Either party may terminate services with written notice as specified in the service agreement. For ongoing services, typically 30 days' notice is required. One-time projects may have different cancellation terms."
      },
      {
        subtitle: "Refund Policy",
        details: "Refunds are generally not available for completed work or ongoing services already provided. In exceptional circumstances, partial refunds may be considered on a case-by-case basis for unused portions of prepaid services."
      },
      {
        subtitle: "Work Product",
        details: "Upon termination, you will receive all completed work and have the right to use materials created specifically for your business. We retain the right to use general methodologies and non-confidential knowledge gained."
      }
    ]
  },
  {
    icon: Ban,
    title: "Prohibited Uses",
    description: "Activities and uses that are not permitted when using our services.",
    content: [
      {
        subtitle: "Illegal Activities",
        details: "You may not use our services for any illegal activities, including but not limited to fraud, money laundering, or violation of intellectual property rights. We reserve the right to terminate services immediately for any illegal use."
      },
      {
        subtitle: "Harmful Content",
        details: "We do not provide services for content that is defamatory, discriminatory, threatening, or otherwise harmful. This includes adult content, gambling, and other industries that may violate platform policies."
      },
      {
        subtitle: "Spam and Abuse",
        details: "You may not engage in spamming, abuse of marketing channels, or any activities that violate platform terms of service or best practices. Such activities may result in immediate service termination."
      }
    ]
  },
  {
    icon: Scale,
    title: "Dispute Resolution",
    description: "How conflicts and disputes will be handled and resolved.",
    content: [
      {
        subtitle: "Governing Law",
        details: "These terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction]. Any disputes arising from these terms or our services shall be subject to the jurisdiction of the courts in [Your Jurisdiction]."
      },
      {
        subtitle: "Mediation First",
        details: "Before pursuing formal legal action, both parties agree to attempt resolution through good faith negotiations and, if necessary, mediation with a mutually agreed-upon mediator."
      },
      {
        subtitle: "Arbitration",
        details: "If mediation fails, disputes may be resolved through binding arbitration in accordance with the rules of [Arbitration Body]. The arbitration shall be conducted in [Location] and the decision shall be final and binding."
      }
    ]
  }
];

export default function TermsConditions() {
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
                <FileText className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                  Terms &{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    Conditions
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              These terms and conditions outline the rules and regulations for the use of Padak's 
              digital marketing services. Please read them carefully before engaging with our services.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Last Updated: January 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Effective Immediately</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-500" />
                <span>Applicable Worldwide</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </section>

      {/* Terms Sections */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {termsSection.map((section, index) => (
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

      {/* Important Notice */}
      <section className="py-8 bg-gradient-to-r from-orange-500/5 to-orange-400/5 border-t border-orange-200/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="border-orange-200 bg-orange-50/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-800 mb-2">Important Notice</h3>
                    <p className="text-orange-700 text-sm leading-relaxed">
                      These terms and conditions are legally binding. If you do not agree with any part of these terms, 
                      please do not use our services. For questions or clarifications about these terms, please contact 
                      our legal team before proceeding with any services.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500/10 to-orange-400/10 relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                <Gavel className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-bold">
                Legal{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Questions?
                </span>
              </h2>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              If you have any questions about these Terms and Conditions or need clarification 
              on any provisions, our legal team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Gavel className="w-5 h-5 mr-2" />
                Contact Legal Team
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <FileText className="w-5 h-5 mr-2" />
                Download Terms
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}