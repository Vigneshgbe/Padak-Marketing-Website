// src/components/dashboard/common/DashboardHeader.tsx
import React, { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, User, Shield, Sparkles, RotateCcw } from 'lucide-react';
import { useAuth } from '../../../hooks/use-auth';
import { getImageUrl } from '../../../utils/image-utils'; 

interface DashboardHeaderProps {
  onMenuClick: () => void;
  onProfileClick: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  onMenuClick, 
  onProfileClick 
}) => {
  const { user } = useAuth();
  const [currentQuote, setCurrentQuote] = useState({ text: '', author: '' });
  const [isAnimating, setIsAnimating] = useState(false);

  // Motivational quotes collection
  const quotes = [
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Dr.APJ" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Dream bigger. Do bigger.", author: "Dr.APJ" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Little things make big days.", author: "Steve Jobs" },
    { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
    { text: "Don't wait for opportunity. Create it.", author: "Unknown" },
    { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Unknown" },
    { text: "The key to success is to focus on goals, not obstacles.", author: "Unknown" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
    { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
    { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
    { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Learning is a treasure that will follow its owner everywhere.", author: "Chinese Proverb" },
    { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
    { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
    { text: "Tell me and I forget, teach me and I may remember, involve me and I learn.", author: "Benjamin Franklin" },
    { text: "The more that you read, the more things you will know. The more that you learn, the more places you'll go.", author: "Dr. Seuss" },
    { text: "Anyone who stops learning is old, whether at twenty or eighty.", author: "Henry Ford" },
    { text: "Skills are cheap. Passion is priceless.", author: "Gary Vaynerchuk" }
  ];

  // Get quote based on day of year to ensure 24h rotation
  const getDailyQuote = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return quotes[dayOfYear % quotes.length];
  };

  // Manual quote refresh function
  const refreshQuote = () => {
    setIsAnimating(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setCurrentQuote(quotes[randomIndex]);
      setIsAnimating(false);
    }, 300);
  };

  useEffect(() => {
    setCurrentQuote(getDailyQuote());
  }, []);

  if (!user) return null;

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm z-20 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center flex-1">
          <button 
            onClick={onMenuClick} 
            className="lg:hidden mr-4 text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Menu size={24} />
          </button>         
          
          {/* Daily Motivation Section */}
          <div className="flex items-center space-x-3 max-w-2xl">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-orange-100 to-yellow-100 dark:from-orange-900/30 dark:to-yellow-900/30 rounded-full">
                <Sparkles size={18} className="text-orange-500" />
              </div>
            </div>
            
            <div className={`transition-all duration-300 ${isAnimating ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
              <div className="flex flex-col">
                <div className="flex items-start space-x-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 italic leading-relaxed">
                    "{currentQuote.text}"
                  </p>
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 font-medium">
                  — {currentQuote.author}
                </p>
              </div>
            </div>
            
            <button
              onClick={refreshQuote}
              className="ml-2 p-1.5 rounded-full hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors group"
              title="Get new inspiration"
            >
              <RotateCcw size={14} className={`text-orange-500 transition-transform ${isAnimating ? 'rotate-180' : 'group-hover:rotate-45'}`} />
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
          </button>
          
          <div 
            className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
            onClick={onProfileClick}
          >
            <div className="relative">
              {user.profileImage ? (
                <img 
                  src={getImageUrl(user.profileImage)} // Use getImageUrl here
                  alt="Profile" 
                  className="w-10 h-10 rounded-xl object-cover border-2 border-orange-200 dark:border-orange-500/20"
                />
              ) : (
                <div className="bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 border-2 border-dashed border-orange-300 dark:border-orange-500/30 rounded-xl w-10 h-10 flex items-center justify-center">
                  {user.accountType === 'admin' ? (
                    <Shield size={20} className="text-orange-500" />
                  ) : (
                    <User size={20} className="text-orange-500" />
                  )}
                </div>
              )}
            </div>
            <div className="ml-2 hidden md:block">
              <div className="font-medium text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {user.accountType === 'admin' ? 'Administrator' : user.accountType}
              </div>
            </div>
            <ChevronDown size={20} className="ml-2 text-gray-500 dark:text-gray-400" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;