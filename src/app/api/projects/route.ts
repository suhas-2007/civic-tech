import { NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';

// get all projects
export async function GET(_req: Request) {
  try {
    const { isSupabaseConfigured } = await import('@/lib/supabase');
    const data = await getProjects();
    const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL);
    return NextResponse.json({ ...data, hasEnv, isConfigured: isSupabaseConfigured });
  } catch (err: any) {
    console.error('Failed to get projects:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve projects', details: err.message },
      { status: 500 }
    );
  }
}

// create a new project
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.title || !body.addressText) {
      return NextResponse.json(
        { error: 'Project title and address are required' },
        { status: 400 }
      );
    }

    const result = await createProject(body);
    return NextResponse.json({
      success: true,
      project: result.project,
    });
  } catch (err: any) {
    console.error('Failed to create project:', err);
    return NextResponse.json(
      { error: 'Failed to create project', details: err.message },
      { status: 500 }
    );
  }
}
