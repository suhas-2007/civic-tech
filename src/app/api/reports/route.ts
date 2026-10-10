import { NextResponse } from 'next/server';
import { getCitizenReports, createCitizenReport, upvoteCitizenReport } from '@/lib/db';

export const dynamic = 'force-dynamic';

// get all citizen reports
export async function GET() {
  try {
    const data = await getCitizenReports();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Failed to get reports:', err);
    return NextResponse.json(
      { error: 'Failed to retrieve reports', details: err.message },
      { status: 500 }
    );
  }
}

// create report or upvote an existing report
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // upvote report
    if (body.action === 'upvote' && body.id) {
      const newUpvotes = await upvoteCitizenReport(body.id);
      return NextResponse.json({
        success: true,
        upvotes: newUpvotes,
      });
    }

    // new report submission
    if (!body.title || !body.addressText) {
      return NextResponse.json(
        { error: 'Report title and address are required' },
        { status: 400 }
      );
    }

    const result = await createCitizenReport(body);
    return NextResponse.json({
      success: true,
      report: result.report,
    });
  } catch (err: any) {
    console.error('Failed to submit report:', err);
    return NextResponse.json(
      { error: 'Failed to submit report', details: err.message },
      { status: 500 }
    );
  }
}
