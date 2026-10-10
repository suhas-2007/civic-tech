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
  Plus,
  Megaphone,
  Download,
  Database,
  Search,
  Filter,
  CheckCircle2,
  X,
  Users,
  DollarSign,
  Layers,
  Terminal,
  ShieldAlert,
  ListFilter,
  ChevronRight,
  ExternalLink,
  Map as MapIcon,
  Info
} from "lucide-react";
import "./workspace.css";

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

  // mobile viewport toggle: 'panel' or 'map'
  const [mobileView, setMobileView] = useState<'panel' | 'map'>('panel');

  // modal visibility state
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDbInfoModal, setShowDbInfoModal] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState<[number, number] | null>(null);
  const [dbDebugInfo, setDbDebugInfo] = useState<{ source?: string; error?: string; hasEnv?: boolean; isConfigured?: boolean } | null>(null);

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
  const [agentMessages, setAgentMessages] = useState<{ role: string; content: string; timestamp?: string }[]>([
    {
      role: "agent",
      content: "Civorium Investigation Engine initialized.\n\nQuery active municipal projects, inspect spatial proximity conflicts, or cross-reference department timelines. Select a preset below or enter a prompt.",
      timestamp: "SYSTEM READY"
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
        setDbDebugInfo({
          source: projRes.source,
          error: projRes.error,
          hasEnv: projRes.hasEnv,
          isConfigured: projRes.isConfigured,
        });
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
      alert("Please enter a title and address.");
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
      alert("Please provide a title and location.");
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
        alert("Observation submitted successfully");
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
    setAgentMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: promptToSend,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsAgentTyping(true);

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptToSend })
      });
      const data = await res.json();
      if (res.ok) {
        setAgentMessages(prev => [
          ...prev,
          {
            role: 'agent',
            content: data.text,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      } else {
        setAgentMessages(prev => [
          ...prev,
          {
            role: 'agent',
            content: `Notice: ${data.error || 'AI Agent is operating with deterministic local tools.'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (e: any) {
      setAgentMessages(prev => [
        ...prev,
        {
          role: 'agent',
          content: `Network Error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
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
        setIngestSuccess(`Extracted & Registered: "${data.data.title}" at ${data.data.addressText}`);
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
      platform: "Civorium",
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
    a.download = `civorium-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const delayedCount = projects.filter(p => p.status === 'delayed').length;
  const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

  return (
    <main className="ws-root flex flex-col h-screen overflow-hidden">
      
      {/* ── 1. COMMAND BAR (Top Executive Navigation) ── */}
      <header className="ws-header flex-none z-20">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 gap-3">
          
          {/* Left: Product Wordmark & Context */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-slate-500 hover:text-slate-900 transition-colors py-1 px-1.5 -ml-1 rounded-[3px] hover:bg-slate-100"
              title="Return to landing overview"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Landing</span>
            </Link>
            <div className="h-3.5 w-px bg-slate-200"></div>
            <div className="flex items-baseline gap-2">
              <span className="ws-wordmark text-sm">
                CIVORIUM
              </span>
              <span className="hidden md:inline-block text-[10px] font-mono tracking-widest uppercase" style={{ color: "#6B706E" }}>
                OPS · CONTROL
              </span>
            </div>
          </div>

          {/* Center: Backend Telemetry Status */}
          <div className="hidden sm:flex items-center">
            <button
              onClick={() => setShowDbInfoModal(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono py-1 px-2.5 rounded-[3px] border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition text-slate-700 cursor-pointer"
            >
              <span
                className={`w-2 h-2 rounded-[2px] ${
                  dataSource === 'supabase' ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              />
              <span>
                BACKEND: <strong className={dataSource === 'supabase' ? 'text-emerald-700' : 'text-amber-700'}>
                  {dataSource === 'supabase' ? 'SUPABASE LIVE' : 'DEMO MEMORY'}
                </strong>
              </span>
            </button>
          </div>

          {/* Right: Operational Actions & Mobile Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mobile View Switcher */}
            <div className="flex md:hidden border border-slate-200 rounded-[3px] overflow-hidden text-[11px] font-mono">
              <button
                onClick={() => setMobileView('panel')}
                className={`px-2 py-1 ${mobileView === 'panel' ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-600'}`}
              >
                Panel
              </button>
              <button
                onClick={() => setMobileView('map')}
                className={`px-2 py-1 ${mobileView === 'map' ? 'bg-slate-900 text-white font-bold' : 'bg-white text-slate-600'}`}
              >
                Map
              </button>
            </div>

            <button
              onClick={() => setShowAddProjectModal(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-900 hover:bg-slate-800 text-white px-2.5 py-1.5 rounded-[3px] transition cursor-pointer"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Add Project</span>
            </button>

            <button
              onClick={() => setShowReportModal(true)}
              className="ws-btn-signal inline-flex items-center gap-1 text-[11px] px-2.5 py-1.5 transition cursor-pointer"
            >
              <Megaphone size={13} />
              <span className="hidden sm:inline">Log Signal</span>
            </button>

            <button
              onClick={handleExportData}
              title="Download Full Audit Payload (JSON)"
              className="inline-flex items-center gap-1 text-[11px] font-mono border border-slate-300 hover:bg-slate-100 px-2 py-1.5 rounded-[3px] text-slate-700 transition"
            >
              <Download size={13} />
              <span className="hidden lg:inline">JSON</span>
            </button>

            <button
              onClick={() => setShowTeamModal(true)}
              title="Civorium System Architecture & Specs"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-[3px] transition"
            >
              <Info size={15} />
            </button>
          </div>
        </div>

        {/* ── T4 TELEMETRY STRIP (Hallmark Continuous Ribbon) ── */}
        <div className="ws-telemetry flex items-center justify-between px-3 sm:px-4 py-1 text-[11px] font-mono overflow-x-auto whitespace-nowrap" style={{ color: "#3D4240", borderTop: "1px solid #D9C9AE" }}>
          <div className="flex items-center gap-4 sm:gap-6 divide-x divide-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 uppercase text-[10px]">PROJECTS</span>
              <span className="font-bold text-slate-900 tabular-nums">
                {String(projects.length).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pl-4 sm:pl-6">
              <span className="text-slate-400 uppercase text-[10px]">CLASHES</span>
              <span className={`font-bold tabular-nums ${conflicts.length > 0 ? 'text-red-700' : 'text-slate-900'}`}>
                {String(conflicts.length).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pl-4 sm:pl-6">
              <span className="text-slate-400 uppercase text-[10px]">OVERDUE</span>
              <span className={`font-bold tabular-nums ${delayedCount > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                {String(delayedCount).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 pl-4 sm:pl-6">
              <span className="text-slate-400 uppercase text-[10px]">SIGNALS</span>
              <span className="font-bold text-purple-700 tabular-nums">
                {String(citizenReports.length).padStart(2, '0')}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 pl-4 sm:pl-6">
              <span className="text-slate-400 uppercase text-[10px]">TRACKED BUDGET</span>
              <span className="font-bold text-slate-800 tabular-nums">
                ${(totalBudget / 1000).toLocaleString('en-US', { minimumFractionDigits: 0 })}K
              </span>
            </div>
          </div>

          {pinnedCoords && (
            <div className="pl-4 text-[10px] text-blue-700 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-blue-600"></span>
              PINNED: [{pinnedCoords[0].toFixed(4)}, {pinnedCoords[1].toFixed(4)}]
            </div>
          )}
        </div>
      </header>

      {/* ── 2. DUAL-PANE WORKSPACE (Hallmark Workbench: Left Sidebar 29% + Map 71%) ── */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* ── LEFT PANEL: OPERATIONAL WORKSPACE TABS ── */}
        <aside
          className={`ws-panel w-full md:w-[390px] lg:w-[410px] flex-none flex flex-col overflow-hidden z-10 ${
            mobileView === 'map' ? 'hidden md:flex' : 'flex'
          }`}
        >
          
          {/* Segmented Tab Bar */}
          <div className="ws-tabs flex text-[11px]">
            <button
              onClick={() => setActiveTab('directory')}
              className={`ws-tab flex-1 py-2 px-1 text-center flex items-center justify-center gap-1 border-b-2 ${
                activeTab === 'directory' ? 'ws-tab--active-dir' : 'border-transparent'
              }`}
            >
              <ListFilter size={13} />
              <span>Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('conflicts')}
              className={`ws-tab flex-1 py-2 px-1 text-center flex items-center justify-center gap-1 border-b-2 ${
                activeTab === 'conflicts' ? 'ws-tab--active-clash' : 'border-transparent'
              }`}
            >
              <ShieldAlert size={13} />
              <span>Clashes</span>
              {conflicts.length > 0 && (
                <span className="ws-count-badge--clash tabular-nums">
                  {conflicts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`ws-tab flex-1 py-2 px-1 text-center flex items-center justify-center gap-1 border-b-2 ${
                activeTab === 'reports' ? 'ws-tab--active-signals' : 'border-transparent'
              }`}
            >
              <Megaphone size={13} />
              <span>Signals</span>
              {citizenReports.length > 0 && (
                <span className="ws-count-badge--signal tabular-nums">
                  {citizenReports.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`ws-tab flex-1 py-2 px-1 text-center flex items-center justify-center gap-1 border-b-2 ${
                activeTab === 'agent' ? 'ws-tab--active-agent' : 'border-transparent'
              }`}
            >
              <Terminal size={13} />
              <span>Analyst</span>
            </button>

            <button
              onClick={() => setActiveTab('ingest')}
              className={`ws-tab flex-1 py-2 px-1 text-center flex items-center justify-center gap-1 border-b-2 ${
                activeTab === 'ingest' ? 'ws-tab--active-notice' : 'border-transparent'
              }`}
            >
              <FileText size={13} />
              <span>Notice</span>
            </button>
          </div>

          {/* TAB 1: PROJECT DIRECTORY */}
          {activeTab === 'directory' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Search & Filters */}
              <div className="p-2.5 border-b border-slate-200 bg-slate-50/50 space-y-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by title, department, street..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-[3px] pl-7 pr-7 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-slate-500 placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-mono"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-[3px] text-[11px] px-2 py-1 text-slate-700 font-mono"
                  >
                    <option value="all">Status: All</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="delayed">Delayed</option>
                    <option value="planned">Planned</option>
                    <option value="completed">Completed</option>
                  </select>

                  <select
                    value={filterWorkType}
                    onChange={e => setFilterWorkType(e.target.value)}
                    className="flex-1 bg-white border border-slate-300 rounded-[3px] text-[11px] px-2 py-1 text-slate-700 font-mono"
                  >
                    <option value="all">Type: All</option>
                    <option value="road">Road</option>
                    <option value="water">Water</option>
                    <option value="electrical">Electrical</option>
                    <option value="drainage">Drainage</option>
                    <option value="public_facility">Public Facility</option>
                  </select>
                </div>
              </div>

              {/* Projects List: High-density hairline rows without nested cards */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {isLoading ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-mono">
                    Loading municipal project records...
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No infrastructure records match filter criteria.
                  </div>
                ) : (
                  filteredProjects.map((proj, idx) => {
                    const isSelected = selectedProjectId === proj.id;
                    const hasClash = conflicts.some(c => c.projectIds.includes(proj.id));

                    return (
                      <button
                        key={proj.id}
                        onClick={() => {
                          setSelectedProjectId(proj.id);
                          setMobileView('map');
                        }}
                        className={`w-full text-left p-3 transition flex flex-col gap-1 border-l-2 ${
                          isSelected
                            ? 'ws-project-row ws-project-row--selected'
                            : 'ws-project-row border-l-transparent'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              #{String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className={`ws-status ws-status--${proj.status}`}>
                              {proj.status}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono uppercase text-slate-500">
                            {proj.workType}
                          </span>
                        </div>

                        <h3 className="font-semibold text-xs text-slate-900 leading-snug line-clamp-1">
                          {proj.title}
                        </h3>

                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          {proj.addressText}
                        </p>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 mt-0.5 border-t border-slate-100">
                          <span className="truncate max-w-[190px]">{proj.department || 'Municipal Dept'}</span>
                          <span className="tabular-nums">{proj.plannedStartDate || 'TBD'}</span>
                        </div>

                        {hasClash && (
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium text-red-700 bg-red-50/80 px-1.5 py-0.5 rounded-[2px] border border-red-200">
                            <AlertTriangle size={11} className="text-red-600" />
                            <span>Coordination clash detected with other works</span>
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
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              <div className="border border-slate-200 bg-slate-50 rounded-[3px] p-2.5 text-[11px] text-slate-700 leading-relaxed">
                <span className="font-mono text-[10px] uppercase font-bold text-slate-500 block mb-0.5">
                  Conflict Engine Telemetry
                </span>
                Cross-department schedule overlaps and spatial proximity clashes. Evaluated using Haversine distance and inclusive interval logic.
              </div>

              {conflicts.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Zero inter-departmental conflicts identified across active projects.
                </div>
              ) : (
                conflicts.map((conflict, idx) => {
                  const involvedProjects = projects.filter(p => conflict.projectIds.includes(p.id));

                  return (
                    <div
                      key={conflict.id || idx}
                      className="ws-clash-row space-y-2 mb-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="ws-alert__title text-[#7A3020] flex items-center gap-1">
                          <AlertTriangle size={11} /> {conflict.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono font-bold uppercase" style={{ color: "#A54836" }}>
                          {conflict.severity}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-900 leading-snug">
                        {conflict.reason}
                      </p>

                      <div className="text-[10px] font-mono text-slate-600 space-y-0.5 bg-slate-50 p-2 rounded-[2px] border border-slate-100">
                        {conflict.temporalBasis && <div>TIMELINE: {conflict.temporalBasis}</div>}
                        {conflict.spatialBasis && <div>LOCATION: {conflict.spatialBasis}</div>}
                      </div>

                      <div className="text-xs pt-1 border-t border-slate-100">
                        <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-1">
                          Involved Projects:
                        </span>
                        <div className="space-y-1">
                          {involvedProjects.map(p => (
                            <button
                              key={p.id}
                              onClick={() => {
                                setSelectedProjectId(p.id);
                                setMobileView('map');
                              }}
                              className="text-left w-full text-[11px] text-blue-700 hover:underline truncate block"
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

          {/* TAB 3: CITIZEN SIGNALS / OBSERVATIONS */}
          {activeTab === 'reports' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-2.5 border-b border-slate-200 bg-purple-50/40 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-purple-950">Field Observations</h3>
                  <p className="text-[10px] text-purple-700 font-mono">Potholes, repeated excavations, delays</p>
                </div>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-[11px] bg-purple-700 hover:bg-purple-800 text-white font-medium px-2 py-1 rounded-[3px] transition cursor-pointer"
                >
                  + New Signal
                </button>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {citizenReports.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">
                    No field signals currently logged. Click on the map to pin an observation.
                  </div>
                ) : (
                  citizenReports.map(rep => (
                    <div key={rep.id} className="p-3 space-y-1 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between">
                        <span className="ws-origin-badge">
                          {rep.category.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] font-mono opacity-60 uppercase">
                          {rep.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h4 className="font-semibold text-xs text-slate-900 leading-snug">
                        {rep.title}
                      </h4>

                      <p className="text-[11px] text-slate-600 line-clamp-2">
                        {rep.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                        <span className="truncate max-w-[210px]">{rep.addressText}</span>
                        <button
                          onClick={() => handleUpvoteReport(rep.id)}
                          className="ws-btn-ghost flex items-center gap-1 px-1.5 py-0.5"
                        >
                          CONFIRM: <span className="font-bold tabular-nums">{rep.upvotes}</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: INVESTIGATION CONSOLE (AI Analyst) */}
          {activeTab === 'agent' && (
            <div className="ws-console flex-1 flex flex-col p-3 text-xs h-full">
              
              {/* Presets Strip */}
              <div className="flex gap-1 flex-wrap mb-2 pb-2" style={{ borderBottom: "1px solid #D9C9AE" }}>
                <span className="text-[10px] font-mono uppercase self-center mr-1" style={{ color: "#6B706E" }}>Audits:</span>
                <button
                  onClick={() => handleAgentSubmit("Which projects on Main St have conflicts?")}
                  className="ws-btn-ghost px-2 py-1 rounded-none"
                >
                  Main St Conflicts
                </button>
                <button
                  onClick={() => handleAgentSubmit("What projects are currently delayed?")}
                  className="ws-btn-ghost px-2 py-1 rounded-none"
                >
                  Delayed Works
                </button>
                <button
                  onClick={() => handleAgentSubmit("Find projects within 500m of Main St water works")}
                  className="ws-btn-ghost px-2 py-1 rounded-none"
                >
                  Radius &lt; 500m
                </button>
              </div>

              {/* Console Messages Scroll */}
              <div className="flex-1 overflow-y-auto space-y-2.5 mb-2 pr-1 font-mono">
                {agentMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`p-2.5 text-[11px] leading-relaxed ${
                      msg.role === 'user'
                        ? 'ws-console-msg--user ml-4'
                        : 'ws-console-msg--agent mr-2 font-sans'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1 pb-1 text-[9px] font-mono uppercase tracking-wider opacity-60" style={{ borderBottom: "1px solid currentColor" }}>
                      <span>{msg.role === 'user' ? 'OPERATOR' : 'CIVORIUM ANALYST'}</span>
                      {msg.timestamp && <span className="tabular-nums">{msg.timestamp}</span>}
                    </div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                ))}
                {isAgentTyping && (
                  <div className="ws-console-msg--agent p-2.5 text-[11px] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-[1px] animate-pulse" style={{ background: "#155B45" }}></span>
                    <span>Querying municipal database &amp; calculating intervals...</span>
                  </div>
                )}
              </div>

              {/* Terminal Input */}
              <div className="flex gap-1.5 pt-2" style={{ borderTop: "1px solid #D9C9AE" }}>
                <input
                  type="text"
                  value={agentInput}
                  onChange={e => setAgentInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAgentSubmit()}
                  placeholder="Query project timelines, contractors, clashes..."
                  className="ws-console-input flex-1 text-xs"
                  disabled={isAgentTyping}
                />
                <button
                  onClick={() => handleAgentSubmit()}
                  disabled={isAgentTyping}
                  className="ws-btn-primary disabled:opacity-50"
                >
                  Query
                </button>
              </div>
            </div>
          )}

          {/* TAB 5: NOTICE SCANNER */}
          {activeTab === 'ingest' && (
            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
              <div className="ws-data-block p-3">
                <div className="ws-alert__title flex items-center gap-1.5 mb-1">
                  <FileText size={13} /> Notice Parsing Pipeline
                </div>
                <p className="leading-relaxed text-[11px]">
                  Upload municipal tender PDFs or public works announcements. Structured data extraction processes project schedules, contractor assignments, and addresses.
                </p>
              </div>

              <div className="ws-upload-zone p-6 text-center transition">
                <input
                  type="file"
                  id="pdf-upload"
                  accept="application/pdf"
                  onChange={handlePdfUpload}
                  disabled={isIngestingPdf}
                  className="hidden"
                />
                <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <FileText size={28} className="opacity-50" />
                  <span className="text-xs font-semibold">
                    {isIngestingPdf ? 'Processing PDF Notice...' : 'Select Municipal Notice (PDF)'}
                  </span>
                  <span className="text-[10px] font-mono opacity-50">PDF up to 5MB</span>
                </label>
              </div>

              {isIngestingPdf && (
                <div className="p-3 bg-[#E6E2D7] text-xs border border-[#D9C9AE] text-center font-mono">
                  Extracting text streams &amp; resolving entities...
                </div>
              )}

              {ingestSuccess && (
                <div className="p-3 bg-[#E6E2D7] text-xs border border-[#155B45]">
                  <div className="font-bold font-mono text-[10px] uppercase flex items-center gap-1" style={{ color: "#155B45" }}>
                    <CheckCircle2 size={13} /> Extraction Confirmed
                  </div>
                  <div className="mt-1 text-[11px]">{ingestSuccess}</div>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* ── CENTER / RIGHT: INTERACTIVE LEAFLET GEOSPATIAL WORKSPACE ── */}
        <section
          className={`flex-1 relative bg-slate-100 ${
            mobileView === 'panel' ? 'hidden md:block' : 'block'
          }`}
        >
          <CivicMap
            projects={filteredProjects}
            conflicts={conflicts}
            citizenReports={citizenReports}
            selectedProjectId={selectedProjectId}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
            }}
            onMapClick={handleMapClick}
            onUpvoteReport={handleUpvoteReport}
          />
        </section>

        {/* ── RIGHT DRAWER: PROJECT DETAIL INSPECTOR (Hallmark Slide-Over Sheet) ── */}
        {selectedProject && (
          <aside className="ws-inspector w-full md:w-[360px] lg:w-[380px] flex-none flex flex-col overflow-y-auto z-20 absolute md:relative right-0 h-full shadow-lg md:shadow-none">
            <div className="ws-inspector-header p-3 sticky top-0 backdrop-blur-xs flex justify-between items-center z-10">
              <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase font-bold text-slate-500">
                <span>INSPECTOR</span>
                <span>{'//'}</span>
                <span className="text-slate-900">{selectedProject.id}</span>
              </div>
              <button
                onClick={() => setSelectedProjectId(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-[2px] transition"
                title="Close Inspector"
              >
                <X size={15} />
              </button>
            </div>

            <div className="p-4 space-y-4 text-xs text-slate-700">
              
              {/* Header Badges */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className={`ws-status ws-status--${selectedProject.status}`}>
                    {selectedProject.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    {selectedProject.workType} work
                  </span>
                </div>

                <h2 className="font-bold text-sm text-slate-900 leading-snug">
                  {selectedProject.title}
                </h2>
                <p className="mt-1.5 text-slate-600 text-[11px] leading-relaxed">
                  {selectedProject.description}
                </p>
              </div>

              {/* Technical Specifications Grid */}
              <div className="ws-data-block mb-4 mt-2">
                <div className="ws-data-row">
                  <div className="ws-data-label">Department / Contractor</div>
                  <div className="ws-data-value font-semibold">{selectedProject.department || 'Municipal Dept'}</div>
                  <div className="ws-data-value text-[11px]">Contractor: {selectedProject.contractor || 'Assigned Vendor'}</div>
                </div>

                <div className="ws-data-row">
                  <div className="ws-data-label">Geospatial Position</div>
                  <div className="ws-data-value font-semibold">{selectedProject.addressText}</div>
                  <div className="ws-data-value ws-data-value--mono mt-1">
                    {selectedProject.latitude ? `COORDS: ${selectedProject.latitude.toFixed(5)}, ${selectedProject.longitude?.toFixed(5)}` : 'Coordinates unassigned'}
                  </div>
                </div>

                <div className="ws-data-row">
                  <div className="ws-data-label">Schedule Window</div>
                  <div className="ws-data-value ws-data-value--mono font-semibold">
                    {selectedProject.plannedStartDate || 'TBD'} → {selectedProject.plannedEndDate || 'TBD'}
                  </div>
                  {selectedProject.actualStartDate && (
                    <div className="ws-data-value ws-data-value--mono mt-1 text-slate-500">
                      ACTUAL START: {selectedProject.actualStartDate}
                    </div>
                  )}
                </div>

                {selectedProject.budget && selectedProject.budget > 0 && (
                  <div className="ws-data-row">
                    <div className="ws-data-label">Allocated Budget</div>
                    <div className="ws-data-value ws-data-value--mono font-bold">
                      ${selectedProject.budget.toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule / Delay Analysis */}
              {delayFinding && (
                <div className="ws-alert ws-alert--delay">
                  <div className="ws-alert__title flex items-center gap-1">
                    <Clock size={12} /> Schedule Anomaly
                  </div>
                  <p className="font-semibold text-xs mt-1">
                    {delayFinding.isOverdue ? `Overdue by ${delayFinding.daysLate} calendar days` : 'Schedule notice recorded'}
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    {delayFinding.reason}
                  </p>
                </div>
              )}

              {/* Department Conflicts with other projects */}
              {projectConflicts.length > 0 && (
                <div className="ws-alert ws-alert--clash mt-4">
                  <div className="ws-alert__title flex items-center gap-1 mb-1.5">
                    <AlertTriangle size={12} /> Active Coordination Clash
                  </div>
                  <div className="space-y-2">
                    {projectConflicts.map(c => (
                      <div key={c.id} className="text-[11px]">
                        <div className="font-mono text-[10px] uppercase font-bold">{c.type.replace('_', ' ')}:</div>
                        <div>{c.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shortcut: Report observation at this project's coordinates */}
              <button
                onClick={() => {
                  setNewReportForm(prev => ({
                    ...prev,
                    title: `Observation on ${selectedProject.title}`,
                    addressText: selectedProject.addressText,
                    latitude: selectedProject.latitude || 40.7128,
                    longitude: selectedProject.longitude || -74.0060,
                  }));
                  setShowReportModal(true);
                }}
                className="ws-btn-primary w-full mt-4 block text-center"
              >
                Log Signal on This Project
              </button>
            </div>
          </aside>
        )}
      </div>

      {/* ── 3. MODAL DIALOGS (Clean Municipal Operations Dialogs) ── */}

      {/* MODAL 1: ADD NEW CIVIC PROJECT */}
      {showAddProjectModal && (
        <div className="ws-modal-bg fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="ws-modal max-w-lg w-full p-5 text-xs space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="ws-modal-header flex justify-between items-center pb-2">
              <h3 className="text-xs font-mono uppercase font-bold text-slate-900">
                Register Infrastructure Project
              </h3>
              <button
                onClick={() => setShowAddProjectModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Elm Street Water Pipe Maintenance"
                  value={newProjectForm.title}
                  onChange={e => setNewProjectForm({ ...newProjectForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 focus:border-slate-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Scope of Work</label>
                <textarea
                  rows={2}
                  placeholder="Details regarding trenching, lane closures, equipment..."
                  value={newProjectForm.description}
                  onChange={e => setNewProjectForm({ ...newProjectForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 focus:border-slate-500 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Work Type</label>
                  <select
                    value={newProjectForm.workType}
                    onChange={e => setNewProjectForm({ ...newProjectForm, workType: e.target.value })}
                    className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 text-xs font-mono"
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
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Status</label>
                  <select
                    value={newProjectForm.status}
                    onChange={e => setNewProjectForm({ ...newProjectForm, status: e.target.value })}
                    className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 text-xs font-mono"
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
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Water Bureau"
                    value={newProjectForm.department}
                    onChange={e => setNewProjectForm({ ...newProjectForm, department: e.target.value })}
                    className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Contractor</label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Builders"
                    value={newProjectForm.contractor}
                    onChange={e => setNewProjectForm({ ...newProjectForm, contractor: e.target.value })}
                    className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Planned Start</label>
                  <input
                    type="date"
                    value={newProjectForm.plannedStartDate}
                    onChange={e => setNewProjectForm({ ...newProjectForm, plannedStartDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Planned End</label>
                  <input
                    type="date"
                    value={newProjectForm.plannedEndDate}
                    onChange={e => setNewProjectForm({ ...newProjectForm, plannedEndDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 450 Elm St between 3rd & 4th"
                  value={newProjectForm.addressText}
                  onChange={e => setNewProjectForm({ ...newProjectForm, addressText: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newProjectForm.latitude}
                    onChange={e => setNewProjectForm({ ...newProjectForm, latitude: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newProjectForm.longitude}
                    onChange={e => setNewProjectForm({ ...newProjectForm, longitude: parseFloat(e.target.value) })}
                    className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="ws-modal-footer flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProjectModal(false)}
                  className="ws-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ws-btn-primary"
                >
                  Save to Database
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LOG FIELD SIGNAL */}
      {showReportModal && (
        <div className="ws-modal-bg fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="ws-modal max-w-md w-full p-5 text-xs space-y-4">
            <div className="ws-modal-header flex justify-between items-center pb-2">
              <h3 className="text-xs font-mono uppercase font-bold" style={{ color: "#191C1A" }}>
                Log Field Signal / Observation
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3">
              <div>
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Category</label>
                <select
                  value={newReportForm.category}
                  onChange={e => setNewReportForm({ ...newReportForm, category: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2 py-1.5 text-xs font-mono"
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
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Signal Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Street re-excavated immediately after repaving"
                  value={newReportForm.title}
                  onChange={e => setNewReportForm({ ...newReportForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 focus:border-slate-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Observation Details</label>
                <textarea
                  rows={3}
                  placeholder="Describe observed conditions, contractor vehicles, lane closures..."
                  value={newReportForm.description}
                  onChange={e => setNewReportForm({ ...newReportForm, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 focus:border-slate-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] uppercase text-slate-600 block mb-1">Location / Cross Street *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corner of Main St & Commerce"
                  value={newReportForm.addressText}
                  onChange={e => setNewReportForm({ ...newReportForm, addressText: e.target.value })}
                  className="w-full border border-slate-300 rounded-[3px] px-2.5 py-1.5 outline-none text-xs"
                />
              </div>

              <div className="ws-modal-footer flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="ws-btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ws-btn-signal"
                >
                  Register Signal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SYSTEM ARCHITECTURE & ABOUT CIVORIUM */}
      {showTeamModal && (
        <div className="ws-modal-bg fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="ws-modal max-w-md w-full p-5 text-xs space-y-4">
            <div className="ws-modal-header flex justify-between items-center pb-2">
              <h3 className="text-xs font-mono uppercase font-bold" style={{ color: "#191C1A" }}>
                System Specifications // Civorium
              </h3>
              <button onClick={() => setShowTeamModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 leading-relaxed">
              <p>
                <strong>Civorium</strong> is a civic infrastructure monitoring platform designed to eliminate uncoordinated municipal excavations, identify cross-departmental project clashes, and empower citizens with transparent infrastructure intelligence.
              </p>

              <div className="bg-slate-50 p-3 rounded-[3px] border border-slate-200 space-y-1 font-mono text-[11px]">
                <div className="font-bold text-slate-900 uppercase">Core Capabilities:</div>
                <div>• Deterministic spatial & timeline conflict detection</div>
                <div>• Live Supabase PostgreSQL persistence with fallback</div>
                <div>• Field observation crowd verification with upvoting</div>
                <div>• Gemini 3.8 Flash structured notice ingestion</div>
              </div>

              <p className="text-slate-500 text-[11px]">
                Built with Next.js 16 (Turbopack), Leaflet GeoSearch, Supabase, and Google Gemini.
              </p>
            </div>

            <div className="ws-modal-footer flex justify-end pt-2">
              <button
                onClick={() => setShowTeamModal(false)}
                className="ws-btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DATABASE & BACKEND TELEMETRY */}
      {showDbInfoModal && (
        <div className="ws-modal-bg fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="ws-modal max-w-lg w-full p-5 text-xs space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="ws-modal-header flex justify-between items-center pb-2">
              <h3 className="text-xs font-mono uppercase font-bold" style={{ color: "#191C1A" }}>
                Database Telemetry & Configuration
              </h3>
              <button onClick={() => setShowDbInfoModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div className={`p-3 rounded-[3px] border ${dataSource === 'supabase' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="font-mono text-[10px] uppercase font-bold">
                  Active Mode: {dataSource === 'supabase' ? 'Supabase PostgreSQL (Live)' : 'In-Memory Demo Database'}
                </div>
                {dbDebugInfo?.error && (
                  <div className="mt-2 text-red-700 bg-red-50 p-2 rounded-[2px] border border-red-200 text-[10px] font-mono">
                    ERROR: {dbDebugInfo.error}
                  </div>
                )}
                {dbDebugInfo?.hasEnv === false && (
                  <div className="mt-2 text-amber-800 bg-amber-100/60 p-2 rounded-[2px] text-[11px]">
                    NEXT_PUBLIC_SUPABASE_URL is currently unset in the hosting environment. The application runs seamlessly in local in-memory session mode.
                  </div>
                )}
              </div>

              <div className="space-y-1.5 text-slate-600">
                <div className="font-semibold text-slate-900">Supabase Connection Parameters:</div>
                <div className="font-mono text-[11px] bg-slate-900 text-slate-100 p-2.5 rounded-[3px]">
                  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co<br />
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
                </div>
              </div>
            </div>

            <div className="ws-modal-footer flex justify-end pt-2">
              <button
                onClick={() => setShowDbInfoModal(false)}
                className="ws-btn-primary"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
