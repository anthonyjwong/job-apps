import { NextRequest, NextResponse } from 'next/server';

// Dummy interviews data
const interviews = [
  {
    id: "interview-1",
    company: "TechCorp",
    position: "Senior Frontend Developer",
    type: "Technical",
    date: "2024-01-25",
    time: "2:00 PM",
    duration: 60,
    status: "scheduled",
    interviewer: "Sarah Johnson",
    notes: "Focus on React performance optimization",
    applicationId: 1,
    location: "Video call",
    preparationItems: [
      "Review React performance patterns",
      "Prepare code samples",
      "Research company products"
    ]
  },
  {
    id: "interview-2",
    company: "StartupXYZ",
    position: "Full Stack Engineer",
    type: "Phone Screen",
    date: "2024-01-26",
    time: "10:00 AM",
    duration: 30,
    status: "scheduled",
    interviewer: "Mike Chen",
    notes: "Initial screening call",
    applicationId: 2,
    location: "Phone call",
    preparationItems: [
      "Review resume highlights",
      "Prepare elevator pitch",
      "Research startup background"
    ]
  },
  {
    id: "interview-3",
    company: "InnovateLabs",
    position: "Lead Product Engineer",
    type: "Final",
    date: "2024-01-22",
    time: "3:30 PM",
    duration: 90,
    status: "completed",
    interviewer: "Alex Rodriguez",
    notes: "Went well - expecting offer",
    applicationId: 3,
    location: "On-site",
    preparationItems: [
      "Leadership scenarios",
      "System design questions",
      "Company culture questions"
    ]
  },
  {
    id: "interview-4",
    company: "DataDriven",
    position: "Senior Software Engineer",
    type: "Technical",
    date: "2024-01-27",
    time: "11:00 AM",
    duration: 75,
    status: "scheduled",
    interviewer: "Jennifer Liu",
    notes: "Data structures and algorithms focus",
    applicationId: 6,
    location: "Video call",
    preparationItems: [
      "Practice coding problems",
      "Review data structures",
      "Prepare questions about the role"
    ]
  },
  {
    id: "interview-5",
    company: "GrowthCo",
    position: "Frontend Developer",
    type: "Phone Screen",
    date: "2024-01-24",
    time: "9:00 AM",
    duration: 30,
    status: "completed",
    interviewer: "Tom Wilson",
    notes: "Good first conversation",
    applicationId: 5,
    location: "Phone call",
    preparationItems: [
      "Technical background discussion",
      "Interest in role",
      "Availability discussion"
    ]
  }
];

export async function GET() {
  // Sort by date (upcoming first)
  const sortedInterviews = [...interviews].sort((a, b) => {
    const dateA = new Date(`${a.date} ${a.time}`);
    const dateB = new Date(`${b.date} ${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  return NextResponse.json({
    interviews: sortedInterviews,
    total: interviews.length,
    upcoming: interviews.filter(i => i.status === "scheduled").length,
    completed: interviews.filter(i => i.status === "completed").length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newInterview = {
      id: `interview-${Date.now()}`,
      company: body.company,
      position: body.position,
      type: body.type || "Phone Screen",
      date: body.date,
      time: body.time,
      duration: body.duration || 60,
      status: body.status || "scheduled",
      interviewer: body.interviewer || "",
      notes: body.notes || "",
      applicationId: body.applicationId,
      location: body.location || "Video call",
      preparationItems: body.preparationItems || []
    };
    
    interviews.unshift(newInterview);
    
    return NextResponse.json({
      interview: newInterview,
      message: "Interview scheduled successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to schedule interview" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const interviewIndex = interviews.findIndex(interview => interview.id === id);
    if (interviewIndex === -1) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }
    
    interviews[interviewIndex] = {
      ...interviews[interviewIndex],
      ...updates
    };
    
    return NextResponse.json({
      interview: interviews[interviewIndex],
      message: "Interview updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update interview" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const interviewIndex = interviews.findIndex(interview => interview.id === id);
    if (interviewIndex === -1) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 }
      );
    }
    
    interviews.splice(interviewIndex, 1);
    
    return NextResponse.json({
      message: "Interview cancelled successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to cancel interview" },
      { status: 500 }
    );
  }
}