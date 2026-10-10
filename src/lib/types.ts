import { z } from 'zod';

export const WorkTypeSchema = z.enum([
  'road',
  'drainage',
  'water',
  'sewer',
  'electrical',
  'public_facility',
  'other',
]);

export const StatusSchema = z.enum([
  'planned',
  'ongoing',
  'delayed',
  'completed',
  'paused',
  'unknown',
]);

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  workType: WorkTypeSchema,
  department: z.string().nullable(),
  contractor: z.string().nullable(),
  status: StatusSchema,
  plannedStartDate: z.string().nullable(), // ISO date string YYYY-MM-DD
  plannedEndDate: z.string().nullable(),
  actualStartDate: z.string().nullable(),
  actualEndDate: z.string().nullable(),
  updatedAt: z.string(),
  addressText: z.string(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  budget: z.number().nullable().optional(),
  sourceIds: z.array(z.string()),
  dataOrigin: z.enum(['official', 'public', 'manual', 'demo']),
});

export type Project = z.infer<typeof ProjectSchema>;
export type WorkType = z.infer<typeof WorkTypeSchema>;
export type Status = z.infer<typeof StatusSchema>;

// Evidence format for conflicts
export const ConflictFindingSchema = z.object({
  id: z.string(),
  projectIds: z.array(z.string()),
  type: z.enum(['schedule_overlap', 'repeated_excavation', 'spatial_proximity', 'dependency']),
  temporalBasis: z.string().nullable(), // explanation of dates
  spatialBasis: z.string().nullable(), // explanation of space
  reason: z.string(),
  severity: z.enum(['low', 'medium', 'high', 'candidate']),
  evidence: z.array(z.string()), // URLs or source IDs
});

export type ConflictFinding = z.infer<typeof ConflictFindingSchema>;

// citizen report schema
export const CitizenReportCategorySchema = z.enum([
  'pothole',
  'uncoordinated_digging',
  'delayed_work',
  'water_leak',
  'noise_safety',
  'other',
]);

export const CitizenReportSchema = z.object({
  id: z.string(),
  projectId: z.string().nullable().optional(),
  category: CitizenReportCategorySchema,
  title: z.string(),
  description: z.string(),
  addressText: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  status: z.enum(['pending_review', 'verified', 'resolved']).default('pending_review'),
  upvotes: z.number().default(1),
  createdAt: z.string().optional(),
});

export type CitizenReport = z.infer<typeof CitizenReportSchema>;
export type CitizenReportCategory = z.infer<typeof CitizenReportCategorySchema>;
