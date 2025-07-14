import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    accountType: "",
    agreeToTerms: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      console.log("Passwords don't match!");
      return;
    }
    console.log("Registration attempt:", formData);
    // Handle registration logic here
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleTermsClick = () => {
    window.location.href = '/terms';
  };

  const handlePrivacyClick = () => {
    window.location.href = '/privacy';
  };

  const handleSignInClick = () => {
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-background to-orange-100/30 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating background elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-orange-300/5 rounded-full blur-xl animate-pulse delay-500"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-orange-400/8 rounded-full blur-lg animate-pulse delay-300"></div>
      
      <Card className="w-full max-w-md relative z-10 bg-background/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
        {/* Orange accent line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-400"></div>
        
        <CardHeader className="space-y-1">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="mr-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-white-500 to-white-400 rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-300">
                <img 
                  src="https://github.com/Sweety-Vigneshg/Padak-Marketing-Website/blob/main/frontend/src/assets/padak_p.png?raw=true" 
                  alt="Padak Logo" 
                  className="w-5 h-5 object-contain"
                  onError={(e) => {
                    const target = e.target;
                    const nextSibling = target.parentNode.querySelector('span');
                    if (target && nextSibling) {
                      target.style.display = 'none';
                      nextSibling.style.display = 'block';
                    }
                  }}
                />
                <span className="text-white font-bold text-lg" style={{ display: 'none' }}>P</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                Padak
              </span>
            </div>
          </div>
          <CardTitle className="text-2xl text-foreground">Create an account</CardTitle>
          <CardDescription className="text-muted-foreground">
            Join Padak to access exclusive courses and internship opportunities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-foreground">Account Type</Label>
              <Select onValueChange={(value) => setFormData({ ...formData, accountType: value })}>
                <SelectTrigger className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="business">Business Owner</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="border-border focus:border-orange-500 focus:ring-orange-500/20 transition-all duration-300 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => 
                  setFormData({ ...formData, agreeToTerms: !!checked })
                }
                required
                className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500 mt-1"
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed">
                I agree to the{" "}
                <button 
                  type="button"
                  onClick={handleTermsClick}
                  className="text-orange-600 hover:text-orange-700 hover:underline transition-colors font-medium"
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button 
                  type="button"
                  onClick={handlePrivacyClick}
                  className="text-orange-600 hover:text-orange-700 hover:underline transition-colors font-medium"
                >
                  Privacy Policy
                </button>
              </Label>
            </div>
            
            <Button 
              type="submit" 
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              Create Account
            </Button>
            
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button 
                type="button"
                onClick={handleSignInClick}
                className="text-orange-600 hover:text-orange-700 hover:underline transition-colors font-medium"
              >
                Sign in
              </button>
            </div>
          </div>
        </CardContent>
        
        {/* Subtle background pattern */}
        <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-orange-400/5 rounded-full blur-xl"></div>
      </Card>
    </div>
  );
}