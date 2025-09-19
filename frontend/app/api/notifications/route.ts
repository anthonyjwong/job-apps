import { NextRequest, NextResponse } from 'next/server';

// Dummy notifications data
const notifications = [
  {
    id: "notif-1",
    type: "interview_scheduled",
    title: "Interview Scheduled",
    message: "Technical interview with TechCorp scheduled for Jan 25, 2:00 PM",
    timestamp: "2024-01-23T10:30:00Z",
    isRead: false,
    priority: "high",
    actionUrl: "/interviews",
    metadata: {
      company: "TechCorp",
      position: "Senior Frontend Developer",
      interviewId: "interview-1"
    }
  },
  {
    id: "notif-2",
    type: "application_status",
    title: "Application Update",
    message: "Your application to InnovateLabs has been moved to final interview stage",
    timestamp: "2024-01-22T15:45:00Z",
    isRead: false,
    priority: "high",
    actionUrl: "/applications",
    metadata: {
      company: "InnovateLabs",
      position: "Lead Product Engineer",
      applicationId: 3,
      newStatus: "final_interview"
    }
  },
  {
    id: "notif-3",
    type: "assessment_reminder",
    title: "Assessment Due Soon",
    message: "React Dashboard Component assessment for TechCorp is due in 2 days",
    timestamp: "2024-01-22T09:00:00Z",
    isRead: true,
    priority: "medium",
    actionUrl: "/assessments",
    metadata: {
      company: "TechCorp",
      assessmentId: "assessment-1",
      dueDate: "2024-01-28"
    }
  },
  {
    id: "notif-4",
    type: "job_recommendation",
    title: "New Job Match",
    message: "5 new safety category jobs match your profile - 85%+ interview likelihood",
    timestamp: "2024-01-21T08:00:00Z",
    isRead: true,
    priority: "medium",
    actionUrl: "/jobs?category=safety",
    metadata: {
      jobCount: 5,
      category: "safety",
      avgScore: 87
    }
  },
  {
    id: "notif-5",
    type: "follow_up_reminder",
    title: "Follow-up Reminder",
    message: "Consider following up on your application to BigTech Inc (submitted 15 days ago)",
    timestamp: "2024-01-20T12:00:00Z",
    isRead: true,
    priority: "low",
    actionUrl: "/applications",
    metadata: {
      company: "BigTech Inc",
      applicationId: 4,
      daysSinceApplication: 15
    }
  },
  {
    id: "notif-6",
    type: "skill_insight",
    title: "Skill Trend Alert",
    message: "AWS skills are trending +40% in your target job category",
    timestamp: "2024-01-19T14:30:00Z",
    isRead: true,
    priority: "low",
    actionUrl: "/analytics",
    metadata: {
      skill: "AWS",
      trendPercentage: 40,
      category: "target"
    }
  },
  {
    id: "notif-7",
    type: "offer_received",
    title: "Job Offer Received! 🎉",
    message: "Congratulations! You received an offer from InnovateLabs for Lead Product Engineer",
    timestamp: "2024-01-18T16:20:00Z",
    isRead: false,
    priority: "high",
    actionUrl: "/applications",
    metadata: {
      company: "InnovateLabs",
      position: "Lead Product Engineer",
      applicationId: 3,
      salary: "$140k - $170k"
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';
    
    let filteredNotifications = notifications;
    
    if (unreadOnly) {
      filteredNotifications = notifications.filter(notif => !notif.isRead);
    }
    
    // Sort by timestamp (most recent first)
    const sortedNotifications = [...filteredNotifications].sort((a, b) => {
      const dateA = new Date(a.timestamp);
      const dateB = new Date(b.timestamp);
      return dateB.getTime() - dateA.getTime();
    });

    return NextResponse.json({
      notifications: sortedNotifications,
      total: sortedNotifications.length,
      unreadCount: notifications.filter(n => !n.isRead).length
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newNotification = {
      id: `notif-${Date.now()}`,
      type: body.type || "general",
      title: body.title,
      message: body.message,
      timestamp: new Date().toISOString(),
      isRead: false,
      priority: body.priority || "medium",
      actionUrl: body.actionUrl || "",
      metadata: body.metadata || {}
    };
    
    notifications.unshift(newNotification);
    
    return NextResponse.json({
      notification: newNotification,
      message: "Notification created successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    
    if (id === 'all') {
      // Mark all notifications as read
      notifications.forEach(notif => {
        notif.isRead = true;
      });
      
      return NextResponse.json({
        message: "All notifications marked as read"
      });
    }
    
    const notificationIndex = notifications.findIndex(notif => notif.id === id);
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      ...updates
    };
    
    return NextResponse.json({
      notification: notifications[notificationIndex],
      message: "Notification updated successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    const notificationIndex = notifications.findIndex(notif => notif.id === id);
    if (notificationIndex === -1) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }
    
    notifications.splice(notificationIndex, 1);
    
    return NextResponse.json({
      message: "Notification deleted successfully"
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete notification" },
      { status: 500 }
    );
  }
}