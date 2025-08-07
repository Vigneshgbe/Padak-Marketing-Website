import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Linkedin, Mail, Sparkles, Users, ArrowRight, Award, Star } from "lucide-react";
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
    } //,
    // {
    //   name: "Vignesh G",
    //   role: "Developer",
    //   bio: "Professional web developer",
    //   linkedin: "#",
    //   email: "padak.service@gmail.com",
    //   imageUrl: "https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/VigneshG.jpg?raw=true"
    // }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-orange-50/20">
      <Header />
      <section className="py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header */}
          <div 
            className={`text-center mb-20 transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'}`}
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-600 px-4 py-2 rounded-full text-sm font-medium mb-6 hover:bg-orange-200 transition-colors duration-300">
              <Sparkles className="w-4 h-4" />
              Our Team
            </div>
            <h1 className="text-5xl font-bold mb-6 relative">
              Meet the{" "}
              <span className="text-orange-500 relative">
                Experts
                <span className="absolute bottom-1 left-0 w-full h-2 bg-orange-100 -z-10 transform -rotate-1"></span>
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dedicated professionals committed to your digital success
            </p>
          </div>

          {/* Team Grid - dynamically adjust based on number of team members */}
          <div 
            className={`grid gap-12 mb-24 ${
              teamMembers.length === 1 
                ? 'grid-cols-1 max-w-2xl mx-auto' 
                : teamMembers.length === 2 
                  ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' 
                  : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {teamMembers.map((member, index) => (
              <div 
                key={index} 
                className={`transition-all duration-700 transform ${isLoaded ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'}`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                <Card className="group p-8 hover:shadow-xl transition-all duration-500 border border-orange-100 hover:border-orange-200 bg-white rounded-2xl overflow-hidden relative">
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-100/40 to-transparent rounded-bl-full -z-0 group-hover:scale-125 transition-transform duration-700"></div>
                  
                  <div className="text-center relative z-10">
                    {/* Image with fallback - Larger size */}
                    <div className="w-52 h-52 mx-auto mb-6 relative">
                      <div className="absolute inset-0 bg-gradient-to-br to-orange-500 rounded-full opacity-100 transition-opacity duration-500"></div>
                      {member.imageUrl && !imageErrors[index] ? (
                        <img 
                          src={member.imageUrl} 
                          alt={member.name}
                          className="w-full h-full object-cover rounded-full ring-4 ring-white shadow-lg group-hover:scale-105 transition-transform duration-500"
                          onError={() => handleImageError(index)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-5xl font-semibold shadow-lg group-hover:scale-105 transition-transform duration-500">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>
                    
                    {/* Info */}
                    <h3 className="text-2xl font-bold mb-2 group-hover:text-orange-500 transition-colors duration-300">{member.name}</h3>
                    <p className="text-orange-600 font-medium text-lg mb-3 flex items-center justify-center gap-2">
                      <Award className="w-4 h-4" />
                      {member.role}
                    </p>
                    <p className="text-gray-600 text-md mb-6 leading-relaxed">{member.bio}</p>
                    
                    {/* Specialties */}
                    {member.specialties && (
                      <div className="flex flex-wrap justify-center gap-2 mb-6">
                        {member.specialties.map((specialty, i) => (
                          <span 
                            key={i} 
                            className="bg-orange-50 text-orange-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-orange-100 transition-colors duration-300"
                            style={{ transitionDelay: `${i * 100}ms` }}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Social Links - Enhanced */}
                    <div className="flex justify-center gap-4">
                      <a 
                        href={member.linkedin} 
                        className="w-12 h-12 border border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-500 hover:text-white hover:bg-orange-500 transition-all duration-300 group/icon"
                        aria-label={`${member.name}'s LinkedIn Profile`}
                      >
                        <Linkedin className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
                      </a>
                      <a 
                        href={`mailto:${member.email}`} 
                        className="w-12 h-12 border border-gray-200 rounded-lg flex items-center justify-center hover:border-orange-500 hover:text-white hover:bg-orange-500 transition-all duration-300 group/icon"
                        aria-label={`Email ${member.name}`}
                      >
                        <Mail className="w-5 h-5 group-hover/icon:scale-110 transition-transform" />
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
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/20 to-orange-400/20 rounded-3xl blur-xl transform -rotate-1 scale-105"></div>
            <div className="relative bg-gradient-to-r from-orange-500 to-orange-400 rounded-2xl p-12 text-center text-white shadow-lg overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/4"></div>
              
              <div
                className={`bg-white/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 transition-all duration-700 ${isLoaded ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                style={{ transitionDelay: `600ms` }}
              >
                <Users className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">
                Let's Work Together
              </h2>
              <p className="text-white/90 mb-8 max-w-xl mx-auto text-lg">
                Our team is ready to help you achieve your digital marketing goals
                and transform your online presence.
              </p>
              <Button 
                size="lg"
                onClick={handleStartProject}
                className="bg-white text-orange-500 hover:bg-orange-50 font-semibold px-8 py-6 text-lg shadow-md hover:shadow-lg transition-all duration-300 group"
              >
                Start a Project
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};