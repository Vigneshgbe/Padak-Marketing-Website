import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, ListChecks, BadgeCheck, Calendar, 
  Users, Briefcase, BarChart, Settings, LogOut, Menu, X, 
  Search, Bell, ChevronDown, FileText, CheckCircle, Clock, 
  PlusCircle, Download, Share2, Moon, Sun, ChevronRight
} from 'lucide-react';

// Sample data for demonstration
const userData = {
  student: {
    id: 1,
    firstName: "Alex",
    lastName: "Johnson",
    email: "alex@example.com",
    accountType: "student",
    joinDate: "2024-01-15",
    coursesEnrolled: 5,
    coursesCompleted: 2,
    certificatesEarned: 2,
    learningStreak: 12,
    profileImage: null
  },
  professional: {
    id: 2,
    firstName: "Sarah",
    lastName: "Miller",
    email: "sarah@example.com",
    accountType: "professional",
    joinDate: "2023-11-22",
    coursesEnrolled: 8,
    coursesCompleted: 5,
    certificatesEarned: 4,
    learningStreak: 24,
    profileImage: null
  },
  business: {
    id: 3,
    firstName: "Michael",
    lastName: "Chen",
    email: "michael@example.com",
    accountType: "business",
    joinDate: "2024-02-10",
    coursesEnrolled: 3,
    coursesCompleted: 1,
    certificatesEarned: 1,
    learningStreak: 7,
    profileImage: null
  },
  agency: {
    id: 4,
    firstName: "Priya",
    lastName: "Patel",
    email: "priya@example.com",
    accountType: "agency",
    joinDate: "2023-09-05",
    coursesEnrolled: 12,
    coursesCompleted: 9,
    certificatesEarned: 7,
    learningStreak: 45,
    profileImage: null
  }
};

const assignments = {
  student: [
    { id: 1, title: "SEO Strategy Proposal", course: "Advanced SEO", dueDate: "2024-06-15", status: "pending", submitted: false },
    { id: 2, title: "Social Media Campaign Analysis", course: "Social Media Marketing", dueDate: "2024-06-20", status: "pending", submitted: false },
    { id: 3, title: "Google Ads Campaign Setup", course: "PPC Mastery", dueDate: "2024-06-10", status: "completed", submitted: true, grade: "A" }
  ],
  professional: [
    { id: 1, title: "Portfolio Website Review", course: "Web Development", dueDate: "2024-06-18", status: "pending", submitted: false },
    { id: 2, title: "Content Marketing Strategy", course: "Content Creation", dueDate: "2024-06-22", status: "pending", submitted: false }
  ],
  business: [
    { id: 1, title: "Team Training Plan", course: "Business Growth", dueDate: "2024-06-25", status: "pending", submitted: false }
  ],
  agency: [
    { id: 1, title: "Client Campaign Proposal", course: "Agency Management", dueDate: "2024-06-12", status: "pending", submitted: false },
    { id: 2, title: "Team Performance Analysis", course: "Advanced Analytics", dueDate: "2024-06-16", status: "completed", submitted: true, grade: "A+" }
  ]
};

const courses = {
  student: [
    { id: 1, title: "SEO Fundamentals", progress: 75, instructor: "John Smith", duration: "4 weeks" },
    { id: 2, title: "Social Media Marketing", progress: 30, instructor: "Emily Davis", duration: "6 weeks" },
    { id: 3, title: "Content Creation Mastery", progress: 15, instructor: "Mark Johnson", duration: "8 weeks" }
  ],
  professional: [
    { id: 1, title: "Advanced Analytics", progress: 90, instructor: "Sarah Wilson", duration: "5 weeks" },
    { id: 2, title: "PPC Strategies", progress: 65, instructor: "Robert Brown", duration: "6 weeks" }
  ],
  business: [
    { id: 1, title: "Business Growth Strategies", progress: 40, instructor: "Michael Chen", duration: "10 weeks" }
  ],
  agency: [
    { id: 1, title: "Agency Management", progress: 85, instructor: "Priya Patel", duration: "12 weeks" },
    { id: 2, title: "Client Acquisition", progress: 25, instructor: "David Kim", duration: "8 weeks" }
  ]
};

const Dashboard = () => {
  const [currentUser, setCurrentUser] = useState(userData.student);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [assignmentToSubmit, setAssignmentToSubmit] = useState(null);
  const [assignmentContent, setAssignmentContent] = useState('');
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Set dark mode class on body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle user role change
  const handleRoleChange = (role) => {
    setCurrentUser(userData[role]);
    setActiveView('dashboard');
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'courses', label: 'My Courses', icon: <BookOpen size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <ListChecks size={20} /> },
    { id: 'certificates', label: 'Certificates', icon: <BadgeCheck size={20} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
    { id: 'resources', label: 'Resources', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  // Render dashboard content based on active view
  const renderContent = () => {
    switch (activeView) {
      case 'courses':
        return <CoursesView user={currentUser} />;
      case 'assignments':
        return <AssignmentsView 
          user={currentUser} 
          onAssignmentClick={(assignment) => {
            setAssignmentToSubmit(assignment);
            setShowAssignmentModal(true);
          }} 
        />;
      case 'certificates':
        return <CertificatesView user={currentUser} />;
      case 'calendar':
        return <CalendarView user={currentUser} />;
      case 'resources':
        return <ResourcesView user={currentUser} />;
      case 'settings':
        return <SettingsView user={currentUser} />;
      default:
        return <DashboardHome user={currentUser} />;
    }
  };

  // Handle assignment submission
  const handleSubmitAssignment = () => {
    if (!assignmentContent.trim()) return;
    
    // In a real app, this would be an API call
    alert(`Assignment "${assignmentToSubmit.title}" submitted successfully!`);
    setShowAssignmentModal(false);
    setAssignmentContent('');
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Sidebar */}
      <aside className={`fixed lg:static z-30 h-screen w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
              Padak
            </span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)} 
            className="lg:hidden text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex items-center mb-6 p-3 rounded-lg bg-orange-50 dark:bg-gray-700">
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
            <div className="ml-3">
              <h3 className="font-semibold">{currentUser.firstName} {currentUser.lastName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{currentUser.accountType}</p>
            </div>
          </div>
          
          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                  activeView === item.id 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <span className="mr-3">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </span>
              <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            
            <button className="flex items-center w-full p-3 rounded-lg text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
              <span className="mr-3">
                <LogOut size={20} />
              </span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white dark:bg-gray-800 shadow-sm z-20">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="lg:hidden mr-4 text-gray-500 dark:text-gray-400"
              >
                <Menu size={24} />
              </button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search courses, resources..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-500"
                />
                <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              </button>
              
              <div className="flex items-center">
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                <div className="ml-2 hidden md:block">
                  <div className="font-medium">{currentUser.firstName} {currentUser.lastName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">{currentUser.accountType}</div>
                </div>
                <ChevronDown size={20} className="ml-2 text-gray-500 dark:text-gray-400" />
              </div>
            </div>
          </div>
          
          {/* Role Switcher */}
          <div className="px-4 pb-2">
            <div className="flex space-x-2">
              {Object.keys(userData).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                    currentUser.accountType === role
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Assignment Submission Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Submit Assignment</h3>
                <button 
                  onClick={() => setShowAssignmentModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>
              
              <h4 className="text-lg font-semibold mb-2">{assignmentToSubmit.title}</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Course: {assignmentToSubmit.course} | Due: {assignmentToSubmit.dueDate}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Submission</label>
                <textarea
                  value={assignmentContent}
                  onChange={(e) => setAssignmentContent(e.target.value)}
                  rows={8}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-500"
                  placeholder="Type your assignment here or attach files..."
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                  Attach File
                </button>
                
                <div className="space-x-2">
                  <button 
                    onClick={() => setShowAssignmentModal(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSubmitAssignment}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
                  >
                    <CheckCircle size={18} className="mr-2" />
                    Submit Assignment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Home View
const DashboardHome = ({ user }) => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">{user.firstName}</span>!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening with your learning journey today.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Courses Enrolled" 
          value={user.coursesEnrolled} 
          icon={<BookOpen size={20} />} 
          color="from-blue-500 to-blue-400"
        />
        <StatCard 
          title="Courses Completed" 
          value={user.coursesCompleted} 
          icon={<CheckCircle size={20} />} 
          color="from-green-500 to-green-400"
        />
        <StatCard 
          title="Certificates" 
          value={user.certificatesEarned} 
          icon={<BadgeCheck size={20} />} 
          color="from-purple-500 to-purple-400"
        />
        <StatCard 
          title="Learning Streak" 
          value={`${user.learningStreak} days`} 
          icon={<Calendar size={20} />} 
          color="from-orange-500 to-orange-400"
        />
      </div>
      
      {/* Role-specific content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Your Learning Progress</h2>
          <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
            View All <ChevronRight size={18} className="ml-1" />
          </button>
        </div>
        
        {user.accountType === 'student' && (
          <div>
            <p className="mb-4">You're making great progress on your courses! Keep up the good work.</p>
            <div className="space-y-4">
              {courses.student.slice(0, 2).map(course => (
                <CourseProgress key={course.id} course={course} />
              ))}
            </div>
            <div className="mt-6 p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Internship Opportunities</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                New internship positions available at top digital marketing agencies.
              </p>
              <button className="mt-3 px-3 py-1 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors">
                View Opportunities
              </button>
            </div>
          </div>
        )}
        
        {user.accountType === 'professional' && (
          <div>
            <p className="mb-4">Advance your career with these recommended courses:</p>
            <div className="space-y-4">
              {courses.professional.map(course => (
                <CourseProgress key={course.id} course={course} />
              ))}
            </div>
            <div className="mt-6 p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">Networking Opportunities</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Connect with industry professionals in our exclusive networking event.
              </p>
            </div>
          </div>
        )}
        
        {user.accountType === 'business' && (
          <div>
            <p className="mb-4">Track your team's progress and business growth:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Team Progress</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  3 team members actively learning
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Marketing Team</span>
                      <span>65%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-orange-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">ROI Calculator</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Measure the impact of your team's training on business growth.
                </p>
                <button className="mt-3 px-3 py-1 bg-orange-500 text-white text-sm rounded-md hover:bg-orange-600 transition-colors">
                  Calculate ROI
                </button>
              </div>
            </div>
          </div>
        )}
        
        {user.accountType === 'agency' && (
          <div>
            <p className="mb-4">Manage your team and client projects efficiently:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Active Projects</h3>
                <div className="text-3xl font-bold text-orange-500">7</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Team Members</h3>
                <div className="text-3xl font-bold text-orange-500">12</div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="font-semibold mb-2">Client Satisfaction</h3>
                <div className="text-3xl font-bold text-orange-500">94%</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-orange-50 dark:bg-gray-700 rounded-lg">
              <h3 className="font-semibold mb-2">White-label Resources</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Access exclusive resources for client training and presentations.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <ActivityItem 
            icon={<CheckCircle size={18} />}
            title="Completed 'SEO Fundamentals' course"
            time="2 hours ago"
          />
          <ActivityItem 
            icon={<FileText size={18} />}
            title="Submitted 'Social Media Analysis' assignment"
            time="1 day ago"
          />
          <ActivityItem 
            icon={<BadgeCheck size={18} />}
            title="Earned 'Content Marketing' certificate"
            time="3 days ago"
          />
          <ActivityItem 
            icon={<Users size={18} />}
            title="Joined 'Digital Marketers' community group"
            time="5 days ago"
          />
        </div>
      </div>
    </div>
  );
};

// Assignments View
const AssignmentsView = ({ user, onAssignmentClick }) => {
  const userAssignments = assignments[user.accountType];
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Your Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and submit your course assignments
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Assignments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Pending Assignments</h2>
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
              {userAssignments.filter(a => a.status === 'pending').length}
            </span>
          </div>
          
          {userAssignments.filter(a => a.status === 'pending').length > 0 ? (
            <div className="space-y-4">
              {userAssignments.filter(a => a.status === 'pending').map(assignment => (
                <AssignmentItem 
                  key={assignment.id} 
                  assignment={assignment} 
                  onClick={() => onAssignmentClick(assignment)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p>No pending assignments! Great job!</p>
            </div>
          )}
        </div>
        
        {/* Completed Assignments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Completed Assignments</h2>
            <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              {userAssignments.filter(a => a.status === 'completed').length}
            </span>
          </div>
          
          {userAssignments.filter(a => a.status === 'completed').length > 0 ? (
            <div className="space-y-4">
              {userAssignments.filter(a => a.status === 'completed').map(assignment => (
                <AssignmentItem 
                  key={assignment.id} 
                  assignment={assignment} 
                  onClick={() => onAssignmentClick(assignment)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Clock size={40} className="mx-auto mb-3 text-orange-500" />
              <p>No assignments completed yet. Keep learning!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Other views would be defined similarly (CoursesView, CertificatesView, etc.)
// For brevity, I'll show a placeholder for the CoursesView

const CoursesView = ({ user }) => {
  const userCourses = courses[user.accountType];
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Your Courses</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your learning journey
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userCourses.map(course => (
          <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-orange-500 to-orange-400"></div>
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg mb-1">{course.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    Instructor: {course.instructor} | {course.duration}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-gray-700 flex items-center justify-center">
                  <BookOpen size={18} className="text-orange-500" />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full" 
                    style={{ width: `${course.progress}%` }}
                  ></div>
                </div>
              </div>
              
              <button className="mt-4 w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                Continue Learning
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Placeholder components for other views
const CertificatesView = () => (
  <div>
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Your Certificates</h1>
    <p className="text-gray-600 dark:text-gray-400">View and manage your earned certificates</p>
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
      <BadgeCheck size={48} className="mx-auto text-orange-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Coming Soon!</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This section is under development and will be available soon.
      </p>
    </div>
  </div>
);

const CalendarView = () => (
  <div>
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Learning Calendar</h1>
    <p className="text-gray-600 dark:text-gray-400">Schedule your learning sessions</p>
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
      <Calendar size={48} className="mx-auto text-orange-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Coming Soon!</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This section is under development and will be available soon.
      </p>
    </div>
  </div>
);

const ResourcesView = () => (
  <div>
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Learning Resources</h1>
    <p className="text-gray-600 dark:text-gray-400">Access additional learning materials</p>
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
      <FileText size={48} className="mx-auto text-orange-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Coming Soon!</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This section is under development and will be available soon.
      </p>
    </div>
  </div>
);

const SettingsView = () => (
  <div>
    <h1 className="text-2xl md:text-3xl font-bold mb-4">Account Settings</h1>
    <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md p-8 text-center">
      <Settings size={48} className="mx-auto text-orange-500 mb-4" />
      <h2 className="text-xl font-bold mb-2">Coming Soon!</h2>
      <p className="text-gray-600 dark:text-gray-400">
        This section is under development and will be available soon.
      </p>
    </div>
  </div>
);

// Helper Components
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
        {React.cloneElement(icon, { className: "text-white" })}
      </div>
    </div>
  </div>
);

const CourseProgress = ({ course }) => (
  <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
    <div className="flex justify-between">
      <h3 className="font-semibold">{course.title}</h3>
      <span className="text-sm text-gray-500 dark:text-gray-400">{course.progress}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
      <div 
        className="bg-gradient-to-r from-orange-500 to-orange-400 h-2 rounded-full" 
        style={{ width: `${course.progress}%` }}
      ></div>
    </div>
    <button className="mt-3 text-sm text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300">
      Continue Learning
    </button>
  </div>
);

const ActivityItem = ({ icon, title, time }) => (
  <div className="flex items-start">
    <div className="mt-1 mr-3 p-2 bg-orange-100 dark:bg-gray-700 rounded-full">
      {React.cloneElement(icon, { className: "text-orange-500", size: 16 })}
    </div>
    <div>
      <p className="font-medium">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{time}</p>
    </div>
  </div>
);

const AssignmentItem = ({ assignment, onClick }) => (
  <div 
    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
    onClick={onClick}
  >
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-semibold">{assignment.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{assignment.course}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs ${
        assignment.status === 'pending' 
          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' 
          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
      }`}>
        {assignment.status === 'pending' ? 'Pending' : `Grade: ${assignment.grade}`}
      </span>
    </div>
    <div className="flex justify-between mt-3 text-sm">
      <span className="text-gray-500 dark:text-gray-400">Due: {assignment.dueDate}</span>
      {assignment.status === 'pending' && (
        <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
          Submit <ChevronRight size={16} />
        </button>
      )}
    </div>
  </div>
);

export default Dashboard;