import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import { agentTools } from '@/lib/agent-tools';
import { getProjects } from '@/lib/db';
import { detectConflicts } from '@/lib/conflicts';

// deterministic fallback if gemini is unavailable or errors out
async function evaluateDeterministicResponse(prompt: string): Promise<string> {
  const lower = prompt.toLowerCase();
  const { projects } = await getProjects();
  const conflicts = detectConflicts(projects);

  if (lower.includes('delayed') || lower.includes('delay')) {
    const delayed = projects.filter(p => p.status.toLowerCase() === 'delayed');
    if (delayed.length === 0) return 'No projects are currently marked as delayed in the database.';
    const list = delayed.map(p => `• **${p.title}** (ID: \`${p.id}\`) — Dept: ${p.department || 'N/A'}, Address: ${p.addressText}. Status: **Delayed**`).join('\n');
    return `### Delayed Projects (${delayed.length})\n${list}\n\n*Note: Derived deterministically from verified project schedule records.*`;
  }

  if (lower.includes('conflict') || lower.includes('clash') || lower.includes('overlap')) {
    if (conflicts.length === 0) return 'No physical or temporal coordination conflicts detected among current projects.';
    const list = conflicts.map(c => `• **${c.project1Title}** (${c.department1}) vs **${c.project2Title}** (${c.department2})\n  - Reason: ${c.reason}\n  - Location: ${c.addressText}`).join('\n\n');
    return `### Active Coordination Clashes (${conflicts.length})\n${list}\n\n*Note: Detected deterministically based on physical proximity and overlapping excavation dates.*`;
  }

  // search matching projects
  const matched = projects.filter(p =>
    p.title.toLowerCase().includes(lower) ||
    p.addressText.toLowerCase().includes(lower) ||
    p.department?.toLowerCase().includes(lower) ||
    p.workType.toLowerCase().includes(lower)
  );

  if (matched.length > 0) {
    const list = matched.slice(0, 5).map(p => `• **${p.title}** (\`${p.id}\`): ${p.workType} work by ${p.department || 'City Works'} at ${p.addressText} [Status: ${p.status}]`).join('\n');
    return `### Project Findings\n${list}\n\n*Queried from public works database.*`;
  }

  return `I reviewed the public works database (${projects.length} tracked projects, ${conflicts.length} active clashes). Try asking: "What projects are delayed?", "Show conflicts on Main St", or ask about specific departments like Water or Transportation.`;
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

  // if no api key or dummy key, use deterministic agent
  if (!geminiKey || geminiKey.includes('dummy') || geminiKey.length < 15) {
    const fallbackText = await evaluateDeterministicResponse(prompt);
    return NextResponse.json({ text: fallbackText });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const chat = ai.chats.create({
      model: 'gemini-3.8-flash',
      config: {
        systemInstruction: `You are a bounded read-only coordination agent for CivicTech.
          You investigate public works projects using tools.
          Rules:
          1. Only use tools provided.
          2. Base answers on tool findings.
          3. Cite project IDs and titles in responses.`,
        tools: [{
          functionDeclarations: [
            {
              name: 'searchProjects',
              description: 'Search for projects by status, work type, or department.',
              parameters: {
                type: Type.OBJECT,
                properties: {
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
        }]
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
        // if followup fails, format toolData directly
        const fallback = await evaluateDeterministicResponse(prompt);
        return NextResponse.json({ text: fallback });
      }
    }

    if (response.text) {
      return NextResponse.json({ text: response.text });
    }

    const fallback = await evaluateDeterministicResponse(prompt);
    return NextResponse.json({ text: fallback });
  } catch (error: any) {
    console.warn('Gemini API call failed, falling back to deterministic agent:', error.message);
    const fallbackText = await evaluateDeterministicResponse(prompt);
    return NextResponse.json({ text: fallbackText });
  }
}

