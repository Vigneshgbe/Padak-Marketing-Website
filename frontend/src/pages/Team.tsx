import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Linkedin, Mail, Sparkles, Users, ArrowRight, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Team = () => {
  const navigate = useNavigate();
  
  // Add state for tracking image errors and animations
  const [imageErrors, setImageErrors] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setIsLoaded(true);
  }, []);

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
      imageUrl: "https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/ThikilanP.jpeg?raw=true",
      specialties: ["Digital Strategy", "Brand Development", "Marketing Analytics"]
    } ,
    {
      name: "Vignesh G",
      role: "Developer",
      bio: "Professional web developer",
      linkedin: "#",
      email: "padak.service@gmail.com",
      imageUrl: "https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/VigneshG.jpg?raw=true"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/20">
      <Header />
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div 
            className={`text-center mb-16 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6 hover:bg-orange-200 transition-colors duration-300">
              <Sparkles className="w-4 h-4" />
              Our Team
            </div>
            <h1 className="text-4xl font-bold mb-4">
              Meet the{" "}
              <span className="text-orange-500 relative">
                Experts
                <span className="absolute bottom-1 left-0 w-full h-1 bg-orange-100 -z-10"></span>
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Dedicated professionals committed to your digital success
            </p>
          </div>

          {/* Team Grid - dynamically adjust based on number of team members */}
          <div 
            className={`grid gap-10 mb-20 ${
              teamMembers.length === 1 
                ? 'grid-cols-1 max-w-xl mx-auto' 
                : teamMembers.length === 2 
                  ? 'grid-cols-1 md:grid-cols-2 max-w-3xl mx-auto' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className={`transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <Card className="group p-6 hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-100 bg-white rounded-xl overflow-hidden">
                  <div className="text-center">
                    {/* Image with fallback - Better size without color overlay */}
                    <div className="w-36 h-36 mx-auto mb-5 relative">
                      {member.imageUrl && !imageErrors[index] ? (
                        <div className="relative">
                          {/* Shadow behind image that appears on hover */}
                          <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 bg-orange-200 blur-md transition-opacity duration-300"></div>
                          <img 
                            src={member.imageUrl} 
                            alt={member.name}
                            className="w-full h-full object-cover rounded-full border-4 border-white shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 relative z-10"
                            onError={() => handleImageError(index)}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-semibold shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    
                    {/* Info - Improved typography and spacing */}
                    <h3 className="text-xl font-semibold mb-1 group-hover:text-orange-500 transition-colors duration-300">{member.name}</h3>
                    <p className="text-orange-600 font-medium text-sm mb-2 flex items-center justify-center gap-1">
                      <Award className="w-3.5 h-3.5" />
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>
                    
                    {/* Specialties */}
                    {member.specialties && (
                      <div className="flex flex-wrap justify-center gap-2 mb-5">
                        {member.specialties.map((specialty, i) => (
                          <span 
                            key={i} 
                            className="bg-orange-50 text-orange-600 px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-orange-100 transition-colors duration-300"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Social Links - Enhanced */}
                    <div className="flex justify-center gap-3">
                      <a 
                        href={member.linkedin} 
                        className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-500 hover:text-orange-500 transition-all duration-300"
                        aria-label={`${member.name}'s LinkedIn Profile`}
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                      <a 
                        href={`mailto:${member.email}`} 
                        className="w-10 h-10 border border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-500 hover:text-orange-500 transition-all duration-300"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>

          {/* Bottom CTA - Enhanced */}
          <div
            className={`relative transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
            style={{ transitionDelay: `400ms` }}
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-10 text-center text-white shadow-md overflow-hidden relative">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
              
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
                className="bg-white text-orange-500 hover:bg-gray-100 font-semibold transition-all duration-300 group"
              >
                Start a Project
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};