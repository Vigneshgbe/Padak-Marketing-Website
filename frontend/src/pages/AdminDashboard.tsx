import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, BookOpen, ListChecks, BadgeCheck, Calendar, 
  Users, Briefcase, BarChart, Settings, LogOut, Menu, X, 
  Search, Bell, ChevronDown, FileText, CheckCircle, Clock, 
  PlusCircle, Download, Share2, Moon, Sun, ChevronRight,
  Shield, UserCheck, MessageSquare, GraduationCap, Edit, Trash2, Save
} from 'lucide-react';

// Add admin user to userData
const userData = {
  admin: {
    id: 0,
    firstName: "Admin",
    lastName: "User",
    email: "admin@padak.com",
    accountType: "admin",
    joinDate: "2023-01-01",
    isAdmin: true,
    profileImage: null
  },
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

// Admin data
const adminData = {
  stats: {
    totalUsers: 1250,
    totalCourses: 24,
    totalEnrollments: 3456,
    totalRevenue: "₹45,67,890",
    activeInternships: 12,
    pendingContacts: 8
  },
  recentUsers: [
    { id: 101, name: "Rahul Kumar", email: "rahul@example.com", type: "student", joinDate: "2024-06-10" },
    { id: 102, name: "Priya Singh", email: "priya@example.com", type: "professional", joinDate: "2024-06-09" },
    { id: 103, name: "Tech Solutions Ltd", email: "contact@techsol.com", type: "business", joinDate: "2024-06-08" }
  ],
  recentEnrollments: [
    { id: 201, userName: "Amit Sharma", courseName: "SEO Mastery", date: "2024-06-11", status: "active" },
    { id: 202, userName: "Neha Patel", courseName: "Social Media Marketing", date: "2024-06-10", status: "active" }
  ]
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

// StatCard Component
const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg bg-gradient-to-br ${color} text-white`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

// CourseProgress Component
const CourseProgress = ({ course }) => {
  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex justify-between mb-2">
        <h3 className="font-semibold">{course.title}</h3>
        <span className="text-sm text-orange-500">{course.progress}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div 
          className="bg-orange-500 h-2.5 rounded-full" 
          style={{ width: `${course.progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-sm text-gray-500 dark:text-gray-400">
        <span>Instructor: {course.instructor}</span>
        <span>{course.duration}</span>
      </div>
    </div>
  );
};

// ActivityItem Component
const ActivityItem = ({ icon, title, time }) => {
  return (
    <div className="flex items-start">
      <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-500">
        {icon}
      </div>
      <div className="ml-4">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{time}</p>
      </div>
    </div>
  );
};

// AssignmentItem Component
const AssignmentItem = ({ assignment, onClick }) => {
  return (
    <div 
      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={() => onClick(assignment)}
    >
      <div className="flex justify-between">
        <h3 className="font-semibold">{assignment.title}</h3>
        <span className={`text-sm px-2 py-1 rounded-full ${
          assignment.status === 'completed' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
            : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
        }`}>
          {assignment.status}
        </span>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Course: {assignment.course}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">Due: {assignment.dueDate}</p>
    </div>
  );
};

// CoursesView Component
const CoursesView = ({ user }) => {
  const userCourses = courses[user.accountType] || [];
  
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">My Courses</h1>
      <div className="space-y-4">
        {userCourses.map(course => (
          <CourseProgress key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
};

// AssignmentsView Component
const AssignmentsView = ({ user, onAssignmentClick }) => {
  const userAssignments = assignments[user.accountType] || [];
  
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Assignments</h1>
      <div className="space-y-4">
        {userAssignments.map(assignment => (
          <AssignmentItem 
            key={assignment.id} 
            assignment={assignment} 
            onClick={onAssignmentClick}
          />
        ))}
      </div>
    </div>
  );
};

// CertificatesView Component
const CertificatesView = ({ user }) => {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Certificates</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p>Certificates for {user.accountType} will be displayed here.</p>
      </div>
    </div>
  );
};

// CalendarView Component
const CalendarView = ({ user }) => {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Calendar</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p>Calendar view for {user.accountType}.</p>
      </div>
    </div>
  );
};

// ResourcesView Component
const ResourcesView = ({ user }) => {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Resources</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p>Resources for {user.accountType}.</p>
      </div>
    </div>
  );
};

// SettingsView Component
const SettingsView = ({ user }) => {
  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Settings</h1>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p>Settings for {user.accountType}.</p>
      </div>
    </div>
  );
};

// DashboardHome Component
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

// Admin Dashboard Home View
const AdminDashboardHome = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Admin Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your platform efficiently
        </p>
      </div>
      
      {/* Admin Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
          title="Total Users" 
          value={adminData.stats.totalUsers} 
          icon={<Users size={20} />} 
          color="from-blue-500 to-blue-400"
        />
        <StatCard 
          title="Total Courses" 
          value={adminData.stats.totalCourses} 
          icon={<BookOpen size={20} />} 
          color="from-green-500 to-green-400"
        />
        <StatCard 
          title="Total Enrollments" 
          value={adminData.stats.totalEnrollments} 
          icon={<UserCheck size={20} />} 
          color="from-purple-500 to-purple-400"
        />
        <StatCard 
          title="Total Revenue" 
          value={adminData.stats.totalRevenue} 
          icon={<BarChart size={20} />} 
          color="from-orange-500 to-orange-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Users</h2>
            <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
              View All <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {adminData.recentUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                    {user.type}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{user.joinDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Recent Enrollments</h2>
            <button className="text-orange-500 hover:text-orange-600 dark:text-orange-400 dark:hover:text-orange-300 flex items-center">
              View All <ChevronRight size={18} className="ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {adminData.recentEnrollments.map(enrollment => (
              <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium">{enrollment.userName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.courseName}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    {enrollment.status}
                  </span>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{enrollment.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <PlusCircle size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Add Course</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <Users size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Manage Users</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <MessageSquare size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">View Messages</p>
          </button>
          <button className="p-4 bg-orange-50 dark:bg-gray-700 rounded-lg hover:bg-orange-100 dark:hover:bg-gray-600 transition-colors">
            <BarChart size={24} className="text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium">Analytics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

// Admin Courses View
const AdminCoursesView = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Courses</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add, edit, or remove courses
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center"
        >
          <PlusCircle size={20} className="mr-2" />
          Add Course
        </button>
      </div>

      {/* Course list would go here */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Course management interface would be displayed here</p>
      </div>
    </div>
  );
};

// Admin Users View
const AdminUsersView = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Manage Users</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and manage all platform users
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">User management interface would be displayed here</p>
      </div>
    </div>
  );
};

// Admin Internships View
const AdminInternshipsView = () => {
  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Manage Internships</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Add and manage internship opportunities
          </p>
        </div>
        <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center">
          <PlusCircle size={20} className="mr-2" />
          Add Internship
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Internship management interface would be displayed here</p>
      </div>
    </div>
  );
};

// Admin Contacts View
const AdminContactsView = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Contact Messages</h1>
        <p className="text-gray-600 dark:text-gray-400">
          View and respond to contact form submissions
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Contact messages would be displayed here</p>
      </div>
    </div>
  );
};

// Admin Enrollments View
const AdminEnrollmentsView = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Course Enrollments</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and manage all course enrollments
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <p className="text-gray-600 dark:text-gray-400">Enrollment management interface would be displayed here</p>
      </div>
    </div>
  );
};

// Admin Analytics View
const AdminAnalyticsView = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Platform performance and insights
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="font-bold mb-4">User Growth</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <BarChart size={48} className="text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="font-bold mb-4">Revenue Trends</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <BarChart size={48} className="text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h3 className="font-bold mb-4">Course Performance</h3>
          <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <BarChart size={48} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
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

  // Navigation items - different for admin
  const getNavItems = () => {
    if (currentUser.isAdmin) {
      return [
        { id: 'dashboard', label: 'Admin Dashboard', icon: <Shield size={20} /> },
        { id: 'manage-courses', label: 'Manage Courses', icon: <BookOpen size={20} /> },
        { id: 'manage-users', label: 'Manage Users', icon: <Users size={20} /> },
        { id: 'manage-internships', label: 'Manage Internships', icon: <GraduationCap size={20} /> },
        { id: 'contact-messages', label: 'Contact Messages', icon: <MessageSquare size={20} /> },
        { id: 'enrollments', label: 'Course Enrollments', icon: <UserCheck size={20} /> },
        { id: 'analytics', label: 'Analytics', icon: <BarChart size={20} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
      ];
    }
    
    return [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'courses', label: 'My Courses', icon: <BookOpen size={20} /> },
      { id: 'assignments', label: 'Assignments', icon: <ListChecks size={20} /> },
      { id: 'certificates', label: 'Certificates', icon: <BadgeCheck size={20} /> },
      { id: 'calendar', label: 'Calendar', icon: <Calendar size={20} /> },
      { id: 'resources', label: 'Resources', icon: <FileText size={20} /> },
      { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
    ];
  };

  const navItems = getNavItems();

  // Render dashboard content based on active view
  const renderContent = () => {
    if (currentUser.isAdmin) {
      switch (activeView) {
        case 'manage-courses':
          return <AdminCoursesView />;
        case 'manage-users':
          return <AdminUsersView />;
        case 'manage-internships':
          return <AdminInternshipsView />;
        case 'contact-messages':
          return <AdminContactsView />;
        case 'enrollments':
          return <AdminEnrollmentsView />;
        case 'analytics':
          return <AdminAnalyticsView />;
        case 'settings':
          return <SettingsView user={currentUser} />;
        default:
          return <AdminDashboardHome />;
      }
    }

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
            <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
              {currentUser.isAdmin && <Shield size={24} className="text-orange-500" />}
            </div>
            <div className="ml-3">
              <h3 className="font-semibold">{currentUser.firstName} {currentUser.lastName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {currentUser.isAdmin ? 'Administrator' : currentUser.accountType}
              </p>
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
                <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10 flex items-center justify-center">
                  {currentUser.isAdmin && <Shield size={20} className="text-orange-500" />}
                </div>
                <div className="ml-2 hidden md:block">
                  <div className="font-medium">{currentUser.firstName} {currentUser.lastName}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                    {currentUser.isAdmin ? 'Administrator' : currentUser.accountType}
                  </div>
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

export default Dashboard;