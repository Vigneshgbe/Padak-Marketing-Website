import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Linkedin, Mail, Sparkles, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Team = () => {
  const navigate = useNavigate();
  
  // Add state for tracking image errors
  const [imageErrors, setImageErrors] = useState({});
  const [isVisible, setIsVisible] = useState(false);

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
      name: "Thikilan P",
      role: "CEO & Founder",
      bio: "2+ years in digital marketing with expertise in building brands and driving growth strategies for businesses across various industries.",
      linkedin: "#",
      email: "padak.service@gmail.com",
      imageUrl: "https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/ThikilanP.jpeg?raw=true"
    },
    {
      name: "Vignesh G",
      role: "Developer",
      bio: "Professional web developer with expertise in creating modern, responsive websites and applications.",
      linkedin: "#",
      email: "padak.service@gmail.com",
      imageUrl: "https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/Vignesh_G.png?raw=true"
    }
  ];

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/20">
      <Header />
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div 
            className={`text-center mb-16 transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Our Team
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Meet the{" "}
              <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">Experts</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dedicated professionals committed to your digital success
            </p>
          </div>

          {/* Team Grid */}
          <div className={`grid gap-8 mb-16 ${
            teamMembers.length === 1 
              ? 'grid-cols-1 max-w-md mx-auto' 
              : teamMembers.length === 2 
                ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className={`transition-all duration-500 ${
                  isVisible 
                    ? "opacity-100 translate-y-0" 
                    : "opacity-0 translate-y-8"
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <Card className="p-6 hover:shadow-xl transition-all duration-300 border-gray-100 group overflow-hidden relative">
                  {/* Background element */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/10 rounded-full blur-xl group-hover:bg-orange-500/20 transition-all duration-300"></div>
                  
                  {/* Image with fallback - fixed aspect ratio */}
                  <div className="w-48 h-48 mx-auto mb-6 relative transition-transform duration-500 group-hover:scale-105 aspect-square">
                    {member.imageUrl && !imageErrors[index] ? (
                      <div className="rounded-full overflow-hidden border-4 border-white shadow-lg w-full h-full">
                        <img 
                          src={member.imageUrl} 
                          alt={member.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                          onError={() => handleImageError(index)}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    
                    {/* Hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Info */}
                  <div>
                    <h3 className="text-2xl font-bold mb-2 text-center">{member.name}</h3>
                    <p className="text-orange-600 font-medium text-lg mb-3 text-center">{member.role}</p>
                    <p className="text-muted-foreground mb-5 min-h-[60px] text-center">{member.bio}</p>
                    
                    {/* Social Links with animation */}
                    <div 
                      className="flex justify-center gap-3 transition-transform duration-300 group-hover:scale-105"
                    >
                      <a 
                        href={member.linkedin} 
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-300 shadow-sm"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                      <a 
                        href={`mailto:${member.email}`} 
                        className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-orange-500 hover:border-orange-500 hover:text-white transition-all duration-300 shadow-sm"
                      >
                        <Mail className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Bottom CTA with animation */}
          <div 
            className={`bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-10 text-center text-white relative overflow-hidden transition-all duration-700 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Floating elements */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 mx-auto mb-4 text-white/90 transition-transform duration-500 hover:scale-110">
                <Users className="w-12 h-12 mx-auto" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Let's Work Together
              </h2>
              <p className="text-white/90 mb-6 max-w-xl mx-auto">
                Our team is ready to help you achieve your digital marketing goals
              </p>
              
              <div className="transition-transform duration-300 hover:scale-105 inline-block">
                <Button 
                  size="lg"
                  onClick={handleStartProject}
                  className="bg-white text-orange-500 hover:bg-gray-100 font-semibold shadow-lg"
                >
                  Start a Project
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};