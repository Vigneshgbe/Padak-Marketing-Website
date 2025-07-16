// src/pages/dashboard/Calendar.tsx
import React from 'react';
import { Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';

const Calendar: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View your upcoming assignments and events
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">December 2024</h2>
          <div className="grid grid-cols-7 gap-2 text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="font-semibold p-2 text-gray-500 dark:text-gray-400">
                {day}
              </div>
            ))}
            {Array.from({ length: 31 }, (_, i) => (
              <div key={i + 1} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded cursor-pointer">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          <div className="space-y-4">
            <div className="p-3 border-l-4 border-orange-500 bg-orange-50 dark:bg-gray-700">
              <h3 className="font-semibold">Assignment Due</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">SEO Strategy Proposal</p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Clock size={12} className="mr-1" />
                Dec 15, 11:59 PM
              </div>
            </div>
            <div className="p-3 border-l-4 border-blue-500 bg-blue-50 dark:bg-gray-700">
              <h3 className="font-semibold">Live Session</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Advanced SEO Techniques</p>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <Clock size={12} className="mr-1" />
                Dec 18, 3:00 PM
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;