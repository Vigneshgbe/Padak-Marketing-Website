import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Cookie,
  Eye,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  Globe,
  AlertTriangle,
  Gavel
} from "lucide-react";

const cookieSections = [
  {
    icon: Cookie,
    title: "Introduction to Cookies",
    description: "Understanding what cookies are and how we use them on our platforms.",
    content: [
      {
        subtitle: "What Are Cookies?",
        details: "Cookies are small text files that are placed on your device when you visit a website. They are widely used to make websites work more efficiently, as well as to provide information to website owners about how users interact with their sites. Cookies do not typically contain personally identifiable information but may be used in combination with other information to identify users."
      },
      {
        subtitle: "Our Use of Cookies",
        details: "At Padak Digital Marketing Partner, we use cookies to enhance your experience on our website, analyze site traffic, personalize content, and support our marketing efforts. Cookies help us understand how visitors interact with our services, which allows us to improve functionality and provide more relevant content."
      },
      {
        subtitle: "Cookie Consent",
        details: "By using our website, you consent to the use of cookies as described in this policy. When you first visit our site, you'll see a cookie consent banner where you can manage your preferences for non-essential cookies. You can change these preferences at any time through our Cookie Settings."
      }
    ]
  },
  {
    icon: Eye,
    title: "Types of Cookies We Use",
    description: "Categories of cookies used on our website and their purposes.",
    content: [
      {
        subtitle: "Essential Cookies",
        details: "These cookies are necessary for the website to function properly. They enable basic functions like page navigation and access to secure areas of the website. The website cannot function properly without these cookies. They are typically set in response to actions made by you such as setting your privacy preferences, logging in, or filling in forms."
      },
      {
        subtitle: "Performance Cookies",
        details: "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular and see how visitors move around the site. All information these cookies collect is aggregated and therefore anonymous."
      },
      {
        subtitle: "Functionality Cookies",
        details: "These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third-party providers whose services we have added to our pages. If you do not allow these cookies, then some or all of these services may not function properly."
      },
      {
        subtitle: "Targeting Cookies",
        details: "These cookies may be set through our site by our advertising partners. They may be used by those companies to build a profile of your interests and show you relevant advertisements on other sites. They work by uniquely identifying your browser and internet device. If you do not allow these cookies, you will experience less targeted advertising."
      }
    ]
  },
  {
    icon: Users,
    title: "Third-Party Cookies",
    description: "Information about cookies set by third-party services on our site.",
    content: [
      {
        subtitle: "Analytics Services",
        details: "We use Google Analytics to collect information about how visitors use our website. The cookies collect information in an anonymous form, including the number of visitors to the site, where visitors have come from, and the pages they visited. We use this information to compile reports and to help us improve the site."
      },
      {
        subtitle: "Advertising Partners",
        details: "Our advertising partners may use cookies to deliver personalized advertisements. These companies may use information about your visits to this and other websites to provide relevant advertisements about goods and services that may interest you. They may also use technology to measure the effectiveness of advertisements."
      },
      {
        subtitle: "Social Media Cookies",
        details: "We use social media plugins that allow you to connect with your social network in various ways. These plugins may set cookies that can track your browsing activity. We recommend reviewing the respective privacy policies of these social networks for information about their cookies."
      },
      {
        subtitle: "Embedded Content",
        details: "Our site may include embedded content (e.g., videos, maps, etc.) from other websites. Embedded content behaves in the exact same way as if the visitor has visited the other website. These websites may collect data about you, use cookies, embed additional third-party tracking, and monitor your interaction with that embedded content."
      }
    ]
  },
  {
    icon: Settings,
    title: "Managing Your Preferences",
    description: "How you can control and manage cookie settings.",
    content: [
      {
        subtitle: "Browser Settings",
        details: "Most web browsers allow you to control cookies through their settings preferences. You can set your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service. Each browser is different, so check the 'Help' menu of your browser to learn how to change your cookie preferences."
      },
      {
        subtitle: "Cookie Consent Tool",
        details: "We provide a cookie consent management tool that allows you to customize your cookie preferences. You can access this tool at any time by clicking the 'Cookie Settings' link in our website footer. The tool allows you to enable or disable different categories of cookies according to your preferences."
      },
      {
        subtitle: "Opt-Out Options",
        details: "For third-party advertising cookies, you can opt-out through the following resources: Digital Advertising Alliance (www.aboutads.info), Network Advertising Initiative (www.networkadvertising.org), and European Interactive Digital Advertising Alliance (www.youronlinechoices.eu). Please note that opting out does not mean you will no longer receive online advertising, but rather that the ads you see will not be personalized."
      },
      {
        subtitle: "Do Not Track Signals",
        details: "Our website does not currently respond to 'Do Not Track' browser settings or signals. However, you can control tracking through the cookie settings as described above. We are monitoring developments around DNT browser technology and may implement a solution in the future."
      }
    ]
  },
  {
    icon: Clock,
    title: "Cookie Duration & Retention",
    description: "Information about how long cookies remain on your device.",
    content: [
      {
        subtitle: "Session Cookies",
        details: "Session cookies are temporary cookies that remain on your device until you close your web browser. We use session cookies to support specific functionality during your browsing session, such as maintaining your logged-in status or remembering items in your shopping cart. These cookies are automatically deleted when you close your browser."
      },
      {
        subtitle: "Persistent Cookies",
        details: "Persistent cookies remain on your device for a set period specified in the cookie. We use persistent cookies to remember your preferences when you return to our website. The lifespan of persistent cookies varies: some expire after a few days, while others may remain for several years unless manually deleted."
      },
      {
        subtitle: "Cookie Lifespan by Category",
        details: "The lifespan of our cookies varies based on their purpose: Essential cookies typically last for the duration of your session; Performance cookies are usually retained for 1-2 years; Functionality cookies may remain for up to 1 year; Targeting cookies are generally stored for 1-2 years. You can see the specific lifespan of each cookie in our detailed cookie list."
      }
    ]
  },
  {
    icon: AlertTriangle,
    title: "Important Considerations",
    description: "Additional information you should know about our cookie usage.",
    content: [
      {
        subtitle: "Cookie Security",
        details: "We take appropriate security measures to protect cookies from unauthorized access. Our cookies do not store sensitive personal information such as credit card details. However, we recommend that you take steps to protect your personal information online, including using strong passwords and keeping your login credentials confidential."
      },
      {
        subtitle: "Children's Privacy",
        details: "Our website is not directed to children under 16. We do not knowingly collect personal information from children under 16. If we become aware that a child under 16 has provided us with personal information, we will take steps to delete such information. If you believe we might have any information from a child under 16, please contact us."
      },
      {
        subtitle: "Policy Updates",
        details: "We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. When we make significant changes, we will notify you through our website or by other means prior to the change becoming effective. We encourage you to periodically review this page for the latest information on our cookie practices."
      }
    ]
  }
];

export default function CookiePolicy() {
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
      {/* Header with reduced top space */}
      <section className="py-10 md:py-12 relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
                <Cookie className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Cookie &{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    Policy
                  </span>
                </h1>
              </div>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
              This Cookie Policy outlines how Padak Digital Marketing Partner uses cookies and similar 
              technologies on our website. Please read this policy to understand our practices.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                <span>Last Updated: January 2025</span>
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

      {/* Cookie Policy Sections */}
      <section className="py-10 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {cookieSections.map((section, index) => (
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
                      By continuing to use our website, you consent to our use of cookies as described in this policy. 
                      If you do not agree with our cookie practices, you can adjust your preferences using the Cookie Settings 
                      or refrain from using our website.
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
                Privacy{" "}
                <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                  Questions?
                </span>
              </h2>
            </div>
            <p className="text-lg md:text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
              If you have any questions about our Cookie Policy or privacy practices, 
              our privacy team is here to assist you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                asChild
                size="lg" 
                className="bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <a href="mailto:privacy@padak.com">
                  <Gavel className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Contact Privacy Team
                </a>
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white transition-all duration-300"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Download Policy
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}