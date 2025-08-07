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
  {
    icon: Handshake,
    title: "Acceptance of Terms",
    description: "By accessing and using our services, you agree to be bound by these terms and conditions.",
    content: [
      {
        subtitle: "Agreement Formation",
        details: `These Terms and Conditions constitute a legally binding agreement between you and Padak, your branding partner. By accessing our website, enrolling in our courses, applying for internships, or using any of our services, you acknowledge that you have read, understood, and agree to be bound by these terms.

        Your use of our website or services indicates your acceptance of these terms in their entirety. If you disagree with any part of these terms, you must not use our services.
        
        This agreement supersedes any prior agreements or understandings regarding the subject matter herein.`
      },
      {
        subtitle: "Capacity to Contract",
        details: `You represent that you are at least 18 years old and have the legal capacity to enter into this agreement. If you are under 18 but at least 16 years old, you may use our services only with involvement and consent from a parent or guardian.

        If you are accepting these terms on behalf of a company or organization, you warrant that you have the authority to bind that entity to these terms. You accept responsibility for all activities that occur under your account.
        
        For educational services and internships, additional eligibility requirements may apply as specified in program-specific documentation.`
      },
      {
        subtitle: "Updates and Changes",
        details: `We reserve the right to modify these terms at any time at our sole discretion. Significant changes will be notified to you through email or prominent notice on our website at least 14 days before they take effect.

        Continued use of our services after such modifications constitutes acceptance of the updated terms. It is your responsibility to review these terms periodically to stay informed of any updates.
        
        If you do not agree with the revised terms, you may discontinue using our services, subject to any existing contractual obligations or commitments.`
      }
    ]
  },
  {
    icon: Users,
    title: "Service Description",
    description: "Overview of the comprehensive services we provide and their scope.",
    content: [
      {
        subtitle: "Digital Marketing and Branding Services",
        details: `Padak provides comprehensive digital marketing services including but not limited to SEO optimization, social media marketing, PPC advertising, content marketing, analytics, email marketing, and conversion rate optimization. Our goal is to enhance your brand visibility and drive measurable results for your business.

        Each marketing service is tailored to your specific business needs, industry, target audience, and objectives. We employ industry best practices, ethical marketing techniques, and data-driven strategies to maximize your ROI.
        
        While we strive for optimal results, specific outcomes such as rankings, engagement rates, or conversion metrics cannot be guaranteed due to the dynamic nature of digital platforms, algorithm changes, and market conditions.`
      },
      {
        subtitle: "Educational Courses and Internships",
        details: `We offer structured educational courses and internship programs in digital marketing, graphic design, web development, video editing, and related fields. These programs are designed to provide both theoretical knowledge and practical skills through live online sessions, assignments, projects, and assessments.

        Course details including duration, curriculum, assessment methods, certification requirements, and fees are specified in course-specific documentation provided prior to enrollment. Completion of all requirements is necessary for certification.
        
        Internship programs may include placement opportunities with partner organizations. While we facilitate these placements, acceptance is subject to the partner organization's requirements and selection process. Internship terms are outlined in separate internship agreements.`
      },
      {
        subtitle: "Development and Creative Services",
        details: `Our development services include web development, Android application development, hosting services, graphic design, and video editing. These services are performed according to project specifications agreed upon with clients.

        Web and application development projects follow defined development processes including requirement gathering, design, development, testing, and deployment phases. Deliverables, timelines, and acceptance criteria are specified in project-specific agreements.
        
        Graphic design and video editing services are provided with specified revision limits as outlined in service agreements. Additional revisions beyond the agreed limit may incur additional charges.
        
        Hosting services include server configuration, maintenance, security monitoring, and technical support as detailed in hosting service agreements.`
      }
    ]
  },
  {
    icon: BookOpen,
    title: "Educational Programs",
    description: "Terms specific to our courses, training, and internship programs.",
    content: [
      {
        subtitle: "Enrollment and Registration",
        details: `Course enrollment requires completion of registration forms and payment of applicable fees. Registration is confirmed only upon receipt of payment and all required documentation. We reserve the right to refuse enrollment at our discretion.

        Course materials, access credentials, and schedules will be provided after successful registration. These materials are for your personal use only and subject to intellectual property protections as outlined in these terms.
        
        You are responsible for ensuring your technical setup meets our requirements for participating in online sessions. This includes appropriate hardware, software, and internet connectivity as specified in course documentation.`
      },
      {
        subtitle: "Attendance and Participation",
        details: `Regular attendance and active participation in scheduled sessions are expected and may impact your assessment. Our attendance policy requires at least 80% attendance for course completion and certification eligibility.

        Online sessions may be recorded for educational purposes and made available to enrolled students. By participating in these sessions, you consent to such recording unless you explicitly notify the instructor of your objection before the session begins.
        
        Assignments and projects must be submitted by the specified deadlines. Late submissions may result in grade penalties or rejection at the instructor's discretion. Extension requests must be made in advance with valid justification.`
      },
      {
        subtitle: "Certification and Assessment",
        details: `Certification requires successful completion of all course requirements including assignments, projects, assessments, and minimum attendance. Certification criteria are specified in course documentation provided upon enrollment.

        Assessments are conducted fairly and transparently according to predefined criteria. Grades and feedback are provided within reasonable timeframes after submission deadlines.
        
        We maintain comprehensive academic integrity standards. Plagiarism, cheating, or any form of academic dishonesty may result in failure of the assignment/course or dismissal from the program without refund. We use plagiarism detection tools to verify the originality of submissions.
        
        Certificates issued upon successful completion are verifiable through our verification system. We maintain records of certified students to support verification requests from employers or other institutions with your consent.`
      }
    ]
  },
  {
    icon: CreditCard,
    title: "Payment Terms",
    description: "Billing, payment schedules, and financial obligations for our services.",
    content: [
      {
        subtitle: "Fee Structure and Payment Schedule",
        details: `Service fees are outlined in service agreements, course enrollment documentation, or published price lists. All fees are stated in the specified currency and subject to applicable taxes which will be clearly indicated.

        For one-time services, full payment is typically required upon project completion or as specified in the service agreement. For ongoing services, payments are structured monthly, quarterly, or annually based on the service agreement.
        
        Educational program fees must be paid according to the payment schedule provided during enrollment. This may include one-time payment, installment plans, or other arrangements as specified.`
      },
      {
        subtitle: "Accepted Payment Methods",
        details: `We accept various payment methods including bank transfers, credit/debit cards, and digital payment platforms. Payment details and instructions are provided with invoices or during the checkout process.

        All payments must be made in the currency specified in your invoice or service agreement. Currency conversion charges, if any, are your responsibility.
        
        For recurring services, we may offer automatic payment options. By selecting such options, you authorize us to charge the specified payment method according to the agreed schedule until the service is cancelled or the payment method is changed.`
      },
      {
        subtitle: "Late Payments and Financial Policies",
        details: `Payments are due on the dates specified in invoices or service agreements. Late payments may incur additional fees at a rate of 1.5% per month on outstanding balances or as specified in your agreement.

        We reserve the right to suspend services for accounts with payments overdue by 30 days or more. Service resumption after suspension requires payment of all outstanding balances and may include a reactivation fee.
        
        For educational programs, continued access to course materials, sessions, and assessments is contingent upon maintaining payments according to the agreed schedule. Certification may be withheld until all financial obligations are fulfilled.
        
        Dishonored payments due to insufficient funds or other reasons may incur an administrative fee in addition to any fees charged by payment providers or banks.`
      }
    ]
  },
  {
    icon: Shield,
    title: "Client Responsibilities",
    description: "Your obligations and responsibilities when working with our team.",
    content: [
      {
        subtitle: "Information and Access Provision",
        details: `You agree to provide accurate, complete, and timely information necessary for us to perform our services. This includes business details, marketing objectives, design preferences, technical specifications, and any other information reasonably required.

        For services requiring access to your accounts (such as website hosting, social media, or analytics platforms), you are responsible for providing appropriate access credentials and maintaining their security. We recommend creating role-based access where possible rather than sharing primary account credentials.
        
        You must ensure all information provided is factually correct, does not infringe on third-party rights, and complies with all applicable laws and regulations. We are not responsible for verifying the accuracy or legality of information you provide.`
      },
      {
        subtitle: "Review and Feedback",
        details: `You are responsible for reviewing deliverables and providing clear, timely feedback within the timeframes specified in project plans or service agreements. Delays in review or feedback may impact project timelines and deliverables.

        Approval of designs, content, campaigns, or other deliverables constitutes acceptance of those elements. Subsequent revision requests beyond agreed revision limits may incur additional charges.
        
        For time-sensitive campaigns or content, we establish approval deadlines. In the absence of timely approval or feedback, we may proceed with publication based on previously approved materials or delay publication until approval is received, depending on the project requirements.`
      },
      {
        subtitle: "Compliance and Ethical Standards",
        details: `You warrant that your business, products, services, and content comply with all applicable laws, regulations, and industry standards. This includes but is not limited to advertising regulations, data protection laws, intellectual property rights, and consumer protection laws.

        You are responsible for ensuring that your marketing claims are truthful, substantiated, and compliant with relevant advertising standards. We reserve the right to refuse implementation of content or campaigns that we reasonably believe violate laws or ethical standards.
        
        For regulated industries or content categories (such as financial services, healthcare, or age-restricted products), you must inform us of specific compliance requirements and provide necessary disclaimers or disclosures that must be included in marketing materials.
        
        You agree not to use our services for any illegal, fraudulent, or unethical purposes. We reserve the right to terminate services immediately if we have reasonable belief that our services are being used for such purposes.`
      }
    ]
  },
  {
    icon: Code,
    title: "Development Services",
    description: "Terms specific to web development, app development, and technical services.",
    content: [
      {
        subtitle: "Project Specifications and Scope",
        details: `Web and app development projects are governed by detailed specifications agreed upon before project commencement. These specifications define the scope, functionality, design requirements, and deliverables for the project.

        Changes to project specifications after project initiation must be documented and may affect timeline and costs. A formal change request process will be used to evaluate, approve, and implement changes to the original scope.
        
        Unless explicitly included in the project specifications, certain items are considered outside the scope, including content creation, ongoing maintenance, third-party integration fees, and extended support beyond the specified warranty period.`
      },
      {
        subtitle: "Development Process and Milestones",
        details: `Our development process follows industry standard phases including discovery, design, development, testing, and deployment. Each phase includes defined milestones and deliverables as outlined in the project plan.

        Client review and approval is required at key milestones. Development proceeds to the next phase only after written approval of the current phase deliverables. Delays in providing feedback or approval may impact the overall project timeline.
        
        For complex projects, we use staging environments for client review before final deployment. The staging environment is provided for a limited time as specified in the project agreement, after which additional staging time may incur maintenance fees.`
      },
      {
        subtitle: "Hosting, Maintenance, and Technical Support",
        details: `Hosting services include server space, bandwidth, and basic configuration as specified in hosting agreements. Server specifications, uptime guarantees, backup frequency, and security measures are detailed in service-specific documentation.

        Maintenance services, when included, cover software updates, security patches, and technical troubleshooting. They do not include new feature development, content updates, or issues caused by third-party modifications unless explicitly specified.
        
        Technical support is provided during specified business hours through designated communication channels. Emergency support options, response time commitments, and escalation procedures are outlined in service level agreements.
        
        For app publishing services, we assist with submission to app stores but cannot guarantee approval by third-party platforms. App store fees, developer account requirements, and compliance with platform policies remain your responsibility.`
      }
    ]
  },
  {
    icon: Palette,
    title: "Creative Services",
    description: "Terms for graphic design, content creation, and creative deliverables.",
    content: [
      {
        subtitle: "Design Process and Revisions",
        details: `Our graphic design services follow a structured process including requirement gathering, concept development, initial designs, and refinement. Each project includes a specified number of revision rounds as detailed in your service agreement.

        Initial concepts are presented based on your requirements and brand guidelines. You are expected to provide clear feedback on these concepts to guide the refinement process. Vague feedback such as "I don't like it" without specific direction may count as a revision round.
        
        Additional revision rounds beyond those included in the service agreement will incur additional charges at our standard hourly rates. Major conceptual changes after initial approval may be treated as new projects with associated costs.`
      },
      {
        subtitle: "Content Ownership and Usage Rights",
        details: `Upon full payment for design services, you receive ownership rights to the final deliverables for the specific uses outlined in the service agreement. We retain the intellectual property rights to preliminary concepts, drafts, and unused designs.

        Unless explicitly specified otherwise, we retain the right to display your final designs in our portfolio, case studies, and promotional materials as examples of our work. If you require confidentiality or restricted portfolio usage, this must be negotiated before project commencement.
        
        For designs incorporating licensed elements (such as stock photos, fonts, or illustrations), you receive rights to use these elements within the final deliverable, but separate licenses may be required for other uses. We provide information about any licensed elements used in your projects.`
      },
      {
        subtitle: "Video Production and Editing",
        details: `Video services include pre-production planning, filming (if applicable), editing, and post-production as specified in project agreements. The number of included revision rounds is specified in your service agreement.

        You are responsible for providing necessary content, approvals, and feedback according to the production schedule. Delays in providing these may impact project timelines.
        
        For projects requiring filming, you are responsible for securing necessary permissions for filming locations, securing releases from individuals appearing in videos, and ensuring compliance with relevant regulations.
        
        Final video files are provided in agreed formats and resolutions. Additional format conversions or resolutions beyond those specified may incur additional charges. We maintain backup copies of project files for a limited period as specified in service agreements.`
      }
    ]
  },
  {
    icon: Share2,
    title: "Social Media Management",
    description: "Terms regarding social media account management and content creation.",
    content: [
      {
        subtitle: "Account Access and Management",
        details: `For social media management services, you grant us the necessary access to your social media accounts through platform-approved methods such as role-based access or authorized third-party tools. We implement security protocols to protect your account credentials.

        We manage your accounts according to agreed content strategies, posting schedules, and engagement guidelines. Regular performance reports are provided as specified in your service agreement.
        
        You retain ownership and ultimate responsibility for your social media accounts. We act as authorized agents managing these accounts on your behalf and according to your instructions.`
      },
      {
        subtitle: "Content Creation and Approval Process",
        details: `Social media content is developed according to content calendars typically prepared on a monthly basis. Content calendars are submitted for your review and approval before publication, with specified deadlines for feedback.

        Emergency or time-sensitive content may follow expedited approval processes as outlined in your service agreement. In the absence of timely feedback, we may delay publication or proceed with publishing scheduled content based on previously approved guidelines.
        
        While we create custom content for your channels, some elements may incorporate licensed stock images, templates, or music. Usage rights for these elements are limited to social media platforms and may have restrictions on commercial uses outside social media.`
      },
      {
        subtitle: "Platform Compliance and Changes",
        details: `We manage your social media presence in compliance with each platform's terms of service, community guidelines, and advertising policies. However, social media platforms frequently change their algorithms, features, and policies beyond our control.

        We adapt our strategies to platform changes as they occur, but cannot guarantee specific results or features that may be affected by platform updates. Significant platform changes that materially affect our services will be communicated to you promptly.
        
        If platform changes require additional services or fundamentally alter the nature of our services, we will discuss necessary adjustments to your service agreement. We are not liable for performance impacts resulting from platform-initiated changes.
        
        We are not responsible for platform-imposed restrictions or penalties resulting from historical account activities prior to our management or from client-directed actions that contradict our recommendations regarding platform compliance.`
      }
    ]
  },
  {
    icon: Smartphone,
    title: "Mobile App Services",
    description: "Terms related to Android app development and publication.",
    content: [
      {
        subtitle: "App Development Process",
        details: `Android application development follows a structured process including requirements analysis, UI/UX design, development, testing, and deployment. Each phase requires your review and approval before proceeding to the next stage.

        App development is based on approved specifications and designs. Changes to requirements after approval may impact timeline and costs. A formal change request process is used to document and implement changes to the original specifications.
        
        We develop applications according to Android platform guidelines and best practices. However, we cannot guarantee compatibility with all Android devices and versions beyond those specified in the project agreement.`
      },
      {
        subtitle: "App Store Publication",
        details: `We assist with preparing and submitting your application to the Google Play Store, but you must maintain your own developer account. App store fees, taxes, and compliance with platform policies remain your responsibility.

        App approval is at the discretion of Google and other app stores. We develop apps to comply with published guidelines, but cannot guarantee approval. If an app is rejected, we will make reasonable efforts to address the issues cited by the platform.
        
        For app publication, you must provide necessary business information, privacy policies, content ratings information, and marketing materials according to platform requirements. Delays in providing these materials may impact publication timelines.`
      },
      {
        subtitle: "App Maintenance and Updates",
        details: `Once published, applications require ongoing maintenance to address platform updates, security issues, and bug fixes. Maintenance services, when included, are detailed in separate maintenance agreements.

        Standard maintenance includes compatibility updates for new Android versions, security patches, and bug fixes. It does not include new features, design changes, or content updates unless explicitly specified.
        
        We recommend regular updates to maintain compatibility with the latest Android versions and security standards. Apps that are not regularly maintained may experience compatibility issues or security vulnerabilities over time.
        
        Application analytics are implemented as specified in your service agreement to track usage, performance, and user behavior. Analytics data is provided to you and used to inform maintenance and improvement recommendations.`
      }
    ]
  },
  {
    icon: AlertTriangle,
    title: "Limitations of Liability",
    description: "Legal limitations on our liability and responsibility for service outcomes.",
    content: [
      {
        subtitle: "Service Performance and Results",
        details: `While we apply professional expertise and best practices in all our services, we cannot guarantee specific outcomes or results. Digital marketing results, learning outcomes, and application performance are influenced by numerous external factors beyond our control.

        For marketing services, results are subject to platform algorithm changes, market competition, industry trends, and consumer behavior. We do not guarantee specific rankings, engagement rates, conversion rates, or return on investment.
        
        For educational services, learning outcomes depend significantly on student participation, effort, and aptitude. We provide quality instruction and support but cannot guarantee specific skill levels, certification outcomes, or employment results.
        
        For technical services, while we develop and test thoroughly, we cannot guarantee completely error-free performance across all possible scenarios, devices, or future platform changes.`
      },
      {
        subtitle: "Limitation of Liability Cap",
        details: `Our total liability for any claims related to our services shall not exceed the amount paid by you for the specific services that gave rise to the claim during the 6 months preceding the claim, regardless of the form of action, whether in contract, tort, or otherwise.

        For educational programs, our liability is limited to providing replacement services or refunding program fees according to our refund policy, and does not extend to consequential outcomes such as career advancement or employment opportunities.
        
        For development services, our liability is limited to correcting defects covered under warranty periods or refunding development fees for uncorrectable defects, and does not extend to business losses resulting from application performance.`
      },
      {
        subtitle: "Excluded Damages",
        details: `We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of our services, including but not limited to:

        • Loss of profits, revenue, business opportunities, anticipated savings, or goodwill
        • Business interruption or downtime
        • Loss or corruption of data or information
        • Cost of procurement of substitute goods or services
        • Any damages resulting from third-party claims against you
        
        These limitations apply even if we have been advised of the possibility of such damages and regardless of the form of action, whether in contract, tort, or any other legal theory.
        
        In jurisdictions that do not allow the exclusion or limitation of liability for consequential or incidental damages, our liability shall be limited to the maximum extent permitted by law.`
      }
    ]
  },
  {
    icon: RefreshCw,
    title: "Cancellation & Refunds",
    description: "Policies regarding service cancellation, termination, and refund procedures.",
    content: [
      {
        subtitle: "Service Cancellation Terms",
        details: `For ongoing services, either party may terminate with written notice as specified in the service agreement, typically 30 days. One-time projects may have different cancellation terms as outlined in project agreements.

        For educational programs, cancellation policies vary based on program type and duration:
        • Cancellations before program commencement may receive full or partial refunds as specified in program terms
        • Cancellations after program commencement are subject to the refund policies outlined below
        
        When you cancel services, you remain responsible for payment of services rendered up to the effective cancellation date. Early termination of fixed-term contracts may incur early termination fees as specified in your service agreement.
        
        We reserve the right to terminate services immediately for material breach of these terms, non-payment, or when continuing to provide services would put us at legal risk or significant reputational harm.`
      },
      {
        subtitle: "Refund Policies",
        details: `Refund policies vary by service type:

        For digital marketing services:
        • Ongoing services: No refunds for services already delivered
        • One-time services: Partial refunds may be available for incomplete deliverables according to percentage of completion
        
        For educational programs:
        • Full refunds are available only during specified cooling-off periods, typically 7 days after enrollment and before accessing course materials
        • Partial refunds may be available within the first 25% of the program duration, with deductions for services already delivered
        • No refunds are typically available after 25% of program completion
        
        For development projects:
        • Milestone-based payments are non-refundable upon approval of milestone deliverables
        • Deposits and initial payments are typically non-refundable as they secure project scheduling
        
        All refund requests must be submitted in writing with explanation of the reasons for the request. Refund processing typically takes 7-14 business days depending on payment method.`
      },
      {
        subtitle: "Deliverables and Work Product",
        details: `Upon service termination or cancellation, the following applies to work product and deliverables:

        • Completed and paid-for deliverables remain your property according to the intellectual property terms
        • Partially completed work that has not been paid for remains our property
        • Materials created specifically for your projects will be provided in their current state upon full payment of services rendered
        
        For educational programs, upon cancellation:
        • Access to learning platforms, materials, and sessions will be terminated on the effective cancellation date
        • Completed assignments and assessments will remain in our records according to our data retention policies
        • Certificates will only be issued if all program requirements were completed prior to cancellation
        
        For development projects, upon cancellation:
        • Source code and assets for completed and paid milestones will be provided as specified in the service agreement
        • Development environments and staging servers will be maintained for a limited period (typically 14 days) to facilitate transition
        • Documentation for completed work will be provided in its current state`
      }
    ]
  },
  {
    icon: Ban,
    title: "Prohibited Uses",
    description: "Activities and uses that are not permitted when using our services.",
    content: [
      {
        subtitle: "Illegal Activities and Content",
        details: `You may not use our services for any illegal purposes or to promote illegal activities. This includes but is not limited to:

        • Fraud, phishing, or deceptive business practices
        • Money laundering or terrorist financing
        • Violation of intellectual property rights or confidentiality obligations
        • Violations of consumer protection laws or advertising regulations
        • Activities that violate export controls or economic sanctions
        
        Content that promotes, encourages, or provides instructions for illegal activities is strictly prohibited across all our services, including educational programs, marketing services, and development projects.
        
        We reserve the right to terminate services immediately and without refund if we have reasonable belief that our services are being used for illegal purposes. We may also report such activities to appropriate authorities.`
      },
      {
        subtitle: "Prohibited Content Categories",
        details: `We do not provide services for content or businesses in the following categories:

        • Adult or pornographic content
        • Content promoting violence, hatred, or discrimination
        • Content that is defamatory, harassing, or invades privacy
        • Content that exploits or endangers children
        • Weapons, firearms, or ammunition
        • Counterfeit products or services
        • Gambling services (unless properly licensed and approved in advance)
        • Sale of tobacco, vaping products, or illegal substances
        
        For educational programs, discussions of these topics may be permitted in appropriate academic contexts with proper framing and educational purpose, but creation of such content is not permitted in projects or assignments.
        
        If your business operates in a regulated or sensitive industry not listed above, you must disclose this during the service inquiry phase so we can determine if we can appropriately serve your needs within our ethical guidelines.`
      },
      {
        subtitle: "Platform Policy Violations",
        details: `You may not request or instruct us to implement tactics that violate the terms of service or policies of platforms we work with, including but not limited to:

        • Social media platform community guidelines and advertising policies
        • Search engine webmaster guidelines
        • App store developer policies
        • Email marketing and anti-spam regulations
        • Online marketplace seller policies
        
        Prohibited tactics include:
        • Artificial engagement (bots, engagement pods, fake accounts)
        • Keyword stuffing or hidden text in SEO
        • Misleading advertising claims or false testimonials
        • Incentivized reviews where prohibited
        • Email list purchasing or non-consensual marketing
        • App store or review manipulation
        
        We maintain ethical standards in all digital marketing and development practices. We will decline requests to implement tactics that violate platform policies or industry ethical standards, even if competitors may be using such tactics.`
      }
    ]
  },
  {
    icon: Scale,
    title: "Dispute Resolution",
    description: "How conflicts and disputes will be handled and resolved.",
    content: [
      {
        subtitle: "Governing Law and Jurisdiction",
        details: `These terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any disputes arising from these terms or our services shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra, India.

        For international clients, these governing law provisions apply regardless of your location, unless specifically modified in a separate written agreement. By using our services, you consent to the jurisdiction of Indian courts for dispute resolution purposes.
        
        Nothing in these terms shall prevent us from seeking injunctive relief in any jurisdiction when necessary to protect our intellectual property rights or prevent irreparable harm.`
      },
      {
        subtitle: "Informal Dispute Resolution",
        details: `Before initiating formal legal proceedings, both parties agree to attempt resolution through good faith negotiations. The disputing party shall send a written notice describing the issue and desired resolution to the other party.

        Upon receiving a dispute notice, we will:
        • Acknowledge receipt within 5 business days
        • Investigate the matter thoroughly
        • Provide a written response within 15 business days outlining our position and proposed resolution
        
        If the dispute remains unresolved after this initial exchange, the parties agree to escalate the matter to senior management on both sides for further discussion and resolution attempts before proceeding to formal mediation or legal action.`
      },
      {
        subtitle: "Mediation and Arbitration",
        details: `If informal negotiations fail to resolve a dispute within 30 days, the parties agree to participate in mediation with a mutually agreed-upon mediator. Mediation costs shall be shared equally unless otherwise agreed.

        If mediation is unsuccessful, disputes shall be resolved through binding arbitration in accordance with the Arbitration Rules of the Mumbai Centre for International Arbitration. The arbitration shall be conducted in Mumbai, India, in the English language, by a single arbitrator jointly selected by both parties.
        
        The arbitrator shall have the authority to grant any remedy or relief that would be available in court, but shall not have the authority to award punitive or exemplary damages. The arbitrator's decision shall be final and binding on both parties.
        
        Notwithstanding the foregoing, either party may seek injunctive relief in any court of competent jurisdiction to prevent imminent harm or preserve the status quo pending resolution of the dispute.`
      }
    ]
  },
  {
    icon: Gavel,
    title: "Intellectual Property",
    description: "Rights and ownership of content, designs, code, and other intellectual property.",
    content: [
      {
        subtitle: "Ownership of Deliverables",
        details: `Upon full payment for our services, you receive ownership rights to final deliverables as follows:

        For marketing and design services:
        • Final approved designs, graphics, and marketing materials created specifically for you
        • Final approved content created specifically for your campaigns
        
        For development services:
        • Custom code developed specifically for your project
        • Custom user interface elements created specifically for your application
        
        Ownership transfer does not include:
        • Draft or unused concepts, designs, or code
        • Our proprietary tools, processes, or methodologies
        • Third-party elements such as stock photos, fonts, plugins, or libraries
        
        For clarity, we transfer rights only to final deliverables, not to the knowledge, techniques, or processes used to create them. The specific scope of rights transferred may be further defined in your service agreement.`
      },
      {
        subtitle: "Educational Materials and Content",
        details: `All course materials, presentations, videos, assignments, and educational content provided through our programs remain our exclusive intellectual property. When you enroll in our programs, you receive a limited, non-exclusive license to:

        • Access and use the materials for your personal educational purposes
        • Complete and submit assignments and projects as part of the program
        • Download and store materials for personal reference (unless specifically restricted)
        
        You may not:
        • Share, distribute, or publish course materials with non-enrolled individuals
        • Use course materials for commercial purposes or to create competing offerings
        • Remove copyright notices or attribution from any materials
        
        Projects and assignments you complete as part of educational programs remain your intellectual property, though we may request permission to use them as examples for promotional purposes.`
      },
      {
        subtitle: "Portfolio Rights and Attribution",
        details: `Unless explicitly specified otherwise in writing, we retain the right to:

        • Display your final deliverables in our portfolio, case studies, and promotional materials
        • Describe the services provided to you in our marketing materials
        • Use non-confidential project outcomes in presentations or educational contexts
        
        We will exercise these rights respectfully, focusing on our contribution rather than sensitive business information. If you require confidentiality or restricted portfolio usage, this must be negotiated before project commencement.
        
        For appropriate projects, we may request to place a discreet credit or link (e.g., "Website designed by Padak") on the deliverable. This is optional and subject to your approval.
        
        You agree not to remove any copyright notices, attributions, or watermarks that may be placed on preliminary concepts or drafts shared during the development process.`
      }
    ]
  }
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