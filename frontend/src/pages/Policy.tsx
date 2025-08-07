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
  ScrollText
} from "lucide-react";

const privacySections = [
  {
    icon: Eye,
    title: "Information We Collect",
    description: "Personal and educational information we collect when you use our services.",
    content: [
      {
        subtitle: "Student/Client Information",
        details: "We collect personal information necessary for course enrollment, internships, and certification including your full name, email address, phone number, education history, professional background, and profile photo where applicable."
      },
      {
        subtitle: "Educational Data",
        details: "For students in our courses and internships, we may collect attendance records, assignment submissions, performance evaluations, progress data, and participation in virtual meetings and discussions."
      },
      {
        subtitle: "Account Information",
        details: "When you create an account on our platforms or services, we collect login credentials, profile information, and activity logs to secure and personalize your experience."
      },
      {
        subtitle: "Service-Specific Information",
        details: "Depending on the services you use (such as digital marketing, web development, or social media management), we may collect relevant business information, website access credentials, social media account details, and performance analytics."
      },
      {
        subtitle: "Technical Information",
        details: "We automatically collect technical data including IP address, device information, browser type, operating system, pages visited, and session duration when you interact with our websites and platforms."
      }
    ]
  },
  {
    icon: GraduationCap,
    title: "Educational Services Data",
    description: "How we handle information related to our courses and internships.",
    content: [
      {
        subtitle: "Online Meeting Records",
        details: "We may record online learning sessions via Google Meet, Zoom, or other platforms for educational purposes, quality control, and to provide access to students who missed live sessions. You will be notified before recording begins."
      },
      {
        subtitle: "Certification Information",
        details: "We collect and process necessary personal information to create and issue certificates, including your full name, course completion date, and unique identification details to verify authenticity."
      },
      {
        subtitle: "Internship Placement",
        details: "For internship programs, we collect and may share with potential placement partners relevant information including your resume, skills assessment, and professional interests to facilitate appropriate placements."
      },
      {
        subtitle: "Course Materials",
        details: "We track your access and engagement with course materials, resources, and learning platforms to improve our educational offerings and personalize your learning experience."
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
        details: "We use your information to provide our courses, internships, and digital services, manage your accounts, process payments, and fulfill our contractual obligations to you."
      },
      {
        subtitle: "Personalized Learning",
        details: "For educational services, we analyze your progress and engagement to customize your learning experience, provide feedback, and recommend relevant resources or courses."
      },
      {
        subtitle: "Business Services",
        details: "For clients using our digital marketing, web development, or social media services, we use your information to create, manage, and optimize your digital assets and marketing campaigns."
      },
      {
        subtitle: "Communication",
        details: "We contact you with service-related information, educational updates, feedback on assignments, upcoming sessions, and marketing communications about our services (with your consent)."
      },
      {
        subtitle: "Certification & Verification",
        details: "We use your personal information to create, issue, and verify certificates of completion for our courses and training programs."
      }
    ]
  },
  {
    icon: Users,
    title: "Information Sharing",
    description: "How and when we share your information with third parties.",
    content: [
      {
        subtitle: "Educational Partners",
        details: "We may share your information with educational partners, instructors, and mentors directly involved in delivering our courses and internship programs."
      },
      {
        subtitle: "Service Providers",
        details: "We use trusted third-party service providers for hosting, learning management systems, video conferencing platforms, payment processing, email communication, and analytics tools."
      },
      {
        subtitle: "Digital Service Platforms",
        details: "When providing digital marketing, hosting, or app publishing services, we may need to share your information with relevant platforms such as Google Ads, Meta Ads, app stores, or hosting providers."
      },
      {
        subtitle: "Potential Employers",
        details: "For internship programs, and only with your explicit consent, we may share your profile, resume, and performance information with potential employers or placement partners."
      },
      {
        subtitle: "Legal Requirements",
        details: "We may disclose information when required by law, to protect our rights, or to comply with legal proceedings, court orders, or legitimate government requests."
      }
    ]
  },
  {
    icon: Video,
    title: "Video Conferencing & Online Sessions",
    description: "Policies regarding our online educational sessions and meetings.",
    content: [
      {
        subtitle: "Session Recordings",
        details: "We may record online sessions for educational purposes and quality assurance. Recordings may include audio, video, chat messages, and shared screens. Students will be notified before recording begins."
      },
      {
        subtitle: "Participation Data",
        details: "During online sessions, we collect attendance data, participation metrics, and engagement information to improve our teaching methods and assess student performance."
      },
      {
        subtitle: "Third-Party Platforms",
        details: "We use platforms like Google Meet, Zoom, and Microsoft Teams for online sessions. Your use of these platforms is also subject to their respective privacy policies and terms of service."
      },
      {
        subtitle: "Recording Access & Retention",
        details: "Recordings are stored securely and made available only to enrolled students and authorized staff. We retain recordings for a reasonable period to fulfill educational purposes and then securely delete them."
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
        details: "We implement industry-standard security measures including encryption, secure servers, firewalls, and access controls to protect your personal and educational information."
      },
      {
        subtitle: "Access Controls",
        details: "We restrict access to personal information to employees, contractors, and service providers who need it to deliver our services and are bound by confidentiality obligations."
      },
      {
        subtitle: "Educational Content Security",
        details: "Course materials, recordings, and student submissions are protected with appropriate access controls to ensure only authorized individuals can access them."
      },
      {
        subtitle: "Third-Party Security",
        details: "We carefully select service providers and ensure they maintain appropriate security standards for handling your information, especially for educational data and certification information."
      },
      {
        subtitle: "Breach Notification",
        details: "In the unlikely event of a data breach affecting your personal information, we will notify you in accordance with applicable laws and take appropriate measures to minimize potential harm."
      }
    ]
  },
  {
    icon: Cookie,
    title: "Cookies & Tracking",
    description: "How we use cookies and similar technologies on our websites and learning platforms.",
    content: [
      {
        subtitle: "Essential Cookies",
        details: "We use necessary cookies to ensure our websites and learning platforms function properly, including authentication, security, and remembering your preferences."
      },
      {
        subtitle: "Educational Analytics",
        details: "With your consent, we use cookies to track your learning progress, course engagement, and platform usage to improve our educational offerings and user experience."
      },
      {
        subtitle: "Marketing Cookies",
        details: "We may use marketing cookies to provide you with relevant information about our courses and services based on your interests and browsing behavior, always with your explicit consent."
      },
      {
        subtitle: "Third-Party Cookies",
        details: "Our sites may include cookies from third-party services such as Google Analytics, video platforms, or social media features. These third parties may collect information about your online activities across different websites."
      }
    ]
  },
  {
    icon: Smartphone,
    title: "Mobile Apps & Development",
    description: "Privacy practices related to our Android development and app publishing services.",
    content: [
      {
        subtitle: "App Development Services",
        details: "When developing mobile apps for clients, we handle app data, design assets, and business logic according to strict confidentiality standards and data protection principles."
      },
      {
        subtitle: "App Store Publishing",
        details: "For app publishing services, we may collect and process information needed for app store submissions, including developer accounts, certificates, and business verification details."
      },
      {
        subtitle: "App Analytics",
        details: "We may implement analytics in developed apps to help clients understand user behavior and app performance. These analytics are configured according to client requirements and applicable privacy laws."
      },
      {
        subtitle: "Mobile Data Processing",
        details: "Any personal data processed within mobile apps we develop is handled according to industry best practices and relevant data protection regulations, with appropriate disclosures to end-users."
      }
    ]
  },
  {
    icon: Share2,
    title: "Social Media & Digital Marketing",
    description: "Privacy practices for our social media management and digital marketing services.",
    content: [
      {
        subtitle: "Account Access",
        details: "When providing social media management services, we require access to your business accounts. We maintain strict security protocols for handling these credentials and access rights."
      },
      {
        subtitle: "Marketing Campaigns",
        details: "For digital marketing services, we collect and analyze campaign performance data, audience insights, and conversion metrics to optimize your marketing strategy and ROI."
      },
      {
        subtitle: "Advertising Platforms",
        details: "When managing Google Ads, Meta Ads, and other advertising platforms on your behalf, we process audience data, campaign settings, and performance metrics in accordance with the platforms' terms and applicable privacy laws."
      },
      {
        subtitle: "Content Creation",
        details: "Personal information or images included in content we create for your social media profiles or marketing campaigns is processed according to your instructions and with appropriate rights clearances."
      }
    ]
  },
  {
    icon: Settings,
    title: "Your Rights & Choices",
    description: "Your rights regarding your personal information and how to exercise them.",
    content: [
      {
        subtitle: "Access & Portability",
        details: "You have the right to access your personal information, request a copy of data we hold about you, and receive it in a structured, commonly used format."
      },
      {
        subtitle: "Correction & Deletion",
        details: "You can request correction of inaccurate information or deletion of your personal data, subject to legal and contractual obligations, including educational records we may be required to maintain."
      },
      {
        subtitle: "Consent Management",
        details: "You can manage your communication preferences and withdraw consent for marketing at any time. For educational services, you can control your privacy settings within our learning platforms."
      },
      {
        subtitle: "Student-Specific Rights",
        details: "Students in our courses have additional rights regarding their educational records, including the right to request review and amendment of their academic information and participation data."
      },
      {
        subtitle: "Exercising Your Rights",
        details: "To exercise any of these rights, please contact our privacy team using the contact information provided at the end of this policy. We will respond to your request within the timeframe required by applicable law."
      }
    ]
  },
  {
    icon: ScrollText,
    title: "Data Retention & Deletion",
    description: "How long we keep your information and our deletion practices.",
    content: [
      {
        subtitle: "Educational Records",
        details: "We retain student records, course completion data, and certification information for the period necessary to fulfill educational purposes and comply with legal obligations, typically for 5-7 years after course completion."
      },
      {
        subtitle: "Account Information",
        details: "We keep your account information for as long as your account is active. After account closure, we retain certain information as needed for legal, business, or tax purposes."
      },
      {
        subtitle: "Service Data",
        details: "For digital services like web development and social media management, we retain relevant data for the duration of our service agreement plus a reasonable period afterward for transition, backup, and legal purposes."
      },
      {
        subtitle: "Marketing Information",
        details: "If you've consented to marketing communications, we keep your contact information until you withdraw consent or request deletion."
      },
      {
        subtitle: "Secure Deletion",
        details: "When we delete data, we use secure deletion methods designed to ensure information cannot be recovered or reconstructed."
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