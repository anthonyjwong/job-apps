import { NextRequest, NextResponse } from 'next/server';

// Dummy jobs data with AI-powered classifications
const jobs = [
  {
    id: "job-1",
    title: "Frontend Developer",
    company: "TechFlow",
    location: "San Francisco",
    salary: "$90k - $120k",
    type: "full-time",
    postedDate: "2024-01-20",
    description: "We're looking for a talented Frontend Developer to join our growing team. You'll work on building user-facing features using React and TypeScript.",
    skills: ["React", "TypeScript", "CSS", "JavaScript"],
    category: "safety",
    aiScore: 85,
    aiAction: "Highlight your React portfolio projects and emphasize your TypeScript experience"
  },
  {
    id: "job-2",
    title: "Senior Full Stack Engineer",
    company: "InnovateCorp",
    location: "Remote",
    salary: "$120k - $150k",
    type: "full-time",
    postedDate: "2024-01-19",
    description: "Join our engineering team to build scalable web applications. Experience with Node.js, React, and cloud technologies required.",
    skills: ["React", "Node.js", "AWS", "PostgreSQL", "TypeScript"],
    category: "target",
    aiScore: 72,
    aiAction: "Prepare examples of scalable applications you've built and your cloud deployment experience"
  },
  {
    id: "job-3",
    title: "Lead Software Engineer",
    company: "DataSoft",
    location: "New York",
    salary: "$140k - $180k",
    type: "full-time",
    postedDate: "2024-01-18",
    description: "Lead a team of developers building next-generation data analytics platform. Strong leadership and technical skills required.",
    skills: ["Leadership", "Python", "React", "Microservices", "Kubernetes"],
    category: "reach",
    aiScore: 58,
    aiAction: "Showcase your leadership experience and prepare for system design discussions"
  },
  {
    id: "job-4",
    title: "Principal Software Architect",
    company: "BigTech Solutions",
    location: "Seattle",
    salary: "$200k - $250k",
    type: "full-time",
    postedDate: "2024-01-17",
    description: "Define technical strategy and architecture for our platform serving millions of users. 10+ years experience required.",
    skills: ["System Design", "Architecture", "Leadership", "Microservices", "Cloud"],
    category: "dream",
    aiScore: 25,
    aiAction: "Build expertise in distributed systems and consider pursuing system design courses"
  },
  {
    id: "job-5",
    title: "React Developer",
    company: "StartupHub",
    location: "Austin",
    salary: "$80k - $110k",
    type: "full-time",
    postedDate: "2024-01-16",
    description: "Help us build our MVP using React and modern web technologies. Perfect for someone looking to grow in a startup environment.",
    skills: ["React", "JavaScript", "CSS", "Git"],
    category: "safety",
    aiScore: 88,
    aiAction: "Emphasize your ability to work in fast-paced environments and startup experience"
  },
  {
    id: "job-6",
    title: "DevOps Engineer",
    company: "CloudFirst",
    location: "Remote",
    salary: "$100k - $130k",
    type: "full-time",
    postedDate: "2024-01-15",
    description: "Manage cloud infrastructure and CI/CD pipelines. Experience with AWS, Docker, and Kubernetes preferred.",
    skills: ["AWS", "Docker", "Kubernetes", "CI/CD", "Terraform"],
    category: "reach",
    aiScore: 45,
    aiAction: "Gain hands-on experience with containerization and cloud deployment tools"
  },
  {
    id: "job-7",
    title: "Full Stack Developer",
    company: "GrowthTech",
    location: "San Francisco",
    salary: "$95k - $125k",
    type: "full-time",
    postedDate: "2024-01-14",
    description: "Work on both frontend and backend features for our SaaS platform. Experience with React and Python preferred.",
    skills: ["React", "Python", "Django", "PostgreSQL", "REST APIs"],
    category: "target",
    aiScore: 75,
    aiAction: "Demonstrate your full-stack capabilities with portfolio projects showing both frontend and backend work"
  },
  {
    id: "job-8",
    title: "Frontend Engineer - Contract",
    company: "DesignStudio",
    location: "Remote",
    salary: "$60/hour",
    type: "contract",
    postedDate: "2024-01-13",
    description: "3-month contract to help build responsive web applications. Strong CSS and React skills needed.",
    skills: ["React", "CSS", "Responsive Design", "SASS"],
    category: "safety",
    aiScore: 82,
    aiAction: "Showcase your responsive design portfolio and CSS animation skills"
  },
  {
    id: "job-9",
    title: "Staff Engineer",
    company: "TechGiant",
    location: "Seattle",
    salary: "$170k - $220k",
    type: "full-time",
    postedDate: "2024-01-12",
    description: "Drive technical excellence across multiple teams. Lead architecture decisions and mentor senior engineers.",
    skills: ["Leadership", "System Design", "Mentoring", "Architecture", "Microservices"],
    category: "dream",
    aiScore: 30,
    aiAction: "Focus on building mentorship experience and contributing to open source projects"
  },
  {
    id: "job-10",
    title: "Junior Frontend Developer",
    company: "LearningCorp",
    location: "Austin",
    salary: "$65k - $85k",
    type: "full-time",
    postedDate: "2024-01-11",
    description: "Entry-level position perfect for new graduates. We provide mentorship and growth opportunities.",
    skills: ["HTML", "CSS", "JavaScript", "React"],
    category: "safety",
    aiScore: 95,
    aiAction: "Highlight your learning ability and enthusiasm for frontend development"
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase() || '';
    const category = url.searchParams.get('category') || '';
    const location = url.searchParams.get('location') || '';
    const type = url.searchParams.get('type') || '';

    let filteredJobs = jobs;

    // Apply search filter
    if (search) {
      filteredJobs = filteredJobs.filter(job =>
        job.title.toLowerCase().includes(search) ||
        job.company.toLowerCase().includes(search) ||
        job.skills.some(skill => skill.toLowerCase().includes(search)) ||
        job.description.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (category && category !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.category === category);
    }

    // Apply location filter
    if (location && location !== 'all') {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply type filter
    if (type && type !== 'all') {
      filteredJobs = filteredJobs.filter(job => job.type === type);
    }

    // Sort by AI score (interview likelihood) in descending order
    filteredJobs.sort((a, b) => b.aiScore - a.aiScore);

    return NextResponse.json({
      jobs: filteredJobs,
      total: filteredJobs.length,
      totalAvailable: jobs.length
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}