import { NextRequest, NextResponse } from 'next/server';

// Dummy applications data
const applications = [
  {
    id: 1,
    company: "TechCorp",
    position: "Senior Frontend Developer",
    status: "interviewed",
    applicationDate: "2024-01-15",
    location: "San Francisco",
    salary: "$120k - $150k",
    jobType: "full-time",
    classification: "safety",
    aiAction: "Highlight your React performance optimization experience in the technical discussion",
    notes: "Really excited about this role - great culture fit"
  },
  {
    id: 2,
    company: "StartupXYZ",
    position: "Full Stack Engineer",
    status: "submitted",
    applicationDate: "2024-01-14",
    location: "Remote",
    salary: "$100k - $130k",
    jobType: "full-time",
    classification: "target",
    aiAction: "Prepare specific examples of your full-stack projects with measurable impact",
    notes: "Applied through their careers page"
  },
  {
    id: 3,
    company: "InnovateLabs",
    position: "Lead Product Engineer",
    status: "offered",
    applicationDate: "2024-01-10",
    location: "New York",
    salary: "$140k - $170k",
    jobType: "full-time",
    classification: "reach",
    aiAction: "Demonstrate leadership experience by discussing team mentoring examples",
    notes: "Final round went well!"
  },
  {
    id: 4,
    company: "BigTech Inc",
    position: "Principal Software Engineer",
    status: "rejected",
    applicationDate: "2024-01-08",
    location: "Seattle",
    salary: "$180k - $220k",
    jobType: "full-time",
    classification: "dream",
    aiAction: "Focus on system design and architecture expertise for future similar roles",
    notes: "Good learning experience"
  },
  {
    id: 5,
    company: "GrowthCo",
    position: "Frontend Developer",
    status: "interviewed",
    applicationDate: "2024-01-12",
    location: "Austin",
    salary: "$90k - $120k",
    jobType: "full-time",
    classification: "safety",
    aiAction: "Emphasize your component library and design system experience",
    notes: "Phone screen scheduled for this week"
  },
  {
    id: 6,
    company: "DataDriven",
    position: "Senior Software Engineer",
    status: "interviewed",
    applicationDate: "2024-01-11",
    location: "Remote",
    salary: "$110k - $140k",
    jobType: "full-time",
    classification: "target",
    aiAction: "Prepare for data structure and algorithm questions focusing on real-world applications",
    notes: "Technical round coming up"
  },
  {
    id: 7,
    company: "FinanceFlow",
    position: "Software Engineer",
    status: "withdrawn",
    applicationDate: "2024-01-05",
    location: "Boston",
    salary: "$95k - $125k",
    jobType: "full-time",
    classification: "target",
    aiAction: "Consider reapplying in 6 months with additional experience",
    notes: "Decided to withdraw after learning more about the role"
  }
];

export async function GET() {
  return NextResponse.json({
    applications,
    total: applications.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newApplication = {
      id: Math.max(...applications.map(a => a.id)) + 1,
      company: body.company,
      position: body.position,
      status: body.status || "submitted",
      applicationDate: body.applicationDate || new Date().toISOString().split('T')[0],
      location: body.location || "",
      salary: body.salary || "",
      jobType: body.jobType || "full-time",
      classification: body.classification || "target",
      aiAction: body.aiAction || "Follow up with a personalized message highlighting your relevant experience",
      notes: body.notes || ""
    };
    
    applications.unshift(newApplication);
    
    return NextResponse.json({
      application: newApplication,
      message: "Application created successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const applicationIndex = applications.findIndex(app => app.id === id);
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    applications[applicationIndex] = {
      ...applications[applicationIndex],
      ...updates
    };
    
    return NextResponse.json({
      application: applications[applicationIndex],
      message: "Application updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = parseInt(url.searchParams.get('id') || '0');
    
    const applicationIndex = applications.findIndex(app => app.id === id);
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }
    
    applications.splice(applicationIndex, 1);
    
    return NextResponse.json({
      message: "Application deleted successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    );
  }
}