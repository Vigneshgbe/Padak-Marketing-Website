import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Mail,
  Phone,
  MapPin,
  Send,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  const quickLinks = [
    { name: "About Us", href: "#about" },
    { name: "Services", href: "#services" },
    { name: "Courses", href: "/courses" },
    { name: "Internships", href: "/internships" },
    { name: "Contact", href: "#contact" }
  ];

  const services = [
    { name: "SEO Optimization", href: "#services" },
    { name: "Social Media Marketing", href: "#services" },
    { name: "PPC Advertising", href: "#services" },
    { name: "Web Development", href: "#services" },
    { name: "Content Marketing", href: "#services" }
  ];

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Youtube, href: "#", label: "YouTube" }
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <img 
                src="https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/padak_p.png?raw=true"
                alt="Padak Logo"
                className="w-12 h-12 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">Padak</h1>
                <p className="text-xs text-orange-400">Your Digital Marketing Partner</p>
              </div>
            </div>
            
            <p className="text-gray-400 leading-relaxed">
              Empowering businesses to thrive in the digital landscape with innovative 
              marketing solutions and expert guidance.
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Mail className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm group-hover:text-white transition-colors">info@padak.com</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <Phone className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm group-hover:text-white transition-colors">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-colors">
                  <MapPin className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm group-hover:text-white transition-colors">123 Business District, Digital City</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-400 mr-3"></div>
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    className="text-gray-400 hover:text-orange-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-400 mr-3"></div>
              Services
            </h3>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.name}>
                  <a 
                    href={service.href}
                    className="text-gray-400 hover:text-orange-400 transition-colors flex items-center group"
                  >
                    <ArrowRight className="w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
                    {service.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6 text-white flex items-center">
              <div className="w-1 h-6 bg-gradient-to-b from-orange-500 to-orange-400 mr-3"></div>
              Stay Updated
            </h3>
            <p className="text-gray-400 mb-4">
              Subscribe to our newsletter for the latest digital marketing insights and tips.
            </p>
            <div className="space-y-3">
              <div className="relative">
                <Input 
                  placeholder="Enter your email"
                  className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 pr-10 focus:border-orange-500 focus:ring-orange-500 transition-colors"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                Subscribe
                <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            {/* Social Links */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-4 text-white">Follow Us</h4>
              <div className="flex space-x-3">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.href}
                    className="w-10 h-10 bg-gray-800/50 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300 group"
                    aria-label={social.label}
                  >
                    <social.icon className="w-4 h-4 text-gray-400 group-hover:text-orange-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="py-6 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <p className="text-gray-400 text-sm">
                © 2024 Padak. All rights reserved.
              </p>
              <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
              <p className="text-gray-400 text-sm">
                Made with <span className="text-orange-400">♥</span> by Padak Team
              </p>
            </div>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                Privacy Policy
              </a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                Terms of Service
              </a>
              <span className="text-gray-600">•</span>
              <a href="#" className="text-gray-400 hover:text-orange-400 transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Background decorative elements */}
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl"></div>
      <div className="absolute top-20 right-0 w-48 h-48 bg-orange-400/5 rounded-full blur-2xl"></div>
    </footer>
  );
};