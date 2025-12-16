import { Card, CardContent } from "@/app/components/ui/card";
import { X, Check, Clock, Users, AlertTriangle, Zap } from "lucide-react";

const problems = [
  {
    icon: AlertTriangle,
    title: "Content Approval Bottlenecks",
    description: "Posts get stuck waiting for approval, missing optimal posting times",
    color: "text-red-500",
    bgColor: "bg-red-50",
    borderColor: "border-red-200"
  },
  {
    icon: Clock,
    title: "Manual Multi-Platform Posting",
    description: "Spending hours posting the same content across 6+ different platforms",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  {
    icon: Users,
    title: "Team Coordination Chaos",
    description: "Confusion about who creates what, when it's approved, and what's published",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200"
  }
];

const solutions = [
  {
    icon: Zap,
    title: "Streamlined Approval Workflow",
    description: "Clear pipeline: Editor creates → Admin approves → System publishes automatically",
    color: "text-green-500",
    bgColor: "bg-green-50",
    borderColor: "border-green-200"
  },
  {
    icon: Check,
    title: "One-Click Multi-Platform Publishing",
    description: "Create once, publish everywhere. YouTube, TikTok, Instagram, LinkedIn, X, Facebook",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    icon: Users,
    title: "Crystal Clear Team Collaboration",
    description: "Role-based access, live status updates, shared calendar - everyone knows their part",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200"
  }
];

const ProblemSolutionSection = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Stop Fighting <span className="text-red-500">These Problems</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Most teams struggle with chaotic content workflows. See if this sounds familiar...
          </p>
        </div>

        {/* Problems */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {problems.map((problem, index) => (
            <Card key={index} className={`${problem.bgColor} ${problem.borderColor} border-2 shadow-soft`}>
              <CardContent className="p-8 text-center transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02]">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-soft mb-6 ${problem.color}`}>
                  <problem.icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {problem.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed md:hidden">
                  {problem.description}
                </p>
                
                <div className="mt-4 inline-flex items-center text-red-500 font-medium hidden lg:flex">
                  <X className="h-4 w-4 mr-2" />
                  Common Problem
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Divider */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center bg-primary/10 border border-primary/20 rounded-full px-6 py-3">
            <span className="text-primary font-semibold text-lg">Uplora's Solution</span>
          </div>
        </div>

        {/* Solutions */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {solutions.map((solution, index) => (
            <Card key={index} className={`${solution.bgColor} ${solution.borderColor} border-2 shadow-medium hover-lift`}>
              <CardContent className="p-8 text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-soft mb-6 ${solution.color}`}>
                  <solution.icon className="h-8 w-8" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4 text-foreground">
                  {solution.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed md:hidden">
                  {solution.description}
                </p>
                
                <div className="mt-4 inline-flex items-center text-green-500 font-medium hidden lg:flex">
                  <Check className="h-4 w-4 mr-2" />
                  Solved by Uplora
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Result */}
        <div className="text-center">
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-primary/5 to-accent/5 border-2 border-primary/20">
            <CardContent className="p-12">
              <h3 className="text-3xl font-bold mb-6">
                <span className="gradient-text">The Result?</span> Your Team Operates Like a Well-Oiled Machine
              </h3>
              
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">75%</div>
                  <div className="text-muted-foreground">Less time spent on manual posting</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-accent mb-2">Zero</div>
                  <div className="text-muted-foreground">Missed deadlines or forgotten posts</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-500 mb-2">100%</div>
                  <div className="text-muted-foreground">Content approved before publishing</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default ProblemSolutionSection;