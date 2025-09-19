import type { UserSettings } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

// In-memory demo store; replace with DB later
let userSettings: UserSettings = {
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    title: 'Senior Software Engineer',
    experience: '5-7 years',
    salaryMin: '120000',
    salaryMax: '180000',
    bio: 'Experienced full-stack developer with expertise in React, Node.js, and cloud technologies. Passionate about building scalable applications and leading technical teams.'
  },
  notifications: {
    emailDigest: true,
    applicationUpdates: true,
    interviewReminders: true,
    newJobMatches: false,
    weeklyReport: true,
    pushNotifications: true,
    smsReminders: false
  },
  preferences: {
    autoApplyEnabled: false,
    defaultApplicationStatus: 'applied',
    reminderDays: '3',
    dataRetention: '12',
    exportFormat: 'json',
    timezone: 'America/Los_Angeles'
  },
  privacy: {
    profileVisible: true,
    analyticsEnabled: true,
    dataSharing: false,
    marketingEmails: false
  }
};

export async function GET() {
  return NextResponse.json(userSettings);
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    userSettings = { ...userSettings, ...body };
    return NextResponse.json({ success: true, settings: userSettings });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    userSettings = body as UserSettings;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  }
}
