import { fetchSkillDevelopmentData } from "@/app/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@radix-ui/react-progress";
import { BookOpen, Brain, Lightbulb, Star } from "lucide-react";
import Card from "../card";
import Header from "../header";

export default async function SkillDevelopmentOverview() {
    const skillGaps = await fetchSkillDevelopmentData();

    return (
        <Card>
            <Header Icon={BookOpen} text="Skill Development" subtext="Build skills to unlock reach and dream job opportunities" />

            <div>
                <div className="space-y-6">
                    {/* Skill Gap Analysis */}
                    <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-yellow-500" />
                            Priority Skills to Learn
                        </h4>
                        <div className="space-y-3">
                            {skillGaps.map((gap, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${gap.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                                        <div>
                                            <p className="font-medium">{gap.skill}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Required in {gap.jobs} reach/dream jobs
                                            </p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline">
                                        Learn
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dream Job Tracking */}
                    <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                            <Star className="w-4 h-4 text-dream" />
                            Dream Job Progress
                        </h4>
                        {/* <div className="space-y-3">
                            {savedJobs.filter(job => job.category === 'dream').slice(0, 2).map((job, index) => (
                                <div key={index} className="p-3 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium">{job.title} at {job.company}</p>
                                        <Badge variant="outline" className="text-dream border-dream/20">
                                            <Star className="w-3 h-3 mr-1" />
                                            Dream
                                        </Badge>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span>Skill match</span>
                                            <span>60%</span>
                                        </div>
                                        <Progress value={60} className="h-1" />
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Missing: Advanced React, System Design, Leadership Experience
                                    </p>
                                </div>
                            ))}
                        </div> */}
                    </div>

                    {/* Learning Resources */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-purple-500" />
                            <p className="font-medium">AI-Recommended Learning Path</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                            Based on your target jobs, focus on React advanced patterns and AWS certification
                        </p>
                        <Button size="sm" variant="outline">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Start Learning Plan
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}