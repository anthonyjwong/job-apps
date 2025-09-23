import { Star, TrendingUp, Trophy } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";

interface CareerProgressionProps {
  dreamJobs: Array<{
    id: string;
    title: string;
    company: string;
    skills: string[];
    salary?: string;
  }>;
  currentSkills: string[];
}

export function CareerProgression({ dreamJobs, currentSkills }: CareerProgressionProps) {
  // Analyze skill gaps for each dream job
  const dreamJobAnalysis = dreamJobs.map(job => {
    const requiredSkills = job.skills;
    const matchingSkills = requiredSkills.filter(skill => 
      currentSkills.some(current => 
        current.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(current.toLowerCase())
      )
    );
    const missingSkills = requiredSkills.filter(skill => 
      !currentSkills.some(current => 
        current.toLowerCase().includes(skill.toLowerCase()) || 
        skill.toLowerCase().includes(current.toLowerCase())
      )
    );
    const skillMatch = Math.round((matchingSkills.length / requiredSkills.length) * 100);
    
    return {
      ...job,
      skillMatch,
      matchingSkills,
      missingSkills
    };
  });

  // Sort by skill match percentage
  const sortedDreamJobs = dreamJobAnalysis.sort((a, b) => b.skillMatch - a.skillMatch);

  // Find most common missing skills across all dream jobs
  const allMissingSkills = dreamJobAnalysis.flatMap(job => job.missingSkills);
  const skillCounts = allMissingSkills.reduce((acc, skill) => {
    acc[skill] = (acc[skill] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const topMissingSkills = Object.entries(skillCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill]) => skill);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-dream" />
            Career Progression Analysis
          </CardTitle>
          <CardDescription>
            Track your progress towards dream roles and identify key skill gaps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Skill Gap Overview */}
          <div>
            <h4 className="font-medium mb-3">Skills to Develop</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Most Important Skills</p>
                <div className="flex flex-wrap gap-2">
                  {topMissingSkills.slice(0, 3).map((skill) => (
                    <Badge key={skill} variant="outline" className="border-dream/30 text-dream">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Additional Skills</p>
                <div className="flex flex-wrap gap-2">
                  {topMissingSkills.slice(3).map((skill) => (
                    <Badge key={skill} variant="outline" className="border-muted">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Dream Job Progress */}
          <div>
            <h4 className="font-medium mb-3">Progress Towards Dream Roles</h4>
            <div className="space-y-4">
              {sortedDreamJobs.slice(0, 3).map((job) => (
                <Card key={job.id} className="border-dream/20">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <h5 className="font-medium">{job.title}</h5>
                          <p className="text-sm text-muted-foreground">{job.company}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-dream">{job.skillMatch}% Match</div>
                          <div className="text-xs text-muted-foreground">Skill Readiness</div>
                        </div>
                      </div>
                      
                      <Progress value={job.skillMatch} className="h-2" />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">Skills You Have ({job.matchingSkills.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {job.matchingSkills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="secondary" className="text-xs bg-safety/20 text-safety">
                                {skill}
                              </Badge>
                            ))}
                            {job.matchingSkills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{job.matchingSkills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Skills to Develop ({job.missingSkills.length})</p>
                          <div className="flex flex-wrap gap-1">
                            {job.missingSkills.slice(0, 3).map((skill) => (
                              <Badge key={skill} variant="outline" className="text-xs border-reach/30 text-reach">
                                {skill}
                              </Badge>
                            ))}
                            {job.missingSkills.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.missingSkills.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Career Path Suggestions */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-dream/5 to-dream/10 border border-dream/20">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-dream mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium">Next Steps</h4>
                <p className="text-sm text-muted-foreground">
                  Focus on developing {topMissingSkills[0]} and {topMissingSkills[1]} to improve your readiness for dream roles.
                  Consider taking courses, working on projects, or seeking mentorship in these areas.
                </p>
                <div className="flex items-center gap-2 text-xs text-dream">
                  <Trophy className="w-3 h-3" />
                  <span>Average skill match: {Math.round(sortedDreamJobs.reduce((acc, job) => acc + job.skillMatch, 0) / sortedDreamJobs.length)}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}