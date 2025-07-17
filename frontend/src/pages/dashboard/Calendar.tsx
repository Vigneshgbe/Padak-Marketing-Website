// src/pages/dashboard/Calendar.tsx
import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, AlertCircle, CheckCircle, BookOpen, FileText, Users } from 'lucide-react';
import { apiService } from '../../lib/api';

// Types based on your database schema
interface Assignment {
  id: number;
  title: string;
  description: string;
  due_date: string;
  max_points: number;
  course: {
    id: number;
    title: string;
    category: string;
  };
  submission?: {
    id: number;
    status: 'submitted' | 'graded' | 'returned';
    grade?: number;
  };
}

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  type: 'assignment' | 'live_session' | 'course_start' | 'course_end' | 'deadline';
  course?: {
    id: number;
    title: string;
    category: string;
  };
  status?: 'pending' | 'completed' | 'overdue';
  color: string;
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  account_type: 'student' | 'professional' | 'business' | 'agency' | 'admin';
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const userData = await apiService.get<User>('/auth/me');
        setUser(userData);
        
        // Get assignments
        const assignmentsData = await apiService.get<Assignment[]>('/assignments/my-assignments');
        setAssignments(assignmentsData);
        
        // Get calendar events
        const eventsData = await apiService.get<CalendarEvent[]>('/calendar/events');
        
        // Convert assignments to calendar events
        const assignmentEvents: CalendarEvent[] = assignmentsData.map(assignment => {
          const dueDate = new Date(assignment.due_date);
          const isOverdue = dueDate < new Date() && !assignment.submission;
          const isCompleted = assignment.submission?.status === 'graded';
          
          return {
            id: `assignment-${assignment.id}`,
            title: assignment.title,
            description: `${assignment.course.title} - ${assignment.description}`,
            date: assignment.due_date,
            type: 'assignment',
            course: assignment.course,
            status: isOverdue ? 'overdue' : isCompleted ? 'completed' : 'pending',
            color: isOverdue ? 'red' : isCompleted ? 'green' : 'orange'
          };
        });
        
        setEvents([...eventsData, ...assignmentEvents]);
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.date.startsWith(dateStr));
  };

  const getUpcomingEvents = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    return events
      .filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 5);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'assignment':
        return <FileText size={16} />;
      case 'live_session':
        return <Users size={16} />;
      case 'course_start':
      case 'course_end':
        return <BookOpen size={16} />;
      default:
        return <CalendarIcon size={16} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 border-green-300';
      case 'overdue':
        return 'text-red-600 bg-red-100 border-red-300';
      case 'pending':
        return 'text-orange-600 bg-orange-100 border-orange-300';
      default:
        return 'text-blue-600 bg-blue-100 border-blue-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = getDaysInMonth(currentDate);
  const upcomingEvents = getUpcomingEvents();

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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="font-semibold p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                {day}
              </div>
            ))}
            
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-3 h-24"></div>;
              }
              
              const dayEvents = getEventsForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
              
              return (
                <div
                  key={day.getDate()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 h-24 border rounded-lg cursor-pointer transition-colors relative ${
                    isToday ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                  } ${isSelected ? 'ring-2 ring-orange-500' : ''}`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-orange-600' : ''}`}>
                    {day.getDate()}
                  </div>
                  
                  <div className="mt-1 space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-1 py-0.5 rounded truncate ${
                          event.color === 'red' ? 'bg-red-100 text-red-800' :
                          event.color === 'green' ? 'bg-green-100 text-green-800' :
                          event.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
          
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No upcoming events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingEvents.map(event => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 ${getStatusColor(event.status || 'pending')}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-1">
                        {getEventTypeIcon(event.type)}
                        <h3 className="font-semibold ml-2">{event.title}</h3>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {event.description}
                      </p>
                      
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <Clock size={12} className="mr-1" />
                        {new Date(event.date).toLocaleDateString()}
                        {event.time && `, ${event.time}`}
                      </div>
                      
                      {event.course && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {event.course.title}
                        </div>
                      )}
                    </div>
                    
                    {event.status === 'completed' && (
                      <CheckCircle size={16} className="text-green-500 mt-1" />
                    )}
                    {event.status === 'overdue' && (
                      <AlertCircle size={16} className="text-red-500 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Quick Stats */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-3">This Week</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-500">
                  {assignments.filter(a => !a.submission).length}
                </div>
                <div className="text-xs text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-500">
                  {assignments.filter(a => a.submission?.status === 'graded').length}
                </div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Date Events Modal */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDate(null)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={`p-3 rounded-lg border-l-4 ${getStatusColor(event.status || 'pending')}`}
                >
                  <div className="flex items-center mb-1">
                    {getEventTypeIcon(event.type)}
                    <h4 className="font-semibold ml-2">{event.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {event.description}
                  </p>
                  {event.course && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {event.course.title}
                    </p>
                  )}
                </div>
              ))}
              
              {getEventsForDate(selectedDate).length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No events on this date
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;