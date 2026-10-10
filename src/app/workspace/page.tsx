"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Project, CitizenReport, ConflictFinding } from "@/lib/types";
import { detectConflicts } from "@/lib/conflicts";
import { analyzeDelay } from "@/lib/timeline";
import {
  AlertTriangle,
  Clock,
  MapPin,
  Building,
  Calendar,
  FileText,
  ArrowLeft,
  PlusCircle,
  Megaphone,
  Download,
  Database,
  ThumbsUp,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  X,
  Users,
  DollarSign
} from "lucide-react";

// dynamic map import for client side rendering
const CivicMap = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Workspace() {
  // projects and citizen reports state
  const [projects, setProjects] = useState<Project[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [dataSource, setDataSource] = useState<'supabase' | 'fallback'>('fallback');
  const [isLoading, setIsLoading] = useState(true);

  // filter and navigation state
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterWorkType, setFilterWorkType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<'directory' | 'conflicts' | 'reports' | 'agent' | 'ingest'>('directory');

  // modal visibility state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDbInfoModal, setShowDbInfoModal] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState<[number, number] | null>(null);

  // form inputs state
  const [newProjectForm, setNewProjectForm] = useState({
    title: "",
    description: "",
    workType: "road",
    department: "",
    contractor: "",
    status: "planned",
    plannedStartDate: "",
    plannedEndDate: "",
    addressText: "",
    latitude: 40.7128,
    longitude: -74.0060,
    budget: 250000,
  });

  const [newReportForm, setNewReportForm] = useState({
    title: "",
    description: "",
    category: "uncoordinated_digging",
    addressText: "",
    latitude: 40.7128,
    longitude: -74.0060,
  });

  // agent chat state
  const [agentInput, setAgentInput] = useState("");
  const [agentMessages, setAgentMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "agent",
      content: "Hello! I can help investigate roadwork timelines, detect conflicting department projects, or find works near specific coordinates. Try asking: 'Which projects conflict on Main St?' or 'What projects are delayed?'"
    }
  ]);
  const [isAgentTyping, setIsAgentTyping] = useState(false);

  // pdf notice ingestion state
  const [isIngestingPdf, setIsIngestingPdf] = useState(false);
  const [ingestSuccess, setIngestSuccess] = useState<string | null>(null);

  // fetch data from api
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [projRes, repRes] = await Promise.all([
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/reports').then(r => r.json())
      ]);

      if (projRes.projects) {
        setProjects(projRes.projects);
        setDataSource(projRes.source);
      }
      if (repRes.reports) {
        setCitizenReports(repRes.reports);
      }
    } catch (err) {
      console.error('Failed loading data from API, using defaults:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // calculate conflicts
  const conflicts = useMemo(() => detectConflicts(projects), [projects]);

  // filter projects list
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (filterWorkType !== "all" && p.workType !== filterWorkType) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesAddress = p.addressText.toLowerCase().includes(query);
        const matchesDept = p.department?.toLowerCase().includes(query);
        const matchesContractor = p.contractor?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesAddress && !matchesDept && !matchesContractor) return false;
      }
      return true;
    });
  }, [projects, filterStatus, filterWorkType, searchQuery]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) || null;
  const projectConflicts = selectedProject
    ? conflicts.filter(c => c.projectIds.includes(selectedProject.id))
    : [];
  const delayFinding = selectedProject ? analyzeDelay(selectedProject) : null;

  // submit new project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectForm.title || !newProjectForm.addressText) {
      alert("Please enter a title and address!");
      return;
    }

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjectForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Project successfully registered");
        setShowAddProjectModal(false);
        loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  // submit citizen report
  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReportForm.title || !newReportForm.addressText) {
      alert("Please provide a title and location!");
      return;
    }

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReportForm)
      });
      const data = await res.json();
      if (res.ok) {
        alert("Report submitted");
        setShowReportModal(false);
        loadData();
      } else {
        alert("Error: " + data.error);
      }
    } catch (err: any) {
      alert("Network error: " + err.message);
    }
  };

  // upvote citizen report
  const handleUpvoteReport = async (reportId: string) => {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upvote', id: reportId })
      });
      if (res.ok) {
        setCitizenReports(prev =>
          prev.map(r => r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r)
        );
      }
    } catch (err) {
      console.warn("Could not submit upvote", err);
    }
  };

  // handle map click coordinates
  const handleMapClick = (coords: [number, number]) => {
    setPinnedCoords(coords);
    setNewReportForm(prev => ({ ...prev, latitude: coords[0], longitude: coords[1] }));
    setNewProjectForm(prev => ({ ...prev, latitude: coords[0], longitude: coords[1] }));
  };

  // send question to agent
  const handleAgentSubmit = async (customPrompt?: string) => {
    const promptToSend = customPrompt || agentInput;
    if (!promptToSend.trim()) return;

    setAgentInput("");
    setAgentMessages(prev => [...prev, { role: 'user', content: promptToSend }]);
    setIsAgentTyping(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend })
      });
      const data = await res.json();
      if (res.ok) {
        setAgentMessages(prev => [...prev, { role: 'agent', content: data.text }]);
      } else {
        setAgentMessages(prev => [...prev, { role: 'agent', content: `Note: ${data.error || 'AI Agent is operating with local deterministic tools.'}` }]);
      }
    } catch (e: any) {
      setAgentMessages(prev => [...prev, { role: 'agent', content: `Network Error: ${e.message}` }]);
    } finally {
      setIsAgentTyping(false);
    }
  };

  // upload and parse notice pdf
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsIngestingPdf(true);
    setIngestSuccess(null);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('saveToDb', 'true');

    try {
      const res = await fetch('/api/ingest', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setIngestSuccess(`Extracted & Saved: "${data.data.title}" at ${data.data.addressText}`);
        loadData();
      } else {
        alert(`Ingestion notice: ${data.error}`);
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setIsIngestingPdf(false);
    }
  };

  // export audit report as json
  const handleExportData = () => {
    const exportPayload = {
      platform: "CivicTech",
      exportedAt: new Date().toISOString(),
      dataSource: dataSource,
      statistics: {
        totalProjects: projects.length,
        totalConflictsDetected: conflicts.length,
        totalCitizenReports: citizenReports.length,
      },
      conflicts: conflicts,
      projects: projects,
      citizenReports: citizenReports,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `civictech-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const delayedCount = projects.filter(p => p.status === 'delayed').length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <main className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      
      {/* top navbar */}
      <header className="flex-none bg-white border-b border-slate-200 px-4 py-2.5 z-20 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          
          {/* Left: Branding & Back Button */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-900 transition"
              title="Return to Landing Page"
            >
              <ArrowLeft size={14} /> Home
            </Link>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
                <Building className="text-blue-600" size={20} /> CivicTech
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Bits & Bytes &apos;26
              </span>
            </div>
          </div>

          {/* Center: Live Supabase Status Badge */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setShowDbInfoModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-100 transition cursor-pointer"
            >
              <Database size={13} className={dataSource === 'supabase' ? 'text-emerald-600' : 'text-amber-500'} />
              <span>
                Backend: <strong className={dataSource === 'supabase' ? 'text-emerald-700' : 'text-amber-600'}>
                  {dataSource === 'supabase' ? 'Supabase Live' : 'Demo DB Mode'}
                </strong>
              </span>
              <span className="text-[10px] text-slate-400">ℹ️</span>
            </button>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="flex items-center gap-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md shadow-xs transition"
            >
              <PlusCircle size={14} />
              <span className="hidden sm:inline">Add Project</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="flex items-center gap-1 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md shadow-xs transition"
            >
              <Megaphone size={14} />
              <span className="hidden sm:inline">Report Issue</span>
            </button>

            <button
              onClick={handleExportData}
              title="Download Hackathon Audit JSON"
              className="flex items-center gap-1 text-xs font-medium border border-slate-300 hover:bg-slate-100 px-2.5 py-1.5 rounded-md text-slate-700 transition"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export</span>
            </button>

            <button
              onClick={() => setShowTeamModal(true)}
              title="About Student Team"
              className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 transition"
            >
              <Users size={16} />
            </button>
          </div>
        </div>

        {/* Quick Statistics Banner */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-xs text-slate-600 overflow-x-auto">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1">
              <strong className="text-slate-900">{projects.length}</strong> Projects
            </span>
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <AlertTriangle size={13} />
              <strong>{conflicts.length}</strong> Clashes Detected
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <Clock size={13} />
              <strong>{delayedCount}</strong> Delayed
            </span>
            <span className="flex items-center gap-1 text-purple-700">
              <Megaphone size={13} />
              <strong>{citizenReports.length}</strong> Citizen Reports
            </span>
            <span className="hidden lg:flex items-center gap-1 text-slate-500">
              <DollarSign size={13} />
              ${(totalBudget / 1000).toFixed(0)}k Tracked Budget
            </span>
          </div>
          {pinnedCoords && (
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">
              📍 Pinned: {pinnedCoords[0]}, {pinnedCoords[1]}
            </span>
          )}
        </div>
      </header>

      {/* ── 2. MAIN WORKSPACE LAYOUT ── */}
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row relative">

        {/* ── LEFT PANEL: SIDEBAR TABS ── */}
        <aside className="w-full md:w-[420px] flex-none bg-white border-r border-slate-200 flex flex-col overflow-hidden z-10 shadow-xs">
          
          {/* Tab Bar */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 py-2.5 text-center transition border-b-2 ${
                activeTab === 'directory' ? 'border-blue-600 text-blue-600 bg-white font-bold' : 'border-transparent hover:bg-slate-100'
              }`}
            >
              📋 Directory
            </button>
            <button
              onClick={() => setActiveTab('conflicts')}
              className={`flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1 ${
                activeTab === 'conflicts' ? 'border-red-600 text-red-600 bg-white font-bold' : 'border-transparent hover:bg-slate-100'
              }`}
            >
              ⚠️ Clashes ({conflicts.length})
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 py-2.5 text-center transition border-b-2 ${
                activeTab === 'reports' ? 'border-purple-600 text-purple-600 bg-white font-bold' : 'border-transparent hover:bg-slate-100'
              }`}
            >
              📢 Voice ({citizenReports.length})
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`flex-1 py-2.5 text-center transition border-b-2 flex items-center justify-center gap-1 ${
                activeTab === 'agent' ? 'border-blue-600 text-blue-600 bg-white font-bold' : 'border-transparent hover:bg-slate-100'
              }`}
            >
              <Sparkles size={12} /> AI Agent
            </button>
            <button
              onClick={() => setActiveTab('ingest')}
              className={`flex-1 py-2.5 text-center transition border-b-2 ${
                activeTab === 'ingest' ? 'border-emerald-600 text-emerald-600 bg-white font-bold' : 'border-transparent hover:bg-slate-100'
              }`}
            >
              📄 Scanner
            </button>
          </div>

          {/* TAB 1: PROJECTS DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search & Filter Header */}
              <div className="p-3 border-b border-slate-200 bg-slate-50/50 space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search project title, department, street..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs">
                      ×
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded text-xs px-2 py-1 text-slate-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="delayed">Delayed</option>
                    <option value="planned">Planned</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={filterWorkType}
                    onChange={e => setFilterWorkType(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded text-xs px-2 py-1 text-slate-700"
                  >
                    <option value="all">All Types</option>
                    <option value="road">Road</option>
                    <option value="water">Water</option>
                    <option value="electrical">Electrical</option>
                    <option value="drainage">Drainage</option>
                    <option value="public_facility">Public Facility</option>
                  </select>
                </div>
              </div>

              {/* Projects List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs">Loading civic projects...</div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No projects found matching the filter criteria.
                  </div>
                ) : (
                  filteredProjects.map(proj => {
                    const isSelected = selectedProjectId === proj.id;
                    const hasClash = conflicts.some(c => c.projectIds.includes(proj.id));

                    return (
                      <button
                        key={proj.id}
                        onClick={() => setSelectedProjectId(proj.id)}
                        className={`w-full text-left p-3.5 transition flex flex-col gap-1 hover:bg-slate-50 ${
                          isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              proj.status === 'delayed'
                                ? 'bg-red-100 text-red-700'
                                : proj.status === 'ongoing'
                                ? 'bg-blue-100 text-blue-700'
                                : proj.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {proj.status}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium capitalize">
                            {proj.workType}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {proj.title}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-1">
                          {proj.description}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 mt-0.5 border-t border-slate-100">
                          <span className="truncate max-w-[200px]">🏢 {proj.department || 'City Dept'}</span>
                          <span>📅 {proj.plannedStartDate || 'TBD'}</span>
                        </div>

                        {hasClash && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                            <AlertTriangle size={12} /> Conflict Alert with another department!
                          </div>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: CONFLICT DETECTION ENGINE */}
          {activeTab === 'conflicts' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                <strong>⚡ Coordination Engine:</strong> Detected cross-department schedule & spatial clashes. These cause repeated road tearing and traffic blockades!
              </div>

              {conflicts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  ✅ No department coordination conflicts currently detected!
                </div>
              ) : (
                conflicts.map((conflict, idx) => {
                  const involvedProjects = projects.filter(p => conflict.projectIds.includes(p.id));

                  return (
                    <div
                      key={conflict.id || idx}
                      className="border border-red-200 bg-white rounded-lg p-3.5 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                          <AlertTriangle size={11} /> {conflict.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-semibold text-red-600 uppercase">
                          {conflict.severity} severity
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900">
                        {conflict.reason}
                      </p>

                      <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                        {conflict.temporalBasis && <div>⏳ <strong>Timeline:</strong> {conflict.temporalBasis}</div>}
                        {conflict.spatialBasis && <div>📍 <strong>Location:</strong> {conflict.spatialBasis}</div>}
                      </div>

                      <div className="text-xs pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                          Involved Projects:
                        </span>
                        <div className="space-y-1">
                          {involvedProjects.map(p => (
                            <button
                              key={p.id}
                              onClick={() => setSelectedProjectId(p.id)}
                              className="text-left w-full text-xs text-blue-600 hover:underline truncate block"
                            >
                              • {p.title} ({p.department})
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: CITIZEN VOICE / CROWDSOURCED REPORTS */}
          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b border-slate-200 bg-purple-50/50 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-purple-900">Neighborhood Reports</h3>
                  <p className="text-[11px] text-purple-700">Potholes, uncoordinated digs & delays</p>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-xs bg-purple-600 hover:bg-purple-700 text-white font-semibold px-2.5 py-1 rounded shadow-xs"
                >
                  + New Report
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {citizenReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No community reports yet. Be the first to pin an observation!
                  </div>
                ) : (
                  citizenReports.map(rep => (
                    <div key={rep.id} className="p-3.5 space-y-1.5 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                          {rep.category.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          {rep.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-bold text-xs text-slate-900 leading-snug">
                        {rep.title}
                      </h4>

                      <p className="text-xs text-slate-600">
                        {rep.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                        <span className="truncate max-w-[240px]">📍 {rep.addressText}</span>
                        <button
                          onClick={() => handleUpvoteReport(rep.id)}
                          className="flex items-center gap-1 text-xs text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-2 py-0.5 rounded font-bold transition"
                        >
                          <ThumbsUp size={11} /> {rep.upvotes}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AI COORDINATION AGENT */}
          {activeTab === 'agent' && (
            <div className="flex-1 flex flex-col p-3 font-sans text-xs h-full">
              {/* Quick suggestions */}
              <div className="flex gap-1.5 flex-wrap mb-2 pb-2 border-b border-slate-200">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Try:</span>
                <button
                  onClick={() => handleAgentSubmit("Which projects on Main St have conflicts?")}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full"
                >
                  Main St Conflicts?
                </button>
                <button
                  onClick={() => handleAgentSubmit("What projects are currently delayed?")}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full"
                >
                  Delayed Works?
                </button>
                <button
                  onClick={() => handleAgentSubmit("Find projects within 500m of Main St water works")}
                  className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full"
                >
                  Nearby 500m?
                </button>
              </div>

              {/* Messages scroll */}
              <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
                {agentMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white border-blue-600 ml-6'
                        : 'bg-white text-slate-800 border-slate-200 mr-4 shadow-2xs'
                    }`}
                  >
                    <div className={`font-bold text-[10px] uppercase tracking-wider mb-1 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}>
                      {msg.role === 'user' ? 'You' : 'CivicTech Agent'}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {isAgentTyping && (
                  <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-500 italic mr-4 flex items-center gap-2">
                    <span className="animate-pulse">Thinking & querying database...</span>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAgentSubmit()}
                  placeholder="Ask about project timelines, contractors, clashes..."
                  className="flex-1 bg-white border border-slate-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                  disabled={isAgentTyping}
                />
                <button
                  onClick={() => handleAgentSubmit()}
                  disabled={isAgentTyping}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold text-xs transition disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: PDF NOTICE SCANNER */}
          {activeTab === 'ingest' && (
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-xs text-emerald-900">
                <h4 className="font-bold flex items-center gap-1.5 mb-1">
                  <FileText size={14} /> AI Municipal Notice Extractor
                </h4>
                <p className="text-[11px] leading-relaxed">
                  Have a public works PDF tender or civic announcement? Upload it here! Our Gemini 2.5 Flash pipeline extracts project dates, contractor name, and street address, and immediately inserts it into Supabase!
                </p>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-emerald-500 transition">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={isIngestingPdf}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileText size={32} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-800">
                    {isIngestingPdf ? 'Analyzing PDF with Gemini...' : 'Click to Upload Notice PDF'}
                  </span>
                  <span className="text-[10px] text-slate-400">PDF up to 5MB</span>
                </label>
              </div>

              {isIngestingPdf && (
                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded border border-blue-200 text-center animate-pulse">
                  Extracting text with unpdf & analyzing schema with Gemini...
                </div>
              )}

              {ingestSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 text-xs rounded border border-emerald-300">
                  <div className="font-bold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Ingestion Success!
                  </div>
                  <div className="mt-1">{ingestSuccess}</div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── CENTER: INTERACTIVE LEAFLET MAP ── */}
        <section className="flex-1 relative bg-slate-100 min-h-[40vh] md:min-h-0">
          <CivicMap
            projects={filteredProjects}
            conflicts={conflicts}
            citizenReports={citizenReports}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onMapClick={handleMapClick}
            onUpvoteReport={handleUpvoteReport}
          />
        </section>

        {/* ── RIGHT PANEL: PROJECT DETAIL INSPECTOR ── */}
        {selectedProject && (
          <aside className="w-full md:w-[380px] flex-none bg-white border-l border-slate-200 flex flex-col overflow-y-auto shadow-lg z-10 absolute md:relative right-0 h-full md:h-auto">
            <div className="p-3.5 border-b border-slate-200 sticky top-0 bg-white/95 backdrop-blur-sm flex justify-between items-center z-10">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">Project Inspector</h2>
              <button
                onClick={() => setSelectedProjectId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 space-y-5 text-xs text-slate-700">
              {/* Header Badges */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                      selectedProject.status === 'delayed'
                        ? 'bg-red-100 text-red-700'
                        : selectedProject.status === 'ongoing'
                        ? 'bg-blue-100 text-blue-700'
                        : selectedProject.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {selectedProject.status}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium capitalize">
                    {selectedProject.workType} Work
                  </span>
                </div>

                <h2 className="font-extrabold text-base text-slate-900 leading-tight">
                  {selectedProject.title}
                </h2>
                <p className="mt-2 text-slate-600 leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-1 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="flex items-start gap-2.5">
                  <Building size={15} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">{selectedProject.department || 'Municipal Dept'}</div>
                    <div className="text-slate-500 text-[11px]">Contractor: {selectedProject.contractor || 'Assigned Vendor'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">{selectedProject.addressText}</div>
                    <div className="text-slate-500 text-[11px] font-mono">
                      {selectedProject.latitude ? `${selectedProject.latitude.toFixed(4)}, ${selectedProject.longitude?.toFixed(4)}` : 'Coordinates missing'}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <Calendar size={15} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Schedule Window</div>
                    <div className="text-slate-600 text-[11px]">
                      Planned: {selectedProject.plannedStartDate || 'TBD'} → {selectedProject.plannedEndDate || 'TBD'}
                    </div>
                    {selectedProject.actualStartDate && (
                      <div className="text-slate-600 text-[11px]">
                        Actual Started: {selectedProject.actualStartDate}
                      </div>
                    )}
                  </div>
                </div>

                {selectedProject.budget && selectedProject.budget > 0 && (
                  <div className="flex items-start gap-2.5">
                    <DollarSign size={15} className="text-slate-400 mt-0.5" />
                    <div>
                      <div className="font-bold text-slate-900">Allocated Budget</div>
                      <div className="text-emerald-700 font-bold text-[11px]">
                        ${selectedProject.budget.toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule / Delay Analysis */}
              {delayFinding && (
                <div className="p-3.5 rounded-lg border border-amber-300 bg-amber-50">
                  <h3 className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <Clock size={14} /> Timeline Analysis
                  </h3>
                  <p className="font-semibold text-amber-800">
                    {delayFinding.isOverdue ? `Overdue by ${delayFinding.daysLate} days` : 'Schedule notice recorded'}
                  </p>
                  <p className="mt-1 text-amber-700 text-[11px] leading-relaxed">
                    {delayFinding.reason}
                  </p>
                </div>
              )}

              {/* Department Conflicts with other projects */}
              {projectConflicts.length > 0 && (
                <div className="p-3.5 rounded-lg border border-red-300 bg-red-50">
                  <h3 className="font-bold text-red-900 flex items-center gap-1.5 mb-2">
                    <AlertTriangle size={14} /> Coordination Clash Detected!
                  </h3>
                  <div className="space-y-2">
                    {projectConflicts.map(c => (
                      <div key={c.id} className="text-[11px] text-red-800">
                        <div className="font-bold capitalize">{c.type.replace('_', ' ')}:</div>
                        <div>{c.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick shortcut to report issue on this project */}
              <button
                onClick={() => {
                  setNewReportForm(prev => ({
                    ...prev,
                    title: `Issue on ${selectedProject.title}`,
                    addressText: selectedProject.addressText,
                    latitude: selectedProject.latitude || 40.7128,
                    longitude: selectedProject.longitude || -74.0060,
                  }));
                  setShowReportModal(true);
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition text-center"
              >
                📢 Report Issue on this Project
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── 3. MODALS ───────────────────────────────────────────────────────── */}

      {/* MODAL 1: ADD NEW PROJECT */}
      {showAddProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs text-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="text-blue-600" size={16} /> Register New Civic Project
              </h3>
              <button onClick={() => setShowAddProjectModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elm Street Water Pipe Maintenance"
                  value={newProjectForm.title}
                  onChange={e => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Details about trenching, equipment, road closure..."
                  value={newProjectForm.description}
                  onChange={e => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Work Type</label>
                  <select
                    value={newProjectForm.workType}
                    onChange={e => setNewProjectForm({ ...newProjectForm, workType: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="road">Road</option>
                    <option value="water">Water</option>
                    <option value="electrical">Electrical</option>
                    <option value="drainage">Drainage</option>
                    <option value="sewer">Sewer</option>
                    <option value="public_facility">Public Facility</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">Status</label>
                  <select
                    value={newProjectForm.status}
                    onChange={e => setNewProjectForm({ ...newProjectForm, status: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                  >
                    <option value="planned">Planned</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="delayed">Delayed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Water Bureau"
                    value={newProjectForm.department}
                    onChange={e => setNewProjectForm({ ...newProjectForm, department: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Contractor</label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Builders"
                    value={newProjectForm.contractor}
                    onChange={e => setNewProjectForm({ ...newProjectForm, contractor: e.target.value })}
                    className="w-full border border-slate-300 rounded px-3 py-1.5 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Planned Start</label>
                  <input
                    type="date"
                    value={newProjectForm.plannedStartDate}
                    onChange={e => setNewProjectForm({ ...newProjectForm, plannedStartDate: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Planned End</label>
                  <input
                    type="date"
                    value={newProjectForm.plannedEndDate}
                    onChange={e => setNewProjectForm({ ...newProjectForm, plannedEndDate: e.target.value })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 450 Elm St between 3rd & 4th"
                  value={newProjectForm.addressText}
                  onChange={e => setNewProjectForm({ ...newProjectForm, addressText: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newProjectForm.latitude}
                    onChange={e => setNewProjectForm({ ...newProjectForm, latitude: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newProjectForm.longitude}
                    onChange={e => setNewProjectForm({ ...newProjectForm, longitude: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded px-2 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CITIZEN REPORT FORM */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Megaphone className="text-purple-600" size={16} /> Report Roadwork or Pothole
              </h3>
              <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">Issue Category</label>
                <select
                  value={newReportForm.category}
                  onChange={e => setNewReportForm({ ...newReportForm, category: e.target.value })}
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5"
                >
                  <option value="uncoordinated_digging">Uncoordinated Digging (Multiple Crews)</option>
                  <option value="pothole">Pothole / Broken Pavement</option>
                  <option value="delayed_work">Delayed / Abandoned Trench</option>
                  <option value="water_leak">Water Leak from Dug Pipe</option>
                  <option value="noise_safety">Safety / Traffic Hazard</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">Report Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Street re-dug right after repaving"
                  value={newReportForm.title}
                  onChange={e => setNewReportForm({ ...newReportForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Observation Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe what you saw, which department trucks were there..."
                  value={newReportForm.description}
                  onChange={e => setNewReportForm({ ...newReportForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 focus:border-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Location / Cross Street *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corner of Main St & Commerce"
                  value={newReportForm.addressText}
                  onChange={e => setNewReportForm({ ...newReportForm, addressText: e.target.value })}
                  className="w-full border border-slate-300 rounded px-3 py-1.5 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 border rounded text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded"
                >
                  Submit Citizen Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TEAM & HACKATHON INFO */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-xs text-slate-800 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="text-blue-600" size={16} /> About CivicTech
              </h3>
              <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p>
                <strong>CivicTech</strong> is an open-source public works intelligence platform designed to detect uncoordinated road excavations, track project delays across municipal departments, and empower citizens to report road hazards.
              </p>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <div className="font-semibold text-slate-900">Features:</div>
                <div>• Cross-department spatial & schedule conflict detection</div>
                <div>• Supabase PostgreSQL live database integration</div>
                <div>• Community crowdsourced issue reporting & upvotes</div>
                <div>• Bounded AI investigation agent via Gemini 2.5 Flash</div>
              </div>

              <p className="text-slate-500 text-[11px]">
                Built using Next.js 16, Supabase PostgreSQL, Leaflet, and Google Gemini.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DATABASE & SUPABASE SETUP INFO */}
      {showDbInfoModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 text-xs text-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Database className="text-emerald-600" size={16} /> Supabase Database Status
              </h3>
              <button onClick={() => setShowDbInfoModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-lg border ${dataSource === 'supabase' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <strong>Status:</strong> {dataSource === 'supabase' ? '🟢 Live Supabase Database Connected!' : '⚡ Demo In-Memory DB Mode Active'}
              </div>

              <p>
                <strong>How to connect your free Supabase DB in 2 minutes:</strong>
              </p>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-600">
                <li>Create a free project on <a href="https://supabase.com" target="_blank" className="text-blue-600 underline">supabase.com</a>.</li>
                <li>Go to the <strong>SQL Editor</strong> tab and paste the contents of <code>supabase/schema.sql</code>, then click <strong>Run</strong>.</li>
                <li>Go to <strong>Project Settings → API</strong> and copy your URL & Anon Public Key.</li>
                <li>Put them in <code>.env.local</code> (or Vercel Environment Variables):
                  <pre className="bg-slate-900 text-slate-100 p-2 rounded mt-1 text-[11px] font-mono">
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
                  </pre>
                </li>
              </ol>

              <p className="text-slate-500 text-[11px]">
                Note: Even without Supabase credentials, our in-memory fallback stores all added projects and citizen reports during your active session!
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t">
              <button
                onClick={() => setShowDbInfoModal(false)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
