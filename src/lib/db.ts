import { supabase, isSupabaseConfigured } from './supabase';
import { Project, CitizenReport, Status } from './types';
import { mockProjects, mockCitizenReports } from './data';

// in-memory fallback state for offline / demo mode
let localProjectsState: Project[] = [...mockProjects];
let localReportsState: CitizenReport[] = [...mockCitizenReports];

// map database row to project object
function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    workType: row.work_type,
    department: row.department,
    contractor: row.contractor,
    status: row.status,
    plannedStartDate: row.planned_start_date,
    plannedEndDate: row.planned_end_date,
    actualStartDate: row.actual_start_date,
    actualEndDate: row.actual_end_date,
    updatedAt: row.updated_at || new Date().toISOString(),
    addressText: row.address_text,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    budget: row.budget ? Number(row.budget) : undefined,
    sourceIds: row.source_ids || [],
    dataOrigin: row.data_origin || 'official',
  };
}

// map project object to database row
function mapProjectToRow(proj: Partial<Project>): any {
  return {
    id: proj.id,
    title: proj.title,
    description: proj.description,
    work_type: proj.workType,
    department: proj.department || null,
    contractor: proj.contractor || null,
    status: proj.status || 'planned',
    planned_start_date: proj.plannedStartDate || null,
    planned_end_date: proj.plannedEndDate || null,
    actual_start_date: proj.actualStartDate || null,
    actual_end_date: proj.actualEndDate || null,
    address_text: proj.addressText,
    latitude: proj.latitude || null,
    longitude: proj.longitude || null,
    budget: proj.budget || 0,
    source_ids: proj.sourceIds || [],
    data_origin: proj.dataOrigin || 'manual',
  };
}

// map database row to report object
function mapRowToReport(row: any): CitizenReport {
  return {
    id: row.id,
    projectId: row.project_id || null,
    category: row.category,
    title: row.title,
    description: row.description,
    addressText: row.address_text,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    status: row.status || 'pending_review',
    upvotes: row.upvotes || 1,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// fetch all projects
export async function getProjects(): Promise<{ projects: Project[]; source: 'supabase' | 'fallback' }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase query failed, using local cache:', error.message);
        return { projects: localProjectsState, source: 'fallback' };
      }

      if (data && data.length > 0) {
        return {
          projects: data.map(mapRowToProject),
          source: 'supabase',
        };
      }
    } catch (err: any) {
      console.warn('Supabase connection error:', err.message);
    }
  }

  return { projects: localProjectsState, source: 'fallback' };
}

// create a new project
export async function createProject(newProj: Partial<Project>): Promise<{ project: Project; success: boolean }> {
  const generatedId = newProj.id || `proj-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const formattedProject: Project = {
    id: generatedId,
    title: newProj.title || 'Untitled Project',
    description: newProj.description || '',
    workType: newProj.workType || 'road',
    department: newProj.department || 'Civic Infrastructure',
    contractor: newProj.contractor || 'City Works',
    status: newProj.status || 'planned',
    plannedStartDate: newProj.plannedStartDate || null,
    plannedEndDate: newProj.plannedEndDate || null,
    actualStartDate: newProj.actualStartDate || null,
    actualEndDate: null,
    updatedAt: now,
    addressText: newProj.addressText || 'Downtown Area',
    latitude: newProj.latitude ?? 40.7128,
    longitude: newProj.longitude ?? -74.0060,
    budget: newProj.budget || 0,
    sourceIds: newProj.sourceIds || [],
    dataOrigin: isSupabaseConfigured ? 'official' : 'manual',
  };

  if (isSupabaseConfigured) {
    try {
      const row = mapProjectToRow(formattedProject);
      const { data, error } = await supabase
        .from('projects')
        .insert([row])
        .select();

      if (error) {
        console.error('Supabase insert project error:', error);
      } else if (data && data[0]) {
        return { project: mapRowToProject(data[0]), success: true };
      }
    } catch (err) {
      console.error('Failed inserting to Supabase:', err);
    }
  }

  // update local state
  localProjectsState = [formattedProject, ...localProjectsState];
  return { project: formattedProject, success: true };
}

// update status of project
export async function updateProjectStatus(id: string, status: Status): Promise<boolean> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (!error) return true;
    } catch (err) {
      console.warn('Failed to update status in Supabase', err);
    }
  }

  localProjectsState = localProjectsState.map(p => (p.id === id ? { ...p, status } : p));
  return true;
}

// fetch citizen reports
export async function getCitizenReports(): Promise<{ reports: CitizenReport[]; source: 'supabase' | 'fallback' }> {
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('citizen_reports')
        .select('*')
        .order('upvotes', { ascending: false });

      if (error) {
        console.warn('Supabase reports query failed:', error.message);
        return { reports: localReportsState, source: 'fallback' };
      }

      if (data) {
        return {
          reports: data.map(mapRowToReport),
          source: 'supabase',
        };
      }
    } catch (err: any) {
      console.warn('Supabase reports error:', err.message);
    }
  }

  return { reports: localReportsState, source: 'fallback' };
}

// create citizen report
export async function createCitizenReport(newRep: Partial<CitizenReport>): Promise<{ report: CitizenReport; success: boolean }> {
  const generatedId = newRep.id || `rep-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const formattedReport: CitizenReport = {
    id: generatedId,
    projectId: newRep.projectId || null,
    category: newRep.category || 'uncoordinated_digging',
    title: newRep.title || 'Community Observation',
    description: newRep.description || '',
    addressText: newRep.addressText || 'Local Street',
    latitude: newRep.latitude ?? 40.7128,
    longitude: newRep.longitude ?? -74.0060,
    status: 'pending_review',
    upvotes: 1,
    createdAt: now,
  };

  if (isSupabaseConfigured) {
    try {
      const row = {
        id: formattedReport.id,
        project_id: formattedReport.projectId,
        category: formattedReport.category,
        title: formattedReport.title,
        description: formattedReport.description,
        address_text: formattedReport.addressText,
        latitude: formattedReport.latitude,
        longitude: formattedReport.longitude,
        status: formattedReport.status,
        upvotes: formattedReport.upvotes,
      };

      const { data, error } = await supabase
        .from('citizen_reports')
        .insert([row])
        .select();

      if (!error && data && data[0]) {
        return { report: mapRowToReport(data[0]), success: true };
      }
    } catch (err) {
      console.error('Failed inserting citizen report:', err);
    }
  }

  localReportsState = [formattedReport, ...localReportsState];
  return { report: formattedReport, success: true };
}

// increment upvote count
export async function upvoteCitizenReport(id: string): Promise<number> {
  const rep = localReportsState.find(r => r.id === id);
  const nextUpvotes = (rep?.upvotes || 1) + 1;

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('citizen_reports')
        .update({ upvotes: nextUpvotes })
        .eq('id', id);
    } catch (err) {
      console.warn('Failed upvoting in Supabase', err);
    }
  }

  localReportsState = localReportsState.map(r => (r.id === id ? { ...r, upvotes: nextUpvotes } : r));
  return nextUpvotes;
}
