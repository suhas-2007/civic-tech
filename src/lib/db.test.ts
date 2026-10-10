// unit tests for database and report functions
import { describe, it, expect } from 'vitest';
import { getProjects, createProject, getCitizenReports, createCitizenReport, upvoteCitizenReport } from './db';

describe('Database & Fallback Store Operations', () => {
  it('loads projects with valid count and format', async () => {
    const { projects, source } = await getProjects();
    expect(projects.length).toBeGreaterThan(0);
    expect(['supabase', 'fallback']).toContain(source);
    expect(projects[0]).toHaveProperty('title');
    expect(projects[0]).toHaveProperty('workType');
  });

  it('creates a new project and retrieves it', async () => {
    const testTitle = 'Hackathon Test Roadway Dig';
    const result = await createProject({
      title: testTitle,
      description: 'Test digging operation for unit test',
      workType: 'road',
      department: 'Dept of Testing',
      addressText: '404 Unit Test Way',
      latitude: 40.7128,
      longitude: -74.0060,
    });

    expect(result.success).toBe(true);
    expect(result.project.title).toBe(testTitle);

    const { projects } = await getProjects();
    expect(projects.some(p => p.title === testTitle)).toBe(true);
  });

  it('retrieves citizen reports and allows submitting a new report', async () => {
    const { reports } = await getCitizenReports();
    expect(reports.length).toBeGreaterThan(0);

    const newReport = await createCitizenReport({
      title: 'Water pipe leaking on sidewalk',
      description: 'Fresh water gushing near fire hydrant after road crew left.',
      category: 'water_leak',
      addressText: '5th Ave & Pine',
      latitude: 40.7135,
      longitude: -74.0070,
    });

    expect(newReport.success).toBe(true);
    expect(newReport.report.category).toBe('water_leak');

    const prevUpvotes = newReport.report.upvotes;
    const updatedUpvotes = await upvoteCitizenReport(newReport.report.id);
    expect(updatedUpvotes).toBe(prevUpvotes + 1);
  });
});
