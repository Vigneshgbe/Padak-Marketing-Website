import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Linkedin, Mail, Sparkles, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Team = () => {
  const navigate = useNavigate();
  
  // Add state for tracking image errors
  const [imageErrors, setImageErrors] = useState({});

  // Function to handle image errors
  const handleImageError = (index) => {
    setImageErrors(prev => ({
      ...prev,
      [index]: true
    }));
  };
  
  const handleStartProject = () => {
    navigate('/#services');
    // Scroll to services section after navigation
    setTimeout(() => {
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const teamMembers = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      bio: "15+ years in digital marketing",
      linkedin: "#",
      email: "sarah@padak.com",
      imageUrl: "https://example.com/sarah.jpg"
    },
    {
      name: "Michael Chen",
      role: "Head of SEO",
      bio: "SEO expert with proven track record",
      linkedin: "#",
      email: "michael@padak.com",
      imageUrl: "https://example.com/michael.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/20">
      <Header />
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div className="text-center mb-16">
            {/* <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Our Team
            </div> */}
            <h1 className="text-4xl font-bold mb-4">
              Meet the{" "}
              <span className="text-orange-500">Experts</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dedicated professionals committed to your digital success
            </p>
          </div>

          {/* Team Grid - dynamically adjust based on number of team members */}
          <div className={`grid gap-8 mb-16 ${
            teamMembers.length === 1 
              ? 'grid-cols-1 max-w-sm mx-auto' 
              : teamMembers.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-2xl mx-auto' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {teamMembers.map((member, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-shadow duration-300 border-gray-100">
                <div className="text-center">
                  {/* Image with fallback */}
                  <div className="w-24 h-24 mx-auto mb-4">
                    {member.imageUrl && !imageErrors[index] ? (
                      <img 
                        src={member.imageUrl} 
                        alt={member.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={() => handleImageError(index)}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-orange-600 font-medium text-sm mb-2">{member.role}</p>
                  <p className="text-muted-foreground text-sm mb-4">{member.bio}</p>
                  
                  {/* Social Links */}
                  <div className="flex justify-center gap-3">
                    <a 
                      href={member.linkedin} 
                      className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                    <a 
                      href={`mailto:${member.email}`} 
                      className="w-9 h-9 border border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-500 hover:text-orange-500 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-10 text-center text-white">
            <Users className="w-12 h-12 mx-auto mb-4 text-white/90" />
            <h2 className="text-2xl font-bold mb-3">
              Let's Work Together
            </h2>
            <p className="text-white/90 mb-6 max-w-xl mx-auto">
              Our team is ready to help you achieve your digital marketing goals
            </p>
            <Button 
              size="lg"
              onClick={handleStartProject}
              className="bg-white text-orange-500 hover:bg-gray-100 font-semibold"
            >
              Start a Project
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};