import { useEffect, useState } from "react";
import { 
  Home, 
  Search, 
  ArrowRight, 
  AlertCircle,
  RefreshCw,
  Compass,
  ChevronLeft
} from "lucide-react";

const NotFound = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentPath] = useState(window.location.pathname);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      currentPath
    );
    
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [currentPath]);

  const popularPages = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/#services" },
    { name: "Courses", path: "/courses" },
    { name: "Interships", path: "/internships" },
    { name: "Contact", path: "/#contact" }
  ];

  const handleGoBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 relative overflow-hidden flex items-center justify-center">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-300/5 rounded-full blur-xl animate-bounce delay-500"></div>
      
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-4xl mx-auto">
          {/* 404 Number with gradient and animation */}
          <div className="relative mb-8">
            <h1 className="text-8xl md:text-9xl lg:text-[12rem] font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent leading-none animate-pulse">
              404
            </h1>
            <div className="absolute inset-0 text-8xl md:text-9xl lg:text-[12rem] font-bold text-orange-500/10 blur-sm animate-pulse delay-300">
              404
            </div>
          </div>

          {/* Error Icon */}
          <div className="mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-400 rounded-full flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Oops! Page Not Found
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              The page you're looking for seems to have taken a different route. 
              Don't worry though, we'll help you find your way back to the right path.
            </p>
            <div className="mt-4 p-4 bg-orange-50/50 rounded-lg border border-orange-200/50 max-w-md mx-auto">
              <p className="text-sm text-orange-700 font-medium">
                Requested URL: <span className="font-mono bg-orange-100 px-2 py-1 rounded text-orange-800">{currentPath}</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => window.location.href = '/'}
              className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 hover:from-orange-600 hover:to-orange-500"
            >
              <Home className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
              Return to Home
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={handleGoBack}
              className="group inline-flex items-center justify-center px-8 py-4 border-2 border-orange-500 text-orange-600 font-semibold rounded-lg hover:bg-orange-500 hover:text-white transition-all duration-300 hover:-translate-y-1"
            >
              <ChevronLeft className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </button>
            
            <button
              onClick={handleRefresh}
              className="group inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-gray-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-300 hover:-translate-y-1"
            >
              <RefreshCw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
              Refresh Page
            </button>
          </div>

          {/* Popular Pages */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-6 text-foreground flex items-center justify-center">
              <Compass className="w-5 h-5 mr-2 text-orange-500" />
              Popular Pages
            </h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {popularPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => window.location.href = page.path}
                  className="group px-4 py-2 bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <span className="text-orange-600 font-medium group-hover:text-orange-700">
                    {page.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Suggestion */}
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-orange-200/50 max-w-md mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-orange-500 mr-2" />
              <h4 className="text-lg font-semibold text-foreground">Can't find what you're looking for?</h4>
            </div>
            <p className="text-muted-foreground mb-4">
              Try searching our site or contact our support team for assistance.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.location.href = '/search'}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Search Site
              </button>
              <button
                onClick={() => window.location.href = '/contact'}
                className="flex-1 px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors font-medium"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-orange-500 rounded-full animate-ping delay-700"></div>
      <div className="absolute top-3/4 right-1/3 w-1 h-1 bg-orange-300 rounded-full animate-ping delay-1000"></div>
    </div>
  );
};

export default NotFound;