import { z } from 'zod';
import { getProjects } from './db';
import { detectConflicts } from './conflicts';
import { analyzeDelay } from './timeline';
import { getDistance } from './neighborhood';

// tools for bounded coordination agent
export const agentTools = {
  // filter projects by status, work type or department
  searchProjects: {
    description: 'Search for projects by text query (title/street/contractor), status, work type, or department.',
    parameters: z.object({
      query: z.string().optional(),
      status: z.string().optional(),
      workType: z.string().optional(),
      department: z.string().optional(),
    }),
    execute: async ({ query, status, workType, department }: { query?: string, status?: string, workType?: string, department?: string }) => {
      const { projects } = await getProjects();
      let results = projects;
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.addressText.toLowerCase().includes(q) ||
          p.contractor?.toLowerCase().includes(q)
        );
      }
      if (status) results = results.filter(p => p.status.toLowerCase() === status.toLowerCase());
      if (workType) results = results.filter(p => p.workType.toLowerCase() === workType.toLowerCase());
      if (department) results = results.filter(p => p.department?.toLowerCase() === department.toLowerCase());
      return results.slice(0, 10).map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        department: p.department,
        contractor: p.contractor,
        address: p.addressText,
        plannedSchedule: `${p.plannedStartDate || 'TBD'} to ${p.plannedEndDate || 'TBD'}`,
        actualStartDate: p.actualStartDate || null,
        actualEndDate: p.actualEndDate || null
      }));
    },
  },

  // fetch project details by id
  getProjectDetails: {
    description: 'Get full details of a specific project by ID.',
    parameters: z.object({ projectId: z.string() }),
    execute: async ({ projectId }: { projectId: string }) => {
      const { projects } = await getProjects();
      const project = projects.find(p => p.id === projectId);
      if (!project) return { error: `Project ${projectId} not found in database.` };
      return project;
    },
  },

  // calculate delay analysis
  getProjectTimeline: {
    description: 'Analyze delay and timeline for a specific project.',
    parameters: z.object({ projectId: z.string() }),
    execute: async ({ projectId }: { projectId: string }) => {
      const { projects } = await getProjects();
      const project = projects.find(p => p.id === projectId);
      if (!project) return { error: `Project ${projectId} not found.` };
      const analysis = analyzeDelay(project);
      if (!analysis) return { message: 'Project is on schedule or lacks planned dates.' };
      return analysis;
    },
  },

  // spatial lookup for projects within radius
  getNeighborhoodWorks: {
    description: 'Find projects near a specific coordinate within a date window.',
    parameters: z.object({
      latitude: z.number(),
      longitude: z.number(),
      radiusMeters: z.number().max(5000).default(500),
    }),
    execute: async ({ latitude, longitude, radiusMeters }: { latitude: number, longitude: number, radiusMeters: number }) => {
      const { projects } = await getProjects();
      const results = projects.filter(p => {
        if (!p.latitude || !p.longitude) return false;
        const dist = getDistance(latitude, longitude, p.latitude, p.longitude);
        return dist <= radiusMeters;
      });
      return results.map(p => ({
        id: p.id,
        title: p.title,
        distance: Math.round(getDistance(latitude, longitude, p.latitude!, p.longitude!))
      }));
    },
  },

  // find deterministic conflicts for project
  findConflicts: {
    description: 'Check deterministic conflicts involving a specific project.',
    parameters: z.object({ projectId: z.string() }),
    execute: async ({ projectId }: { projectId: string }) => {
      const { projects } = await getProjects();
      const allConflicts = detectConflicts(projects);
      const projectConflicts = allConflicts.filter(c => c.projectIds.includes(projectId));
      return projectConflicts;
    }
  }
};
