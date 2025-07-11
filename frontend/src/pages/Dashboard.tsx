import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award,
  Clock,
  Play,
  CheckCircle,
  Star,
  BarChart3,
  Calendar,
  Download,
  Settings
} from "lucide-react";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  const userStats = {
    coursesEnrolled: 3,
    coursesCompleted: 1,
    hoursLearned: 45,
    certificatesEarned: 1,
    overallProgress: 68
  };

  const enrolledCourses = [
    {
      id: 1,
      title: "Complete Digital Marketing Mastery",
      progress: 85,
      nextLesson: "Email Marketing Automation",
      totalLessons: 48,
      completedLessons: 41,
      timeSpent: "28 hours"
    },
    {
      id: 2,
      title: "Advanced SEO Optimization",
      progress: 45,
      nextLesson: "Technical SEO Audit",
      totalLessons: 32,
      completedLessons: 14,
      timeSpent: "12 hours"
    },
    {
      id: 3,
      title: "Social Media Marketing Pro",
      progress: 20,
      nextLesson: "Instagram Content Strategy",
      totalLessons: 40,
      completedLessons: 8,
      timeSpent: "5 hours"
    }
  ];

  const recentActivity = [
    { action: "Completed lesson", content: "Facebook Ads Targeting", time: "2 hours ago" },
    { action: "Started course", content: "Social Media Marketing Pro", time: "1 day ago" },
    { action: "Earned certificate", content: "Digital Marketing Fundamentals", time: "3 days ago" },
    { action: "Completed course", content: "Complete Digital Marketing Mastery", time: "1 week ago" }
  ];

  const upcomingDeadlines = [
    { task: "SEO Project Submission", course: "Advanced SEO", dueDate: "Tomorrow", priority: "high" },
    { task: "Social Media Campaign", course: "Social Media Pro", dueDate: "3 days", priority: "medium" },
    { task: "Final Assessment", course: "Digital Marketing", dueDate: "1 week", priority: "low" }
  ];

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, John!</h1>
              <p className="text-muted-foreground">Continue your learning journey</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export Progress
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="certificates">Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Courses Enrolled</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.coursesEnrolled}</div>
                  <p className="text-xs text-muted-foreground">
                    {userStats.coursesCompleted} completed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.hoursLearned}</div>
                  <p className="text-xs text-muted-foreground">
                    This month: 12 hours
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Certificates</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.certificatesEarned}</div>
                  <p className="text-xs text-muted-foreground">
                    2 in progress
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userStats.overallProgress}%</div>
                  <Progress value={userStats.overallProgress} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.action}</p>
                          <p className="text-sm text-muted-foreground">{activity.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Deadlines</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingDeadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{deadline.task}</p>
                          <p className="text-sm text-muted-foreground">{deadline.course}</p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant={deadline.priority === "high" ? "destructive" : 
                                   deadline.priority === "medium" ? "default" : "secondary"}
                          >
                            {deadline.dueDate}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            {enrolledCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      <CardDescription>
                        {course.completedLessons} of {course.totalLessons} lessons completed
                      </CardDescription>
                    </div>
                    <Button>
                      <Play className="w-4 h-4 mr-2" />
                      Continue Learning
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} />
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Next Lesson:</span>
                        <p className="font-medium">{course.nextLesson}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Time Spent:</span>
                        <p className="font-medium">{course.timeSpent}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Completion:</span>
                        <p className="font-medium">{course.completedLessons}/{course.totalLessons} lessons</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress Analytics</CardTitle>
                <CardDescription>Track your learning journey and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Detailed Analytics Coming Soon</h3>
                  <p className="text-muted-foreground">
                    Advanced progress tracking and performance analytics will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Award className="w-8 h-8 text-yellow-500" />
                    <Badge>Completed</Badge>
                  </div>
                  <CardTitle>Digital Marketing Fundamentals</CardTitle>
                  <CardDescription>Completed on January 15, 2024</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-medium">4.9/5.0</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Award className="w-8 h-8 text-muted-foreground" />
                    <Badge variant="outline">In Progress</Badge>
                  </div>
                  <CardTitle>Advanced SEO Optimization</CardTitle>
                  <CardDescription>45% completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={45} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Complete remaining 18 lessons to earn certificate
                  </p>
                </CardContent>
              </Card>

              <Card className="border-dashed">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Award className="w-8 h-8 text-muted-foreground" />
                    <Badge variant="outline">In Progress</Badge>
                  </div>
                  <CardTitle>Social Media Marketing Pro</CardTitle>
                  <CardDescription>20% completed</CardDescription>
                </CardHeader>
                <CardContent>
                  <Progress value={20} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Complete remaining 32 lessons to earn certificate
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}