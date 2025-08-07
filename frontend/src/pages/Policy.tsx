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
  CheckCircle,
  GraduationCap,
  Video,
  FileCheck,
  Smartphone,
  Share2,
  ScrollText,
  AlertCircle,
  Scale,
  ExternalLink,
  Clock
} from "lucide-react";

// This is a simplified version of the privacy policy with just a few sections
// For brevity, I'm only showing the structure with shorter content
const privacySections = [
  {
    icon: Eye,
    title: "Information We Collect",
    description: "Personal and educational information we collect when you use our services.",
    content: [
      {
        subtitle: "Personal Identification Information",
        details: "We collect personal information necessary for our services, including but not limited to your full legal name, email address, phone number, physical address, date of birth, nationality, government-issued identification (when required for certification verification purposes), profile photos, educational history, and professional background. This information is collected during account creation, course enrollment, internship applications, service requests, or when you otherwise interact with our services. We may collect this information through our websites, mobile applications, enrollment forms, contracts, or communications with our representatives."
      },
      {
        subtitle: "Educational and Performance Data",
        details: "For students enrolled in our courses and internships, we collect comprehensive educational data including but not limited to attendance records, assignment submissions, grades and assessment scores, feedback on work, participation metrics in online sessions, progress reports, completed projects, skills assessments, peer review inputs, internship performance evaluations, and certification status. This information is essential for providing our educational services, monitoring student progress, and issuing valid certifications. We may also collect information about your learning preferences, pace, and areas where you may need additional support to personalize your educational experience."
      },
      {
        subtitle: "Account and Authentication Information",
        details: "When you create or maintain an account on our platforms or services, we collect and process account credentials (username, password hashes, security questions/answers), account preferences, account activity logs (including login times, session duration, features used), notification settings, and subscription preferences. We may also collect multi-factor authentication details when enabled. This information is necessary to secure your account, prevent unauthorized access, personalize your experience, and investigate potential misuse of our services. For security purposes, we may also log IP addresses, device identifiers, and geolocation data associated with account activities."
      },
      {
        subtitle: "Business and Service-Specific Information",
        details: "When providing business services such as digital marketing, web development, or social media management, we collect information relevant to these services. This may include business details (company name, industry, business registration information), website credentials and access keys (when authorized for services like hosting or development), social media account access (when authorized for management services), business objectives and KPIs, target audience information, brand guidelines, marketing preferences, design assets, content requirements, competitive analysis information, and performance analytics. For web and app development services, we collect technical requirements, hosting preferences, domain information, user experience expectations, and functional specifications."
      },
      {
        subtitle: "Payment and Financial Information",
        details: "To process payments for our services, we collect payment information which may include credit/debit card details, bank account information, billing addresses, payment histories, invoicing preferences, and transaction records. Financial information is processed in compliance with applicable payment card industry standards (PCI DSS) and financial regulations. While we store transaction records for accounting and legal purposes, full payment details are typically processed through secure third-party payment processors and not stored directly on our systems."
      },
      {
        subtitle: "Technical and Usage Information",
        details: "We automatically collect technical data when you interact with our websites, applications, and online learning platforms. This includes IP addresses, browser type and version, operating system, device information, screen resolution, language preferences, referring/exit pages, clickstream data, pages visited, time spent on pages, features used, actions taken within our platforms, error logs, crash reports, and unique device identifiers. We use this information to ensure proper functioning of our services, troubleshoot technical issues, analyze usage patterns, improve user experience, and secure our systems. Collection occurs through server logs, cookies, pixels, web beacons, and similar technologies."
      },
      {
        subtitle: "Communications and Feedback",
        details: "We collect and store communications you have with us, including email correspondence, chat logs, support tickets, phone call recordings (with notice), survey responses, testimonials, feedback forms, and customer service interactions. This information helps us respond to your inquiries, resolve issues, improve our services based on feedback, train our staff, maintain records of our communications for quality assurance, and document service requests or changes to your account."
      },
      {
        subtitle: "Third-Party Platform Information",
        details: "When you interact with our content on third-party platforms (such as social media networks) or access our services through third-party integrations (such as single sign-on), we may collect information from these platforms in accordance with their privacy settings and your permissions. This may include profile information, engagement metrics, social connections, and other data made available through these platforms' APIs. Similarly, when using third-party tools integrated into our educational offerings (such as coding environments, design tools, or digital marketing platforms), information may be collected through these integrations."
      }
    ]
  },
  {
    icon: GraduationCap,
    title: "Educational Services Data",
    description: "How we handle information related to our courses and internships.",
    content: [
      {
        subtitle: "Online Learning Environment Data",
        details: `Our educational platforms collect detailed data about your learning activities to facilitate effective education. This includes but is not limited to course progress indicators, module completion status, quiz and assessment results, time spent on various learning materials, interactive exercise responses, discussion forum contributions, peer interactions, project submissions, and personalized learning pathways.`
      },
      {
        subtitle: "Virtual Classroom and Meeting Recordings",
        details: `We record online learning sessions, workshops, and virtual classrooms conducted via platforms such as Google Meet, Zoom, Microsoft Teams, or other video conferencing tools. These recordings capture audio, video, shared screens, chat messages, interactive whiteboard content, polling responses, breakout room sessions, and participant engagement metrics.`
      },
      {
        subtitle: "Certification and Credential Information",
        details: `To create, issue, and verify legitimate certificates and credentials, we collect and process comprehensive certification data. This includes your full legal name (as you wish it to appear on credentials), unique student identifier, course or program details, completion date, achievement level, assessment scores, competencies demonstrated, accreditation information, digital signature verification data, and credential expiration dates (if applicable).`
      }
    ]
  },
  {
    icon: Database,
    title: "How We Use Your Information",
    description: "The purposes for which we process your personal information.",
    content: [
      {
        subtitle: "Delivering Educational Services and Programs",
        details: `We use your personal and educational information to deliver comprehensive educational services including course instruction, internship coordination, skills assessment, personalized feedback, progress tracking, and certification. This processing is necessary to fulfill our contractual obligations to you as a student or participant.`
      },
      {
        subtitle: "Providing Digital Marketing and Business Services",
        details: `For clients using our professional services such as digital marketing, web development, and social media management, we process your information to create, implement, manage, and optimize your digital presence and marketing strategies.`
      },
      {
        subtitle: "Account Management and Service Administration",
        details: `We use your information for essential account management and administrative functions including creating and maintaining your user accounts, authenticating your identity when you log in, processing your payments and managing billing, generating invoices and receipts, tracking service usage entitlements, implementing your account preferences, sending service notifications about maintenance or updates, responding to account-related inquiries, troubleshooting technical issues, preventing and detecting fraudulent account activities, enforcing our terms of service, and facilitating secure account recovery procedures when needed.`
      }
    ]
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    description: "How we use cookies and similar technologies on our websites and learning platforms.",
    content: [
      {
        subtitle: "Types of Cookies We Use",
        details: `We use various types of cookies and similar technologies on our websites and educational platforms to enable functionality, enhance security, and improve user experience. Essential cookies are necessary for core website functions and security, including session management, authentication, load balancing, and basic platform functionality - these cookies cannot be disabled as they are required for services you request.`
      },
      {
        subtitle: "Consent and Control",
        details: `We respect your preferences regarding cookies and tracking technologies. When you first visit our website, you'll see a cookie consent banner that allows you to choose which non-essential cookies you accept. You can change these preferences at any time through our Cookie Preferences Center accessible from the site footer. Your preferences are stored in a cookie, so if you clear your cookies, you'll need to reset your preferences. For essential cookies that are strictly necessary for basic site functionality and security, consent is not required as the site cannot function properly without them. For all other cookie types, we obtain your consent before setting them. Even after providing consent, you maintain control through browser settings that can block or delete cookies, though this may impact site functionality. Most browsers also offer a "Do Not Track" setting, which we honor by disabling analytics and marketing tracking for users who enable this setting.`
      },
      {
        subtitle: "Analytics and Performance Measurement",
        details: `We use analytics tools to collect aggregated, anonymized data about how visitors interact with our websites and educational platforms. This information helps us identify which content and features are most valuable to users, discover usability issues that need improvement, optimize page loading and performance, understand typical user journeys through our sites, identify where users encounter difficulties or abandon processes, measure the effectiveness of different educational approaches, allocate development resources to high-impact improvements, and make data-driven decisions about content and feature development.`
      }
    ]
  },
  {
    icon: Settings,
    title: "Your Rights & Choices",
    description: "Your rights regarding your personal information and how to exercise them.",
    content: [
      {
        subtitle: "Right to Access Your Information",
        details: `You have the right to request access to the personal information we hold about you. This includes the right to: obtain confirmation that we are processing your data; receive a copy of your personal information in a structured, commonly used, and machine-readable format; know the categories of personal information we collect about you; understand the purposes for which we process your information; identify recipients or categories of recipients with whom we share your information; learn the sources from which we obtained your information (except where protected by confidentiality); understand the logic involved in any automated decision-making that has a significant effect on you; and know how long we retain different categories of your data.`
      },
      {
        subtitle: "Right to Correction and Completion",
        details: `You have the right to request correction of inaccurate personal information we maintain about you and to have incomplete personal information completed. This includes correcting factual errors in your contact information, account details, educational records, or other information we process.`
      },
      {
        subtitle: "Right to Deletion",
        details: `You have the right to request deletion of your personal information in certain circumstances, subject to legal and contractual exceptions. This is sometimes called the 'right to be forgotten.' When you request deletion, we will remove your personal information from our active systems where possible, unless retention is necessary to: comply with legal obligations; detect security incidents or protect against fraud; fix errors in functionality; enable solely internal uses aligned with your expectations; complete a transaction for which the information was collected; fulfill our contract with you; or other internal, lawful uses compatible with the context in which you provided the information.`
      }
    ]
  },
  {
    icon: Globe,
    title: "Contact Us",
    description: "How to reach our privacy team with questions or concerns.",
    content: [
      {
        subtitle: "Privacy Team",
        details: `If you have any questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact our Privacy Team at privacy@padak.com or through the contact form on our website. Our dedicated privacy professionals will respond to your inquiry promptly, typically within 3-5 business days.`
      },
      {
        subtitle: "Data Protection Officer",
        details: `For formal privacy concerns or to exercise your data protection rights, you can contact our Data Protection Officer at dpo@padak.com or by mail at: Data Protection Officer, Padak Inc., [Company Address].`
      },
      {
        subtitle: "Regional Representatives",
        details: `For users in specific regions, we have appointed local privacy representatives as required by applicable law. Contact information for these representatives is available upon request from our Privacy Team.`
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
              At Padak, your branding partner, we are committed to protecting your privacy and ensuring 
              the security of your personal information while delivering our educational and digital services.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Last Updated: August 2025</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Applies Globally</span>
              </div>
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-orange-500" />
                <span>Compliant with Data Protection Regulations</span>
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
              If you have any questions about this Privacy Policy or how we handle your information 
              for courses, internships, or digital services, please contact our Privacy Team.
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