import { NextRequest, NextResponse } from 'next/server';

// Dummy saved jobs data
const savedJobs = [
  {
    id: "saved-1",
    jobId: "job-2",
    userId: "user-1",
    savedDate: "2024-01-20",
    notes: "Interesting remote opportunity, good tech stack",
    jobDetails: {
      title: "Senior Full Stack Engineer",
      company: "InnovateCorp",
      location: "Remote",
      salary: "$120k - $150k",
      classification: "target"
    }
  },
  {
    id: "saved-2",
    jobId: "job-4",
    userId: "user-1",
    savedDate: "2024-01-19",
    notes: "Dream role to work towards - need more experience",
    jobDetails: {
      title: "Principal Software Architect",
      company: "BigTech Solutions",
      location: "Seattle",
      salary: "$200k - $250k",
      classification: "dream"
    }
  },
  {
    id: "saved-3",
    jobId: "job-7",
    userId: "user-1",
    savedDate: "2024-01-18",
    notes: "Good match for my Python skills",
    jobDetails: {
      title: "Full Stack Developer",
      company: "GrowthTech",
      location: "San Francisco",
      salary: "$95k - $125k",
      classification: "target"
    }
  }
];

export async function GET() {
  // Sort by saved date (most recent first)
  const sortedSavedJobs = [...savedJobs].sort((a, b) => {
    const dateA = new Date(a.savedDate);
    const dateB = new Date(b.savedDate);
    return dateB.getTime() - dateA.getTime();
  });

  return NextResponse.json({
    savedJobs: sortedSavedJobs,
    total: savedJobs.length
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Check if job is already saved
    const existingSave = savedJobs.find(save => save.jobId === body.jobId);
    if (existingSave) {
      return NextResponse.json(
        { error: "Job already saved" },
        { status: 400 }
      );
    }
    
    const newSavedJob = {
      id: `saved-${Date.now()}`,
      jobId: body.jobId,
      userId: "user-1", // In real app, this would come from auth
      savedDate: new Date().toISOString().split('T')[0],
      notes: body.notes || "",
      jobDetails: body.jobDetails || {}
    };
    
    savedJobs.unshift(newSavedJob);
    
    return NextResponse.json({
      savedJob: newSavedJob,
      message: "Job saved successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save job" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    const savedJobIndex = savedJobs.findIndex(save => save.id === id);
    if (savedJobIndex === -1) {
      return NextResponse.json(
        { error: "Saved job not found" },
        { status: 404 }
      );
    }
    
    savedJobs[savedJobIndex] = {
      ...savedJobs[savedJobIndex],
      ...updates
    };
    
    return NextResponse.json({
      savedJob: savedJobs[savedJobIndex],
      message: "Saved job updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update saved job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    
    const savedJobIndex = savedJobs.findIndex(save => save.jobId === jobId);
    if (savedJobIndex === -1) {
      return NextResponse.json(
        { error: "Saved job not found" },
        { status: 404 }
      );
    }
    
    savedJobs.splice(savedJobIndex, 1);
    
    return NextResponse.json({
      message: "Job removed from saved jobs"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to remove saved job" },
      { status: 500 }
    );
  }
}