import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Shield, Users, FileText } from "lucide-react";
import { HITAMTreeLoading } from "@/components/ui/loading-animation";

interface AuthenticationCardProps {
  onLogin: (role: string) => void;
}

export function AuthenticationCard({ onLogin }: AuthenticationCardProps) {
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [loginMethod, setLoginMethod] = useState<"google" | "hitam">("google");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const carouselImages = [
    '/carousel-1.jpg',
    '/carousel-3.png',
    '/carousel-4.webp'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [carouselImages.length]);

  const roles = [
    { value: "principal", label: "Principal", icon: Building2 },
    { value: "registrar", label: "Registrar", icon: Shield },
    { value: "hod", label: "HOD", icon: Users },
    { value: "program-head", label: "Program Department Head", icon: Users },
    { value: "employee", label: "Employee", icon: FileText },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRole) {
      setIsLoading(true);
      onLogin(selectedRole);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
        <HITAMTreeLoading size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-4xl shadow-elegant overflow-hidden">
        <div className="flex">
          {/* Image Carousel */}
          <div className="hidden lg:block flex-1 relative bg-gray-100">
            {carouselImages.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt={`Carousel ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
            
            {/* Dot Navigation */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {carouselImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'bg-white scale-110'
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
          
          {/* Login Form */}
          <div className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-glow">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">IAOMS Login</CardTitle>
            <CardDescription>
              Hyderabad Institute of Technology and Management
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Select Your Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose your role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <role.icon className="w-4 h-4" />
                        {role.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant={loginMethod === "google" ? "default" : "outline"}
                onClick={() => setLoginMethod("google")}
                className="flex-1"
              >
                Google
              </Button>
              <Button
                type="button"
                variant={loginMethod === "hitam" ? "default" : "outline"}
                onClick={() => setLoginMethod("hitam")}
                className="flex-1"
              >
                HITAM ID
              </Button>
            </div>

            {loginMethod === "google" ? (
              <div className="space-y-4">
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={!selectedRole}
                >
                  Sign in with Google (@hitam.org)
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Only @hitam.org email addresses are allowed
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hitam-id">HITAM ID</Label>
                  <Input id="hitam-id" placeholder="Enter your HITAM ID" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter your password" />
                </div>
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full"
                  disabled={!selectedRole}
                >
                  Sign In
                </Button>
              </div>
            )}
          </form>

          <Separator />

          <div className="text-center text-sm text-muted-foreground">
            <p>Institutional Activity Oversight and Management System</p>
            <p className="text-xs mt-1">© 2025 HITAM. All rights reserved.</p>
          </div>
        </CardContent>
          </div>
        </div>
      </Card>
    </div>
  );
}