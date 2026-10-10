import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { agentTools } from '@/lib/agent-tools';
import { getProjects } from '@/lib/db';
import { detectConflicts } from '@/lib/conflicts';

// Candidate models to try in order of efficiency and quota resilience
const CANDIDATE_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash'
];

// Comprehensive deterministic fallback if Gemini is unavailable, rate-limited, or errors out
async function evaluateDeterministicResponse(prompt: string): Promise<string> {
  const lower = prompt.toLowerCase();
  const { projects } = await getProjects();
  const conflicts = detectConflicts(projects);

  // 1. Delayed projects check
  if (lower.includes('delayed') || lower.includes('delay')) {
    const delayed = projects.filter(p => p.status.toLowerCase() === 'delayed');
    if (delayed.length === 0) return 'No projects are currently marked as delayed in the database.';
    const list = delayed.map(p => 
      `• **${p.title}** (ID: \`${p.id}\`)\n  - **Status:** **Delayed**\n  - **Department:** ${p.department || 'N/A'}\n  - **Contractor:** ${p.contractor || 'N/A'}\n  - **Location:** ${p.addressText}\n  - **Planned Window:** ${p.plannedStartDate || 'TBD'} to ${p.plannedEndDate || 'TBD'}\n  - **Actual Start:** ${p.actualStartDate || 'Pending notice'}`
    ).join('\n\n');
    return `### Delayed Projects (${delayed.length})\n\n${list}\n\n*Verified from municipal project schedules.*`;
  }

  // 2. Ongoing / Active / In-progress / Schedule of ongoing projects
  const isScheduleQuery = lower.includes('schedule') || lower.includes('shedule') || lower.includes('timeline') || lower.includes('dates') || lower.includes('when') || lower.includes('calendar');
  const isOngoingQuery = lower.includes('ongoing') || lower.includes('active') || lower.includes('in progress') || lower.includes('current');

  if (isOngoingQuery || (isScheduleQuery && (lower.includes('all') || lower.includes('project') || lower.includes('ongoing')))) {
    const targetProjects = isOngoingQuery
      ? projects.filter(p => p.status.toLowerCase() === 'ongoing')
      : projects;

    if (targetProjects.length === 0) return 'No projects currently matching status "ongoing".';
    
    const list = targetProjects.map(p => 
      `• **${p.title}** (ID: \`${p.id}\`)\n  - **Status:** **${p.status.toUpperCase()}**\n  - **Department:** ${p.department || 'City Works'}\n  - **Contractor:** ${p.contractor || 'N/A'}\n  - **Location:** ${p.addressText}\n  - **Planned Schedule:** ${p.plannedStartDate || 'TBD'} → ${p.plannedEndDate || 'TBD'}\n  - **Actual Start:** ${p.actualStartDate || 'Pending'}`
    ).join('\n\n');
    
    return `### ${isOngoingQuery ? 'Ongoing Projects Schedule' : 'Public Works Schedule Overview'} (${targetProjects.length})\n\n${list}\n\n*Verified from municipal project records.*`;
  }

  // 3. Conflicts / Clashes / Overlaps
  if (lower.includes('conflict') || lower.includes('clash') || lower.includes('overlap') || lower.includes('coordination')) {
    if (conflicts.length === 0) return 'No physical or temporal coordination conflicts detected among current projects.';
    const list = conflicts.map(c => {
      const p1 = projects.find(p => p.id === c.projectIds[0]);
      const p2 = projects.find(p => p.id === c.projectIds[1]);
      const title1 = p1?.title || c.projectIds[0] || 'Project 1';
      const title2 = p2?.title || c.projectIds[1] || 'Project 2';
      const loc = p1?.addressText || p2?.addressText || 'Shared Corridor';
      return `• **${title1}** vs **${title2}**\n  - **Severity:** ${c.severity.toUpperCase()}\n  - **Reason:** ${c.reason}\n  - **Location:** ${loc}\n  - **Timing Basis:** ${c.temporalBasis || 'Overlapping excavation dates'}`;
    }).join('\n\n');
    return `### Active Coordination Clashes (${conflicts.length})\n\n${list}\n\n*Detected deterministically by spatial proximity and overlapping excavation dates.*`;
  }

  // 4. Specific project lookup by name, street, or keyword (e.g. "when will oak ave repaving complete")
  const scoredProjects = projects.map(p => {
    let score = 0;
    const titleL = p.title.toLowerCase();
    const addrL = p.addressText.toLowerCase();
    const descL = p.description.toLowerCase();
    const deptL = (p.department || '').toLowerCase();
    const contrL = (p.contractor || '').toLowerCase();
    const idL = p.id.toLowerCase();

    // Exact name/id match in prompt
    if (lower.includes(idL)) score += 15;
    if (lower.includes(titleL)) score += 15;

    // Check key phrases
    const keyPhrases = [
      'oak ave', 'oak avenue', 'main st', 'main street', 'civic center', 'broadway',
      'repaving', 'water main', 'fiber optic', 'storm drainage', 'substation', 'electric grid'
    ];
    for (const phrase of keyPhrases) {
      if (lower.includes(phrase)) {
        if (titleL.includes(phrase) || addrL.includes(phrase)) score += 8;
      }
    }

    // Token match
    const stopWords = new Set(['what', 'when', 'will', 'is', 'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for', 'give', 'me', 'show', 'tell', 'complete', 'finish', 'status', 'project', 'projects', 'shedule', 'schedule']);
    const promptWords = lower.replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
    for (const w of promptWords) {
      if (titleL.includes(w)) score += 3;
      if (addrL.includes(w)) score += 3;
      if (deptL.includes(w)) score += 2;
      if (contrL.includes(w)) score += 2;
      if (descL.includes(w)) score += 1;
    }

    return { project: p, score };
  }).filter(sp => sp.score > 0).sort((a, b) => b.score - a.score);

  if (scoredProjects.length > 0) {
    const top = scoredProjects[0].project;
    const isSpecific = scoredProjects[0].score >= 6 || scoredProjects.length === 1;

    if (isSpecific) {
      const projConflicts = conflicts.filter(c => c.projectIds.includes(top.id));
      let conflictNote = '';
      if (projConflicts.length > 0) {
        conflictNote = `\n\n⚠️ **Active Clashes Involving This Project (${projConflicts.length}):**\n` + projConflicts.map(c => `• ${c.reason} (Severity: ${c.severity})`).join('\n');
      }

      const completionInfo = top.actualEndDate
        ? `Completed on **${top.actualEndDate}**.`
        : top.status.toLowerCase() === 'delayed'
          ? `Originally planned for **${top.plannedEndDate || 'TBD'}**, but the project is currently **DELAYED** (Actual start: ${top.actualStartDate || 'pending'}). No revised completion date has been officially released.`
          : top.plannedEndDate
            ? `Planned completion on **${top.plannedEndDate}** (Current status: **${top.status}**).`
            : 'Completion date is currently unscheduled.';

      return `### ${top.title} (\`${top.id}\`)
- **Status:** **${top.status.toUpperCase()}**
- **Completion Schedule:** ${completionInfo}
- **Planned Dates:** ${top.plannedStartDate || 'TBD'} to ${top.plannedEndDate || 'TBD'}
- **Actual Dates:** Started ${top.actualStartDate || 'Not yet started'} | Ended ${top.actualEndDate || 'Not completed'}
- **Department:** ${top.department || 'N/A'}
- **Contractor:** ${top.contractor || 'N/A'}
- **Location:** ${top.addressText}
- **Work Type:** ${top.workType}${conflictNote}

*Source: Public Works Verified Database*`;
    }

    // Multiple potential matches
    const list = scoredProjects.slice(0, 5).map(sp => {
      const p = sp.project;
      return `• **${p.title}** (\`${p.id}\`): ${p.workType} work by ${p.department || 'City Works'} at ${p.addressText} [Status: **${p.status}**, Planned: ${p.plannedStartDate || 'TBD'} to ${p.plannedEndDate || 'TBD'}]`;
    }).join('\n\n');
    return `### Project Findings\n\n${list}\n\n*Queried from public works database.*`;
  }

  // 5. Department-specific fallback
  const depts = ['water', 'transportation', 'transit', 'stormwater', 'drainage', 'power', 'electric', 'technology'];
  const matchedDept = depts.find(d => lower.includes(d));
  if (matchedDept) {
    const deptProjects = projects.filter(p => 
      (p.department || '').toLowerCase().includes(matchedDept) ||
      p.workType.toLowerCase().includes(matchedDept)
    );
    if (deptProjects.length > 0) {
      const list = deptProjects.map(p => `• **${p.title}** (\`${p.id}\`): Status **${p.status}**, Location: ${p.addressText}`).join('\n');
      return `### Department Projects (${deptProjects.length})\n\n${list}`;
    }
  }

  // 6. Helpful overview if no specific match
  const ongoingCount = projects.filter(p => p.status.toLowerCase() === 'ongoing').length;
  const delayedCount = projects.filter(p => p.status.toLowerCase() === 'delayed').length;
  const plannedCount = projects.filter(p => p.status.toLowerCase() === 'planned').length;

  return `### Public Works Intelligence Status
Currently tracking **${projects.length} municipal projects** (${ongoingCount} ongoing, ${delayedCount} delayed, ${plannedCount} planned) and **${conflicts.length} active clashes**.

**Try asking:**
• *"Give me schedule of all ongoing projects"*
• *"When will Oak Ave repaving complete?"*
• *"What projects are delayed?"*
• *"Show conflicts on Main St"*
• *"Which projects are handled by the Water Bureau?"*`;
}

export async function POST(req: Request) {
  let prompt = '';
  try {
    const body = await req.json();
    prompt = body.prompt || '';
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!prompt.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const geminiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key or dummy key, use our intelligent deterministic agent
  if (!geminiKey || geminiKey.includes('dummy') || geminiKey.length < 15) {
    const fallbackText = await evaluateDeterministicResponse(prompt);
    return NextResponse.json({ text: fallbackText });
  }

  // Fetch current database snapshot to feed into system context and tools
  const { projects } = await getProjects();
  const conflicts = detectConflicts(projects);

  const projectSummary = projects.map(p =>
    `- [${p.id}] "${p.title}" | Status: ${p.status} | Dept: ${p.department || 'N/A'} | Contractor: ${p.contractor || 'N/A'} | Location: ${p.addressText} | Planned: ${p.plannedStartDate || 'TBD'} to ${p.plannedEndDate || 'TBD'} | Actual: ${p.actualStartDate || 'Not started'} to ${p.actualEndDate || 'Not finished'}`
  ).join('\n');

  const conflictSummary = conflicts.length > 0
    ? conflicts.map(c => `- Clash (${c.severity}): ${c.projectIds.join(' vs ')} -> ${c.reason}`).join('\n')
    : 'None detected';

  const systemInstruction = `You are Civorium Analyst, an expert public works and infrastructure coordination AI agent.
You assist city operators, contractors, and inspectors by answering questions about public works projects, schedules, contractors, delay analyses, and spatial/temporal excavation clashes.

CURRENT DATABASE SNAPSHOT:
Tracked Projects (${projects.length}):
${projectSummary}

Active Clashes (${conflicts.length}):
${conflictSummary}

INSTRUCTIONS:
1. Always base your answers on the verified database snapshot and tools.
2. If asked about schedules or completion dates, state the planned dates, actual progress dates, current status (e.g. Delayed, Ongoing, Planned), and whether completion is overdue or pending.
3. If asked about ongoing projects, clearly list all projects with status 'ongoing' along with their schedules and locations.
4. If asked about clashes or conflicts, explain which projects overlap, their severity, and why.
5. Format your output with clear Markdown headers, bold highlights, and bullet points. Always cite project titles and IDs (e.g. \`proj-3\`).`;

  const tools: any = [{
    functionDeclarations: [
      {
        name: 'searchProjects',
        description: 'Search for projects by query term, status, work type, or department.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            query: { type: Type.STRING },
            status: { type: Type.STRING },
            workType: { type: Type.STRING },
            department: { type: Type.STRING }
          }
        }
      },
      {
        name: 'getProjectDetails',
        description: 'Get full details of a specific project by ID.',
        parameters: {
          type: Type.OBJECT,
          properties: { projectId: { type: Type.STRING } },
          required: ['projectId'] as any
        }
      },
      {
        name: 'findConflicts',
        description: 'Check deterministic conflicts involving a specific project.',
        parameters: {
          type: Type.OBJECT,
          properties: { projectId: { type: Type.STRING } },
          required: ['projectId'] as any
        }
      }
    ]
  }];

  const ai = new GoogleGenAI({ apiKey: geminiKey });

  // Try candidate models in order to handle quota / availability resilience
  for (const model of CANDIDATE_MODELS) {
    try {
      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction,
          tools
        }
      });

      const response = await chat.sendMessage({ message: prompt });

      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        let toolData: any = {};
        try {
          if (call.name === 'searchProjects') toolData = await agentTools.searchProjects.execute(call.args as any);
          else if (call.name === 'getProjectDetails') toolData = await agentTools.getProjectDetails.execute(call.args as any);
          else if (call.name === 'findConflicts') toolData = await agentTools.findConflicts.execute(call.args as any);
        } catch (err: any) {
          toolData = { error: err.message };
        }

        try {
          const followup = await chat.sendMessage({
            message: [{
              functionResponse: {
                name: call.name,
                response: toolData
              }
            }]
          } as any);
          return NextResponse.json({ text: followup.text || JSON.stringify(toolData) });
        } catch {
          // If tool followup fails, format toolData directly
          return NextResponse.json({ 
            text: `### Query Result (${call.name})\n\`\`\`json\n${JSON.stringify(toolData, null, 2)}\n\`\`\`` 
          });
        }
      }

      if (response.text) {
        return NextResponse.json({ text: response.text });
      }
    } catch (modelError: any) {
      console.warn(`Model ${model} failed (${modelError.status || modelError.message}). Trying next candidate...`);
      // Continue to next candidate model
    }
  }

  // If all models failed or hit quota, use deterministic agent
  console.warn('All Gemini models exhausted or failed. Using deterministic fallback.');
  const fallbackText = await evaluateDeterministicResponse(prompt);
  return NextResponse.json({ text: fallbackText });
}
