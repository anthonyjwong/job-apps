import { NextRequest, NextResponse } from 'next/server';

// Dummy assessments data
const assessments = [
  {
    id: "assessment-1",
    company: "TechCorp",
    position: "Senior Frontend Developer",
    type: "Take-home",
    title: "React Dashboard Component",
    description: "Build a responsive dashboard component with charts and real-time data",
    dueDate: "2024-01-28",
    timeLimit: "4 hours",
    status: "pending",
    applicationId: 1,
    instructions: "Create a React component that displays user analytics data with interactive charts. Use TypeScript and include responsive design.",
    submissionUrl: "",
    notes: "Focus on component architecture and performance",
    estimatedEffort: "Medium",
    skills: ["React", "TypeScript", "Charts", "Responsive Design"]
  },
  {
    id: "assessment-2",
    company: "StartupXYZ",
    position: "Full Stack Engineer",
    type: "Coding Challenge",
    title: "API Integration Task",
    description: "Build a full-stack application that integrates with external APIs",
    dueDate: "2024-01-30",
    timeLimit: "6 hours",
    status: "pending",
    applicationId: 2,
    instructions: "Create a web application that fetches data from a public API, stores it in a database, and displays it with CRUD operations.",
    submissionUrl: "",
    notes: "Demonstrate both frontend and backend skills",
    estimatedEffort: "High",
    skills: ["React", "Node.js", "API Integration", "Database"]
  },
  {
    id: "assessment-3",
    company: "DataDriven",
    position: "Senior Software Engineer",
    type: "Live Coding",
    title: "Algorithm Problem Solving",
    description: "Solve coding problems in real-time during interview",
    dueDate: "2024-01-27",
    timeLimit: "45 minutes",
    status: "scheduled",
    applicationId: 6,
    instructions: "Be prepared to solve 2-3 coding problems involving data structures and algorithms. Focus on clean, efficient code.",
    submissionUrl: "",
    notes: "Practice dynamic programming and tree traversal",
    estimatedEffort: "Medium",
    skills: ["Algorithms", "Data Structures", "Problem Solving"]
  },
  {
    id: "assessment-4",
    company: "DesignStudio",
    position: "Frontend Engineer",
    type: "Design Implementation",
    title: "Pixel-Perfect Component",
    description: "Convert Figma design to responsive React component",
    dueDate: "2024-01-26",
    timeLimit: "3 hours",
    status: "completed",
    applicationId: 8,
    instructions: "Implement the provided Figma design as a React component. Pay attention to spacing, typography, and responsive behavior.",
    submissionUrl: "https://github.com/username/design-implementation",
    notes: "Submitted ahead of deadline",
    estimatedEffort: "Low",
    skills: ["React", "CSS", "Responsive Design", "Figma"]
  },
  {
    id: "assessment-5",
    company: "CloudFirst",
    position: "DevOps Engineer",
    type: "Infrastructure",
    title: "Container Deployment",
    description: "Deploy a multi-service application using Docker and Kubernetes",
    dueDate: "2024-02-02",
    timeLimit: "8 hours",
    status: "pending",
    applicationId: 6,
    instructions: "Containerize the provided application and create Kubernetes manifests for deployment. Include monitoring and logging setup.",
    submissionUrl: "",
    notes: "Focus on best practices and security",
    estimatedEffort: "High",
    skills: ["Docker", "Kubernetes", "Infrastructure", "DevOps"]
  }
];

export async function GET() {
  // Sort by due date (upcoming first)
  const sortedAssessments = [...assessments].sort((a, b) => {
    const dateA = new Date(a.dueDate);
    const dateB = new Date(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });

  return NextResponse.json({
    assessments: sortedAssessments,
    total: assessments.length,
    pending: assessments.filter(a => a.status === "pending").length,
    completed: assessments.filter(a => a.status === "completed").length,
    scheduled: assessments.filter(a => a.status === "scheduled").length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newAssessment = {
      id: `assessment-${Date.now()}`,
      company: body.company,
      position: body.position,
      type: body.type || "Take-home",
      title: body.title,
      description: body.description,
      dueDate: body.dueDate,
      timeLimit: body.timeLimit || "4 hours",
      status: body.status || "pending",
      applicationId: body.applicationId,
      instructions: body.instructions || "",
      submissionUrl: body.submissionUrl || "",
      notes: body.notes || "",
      estimatedEffort: body.estimatedEffort || "Medium",
      skills: body.skills || []
    };
    
    assessments.unshift(newAssessment);
    
    return NextResponse.json({
      assessment: newAssessment,
      message: "Assessment created successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const assessmentIndex = assessments.findIndex(assessment => assessment.id === id);
    if (assessmentIndex === -1) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }
    
    assessments[assessmentIndex] = {
      ...assessments[assessmentIndex],
      ...updates
    };
    
    return NextResponse.json({
      assessment: assessments[assessmentIndex],
      message: "Assessment updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const assessmentIndex = assessments.findIndex(assessment => assessment.id === id);
    if (assessmentIndex === -1) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }
    
    assessments.splice(assessmentIndex, 1);
    
    return NextResponse.json({
      message: "Assessment deleted successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete assessment" },
      { status: 500 }
    );
  }
}