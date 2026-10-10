import { NextResponse } from 'next/server';
import { extractText } from 'unpdf';
import { GoogleGenAI, Type } from '@google/genai';
import { z } from 'zod';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || 'dummy' });

// We define the schema for structured extraction
const ExtractionSchema = z.object({
  title: z.string().describe('Title of the project or notice'),
  description: z.string().describe('Short description of the work'),
  department: z.string().nullable().describe('Responsible department (null if unknown)'),
  contractor: z.string().nullable().describe('Contractor (null if unknown)'),
  plannedStartDate: z.string().nullable().describe('Planned start date YYYY-MM-DD'),
  plannedEndDate: z.string().nullable().describe('Planned end date YYYY-MM-DD'),
  addressText: z.string().describe('Human-readable address or location'),
  uncertainFields: z.array(z.string()).describe('List of fields that were inferred or are uncertain'),
});

export async function POST(req: Request) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI provider is not configured. (Missing GEMINI_API_KEY)' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }
    
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    
    // Extract text with unpdf
    let text = '';
    try {
      const result = await extractText(new Uint8Array(arrayBuffer));
      text = Array.isArray(result.text) ? result.text.join('\n') : (result.text || '');
    } catch (e) {
      return NextResponse.json({ error: 'Failed to parse PDF or document is encrypted/malformed.' }, { status: 400 });
    }

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'PDF contains no extractable text. Scanned documents without OCR are not supported.' }, { status: 400 });
    }

    // Use Gemini for structured extraction
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Extract project details from the following public notice text. Do not invent any values.\n\nText:\n${text.substring(0, 15000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            department: { type: Type.STRING, nullable: true },
            contractor: { type: Type.STRING, nullable: true },
            plannedStartDate: { type: Type.STRING, nullable: true },
            plannedEndDate: { type: Type.STRING, nullable: true },
            addressText: { type: Type.STRING },
            uncertainFields: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['title', 'description', 'addressText', 'uncertainFields'] as any
        }
      }
    });

    if (!response.text) {
      throw new Error('Model returned empty response');
    }

    const parsedJson = JSON.parse(response.text);
    
    // Validate with Zod so bad AI outputs don't corrupt our database
    const validated = ExtractionSchema.parse(parsedJson);

    // If the frontend asked us to save directly to Supabase / local DB
    const autoSave = formData.get('saveToDb') === 'true';
    let savedProject = null;

    if (autoSave) {
      const { createProject } = await import('@/lib/db');
      const saveResult = await createProject({
        title: validated.title,
        description: validated.description,
        department: validated.department || 'Public Notice Board',
        contractor: validated.contractor || 'Assigned Contractor',
        workType: 'road',
        status: 'planned',
        plannedStartDate: validated.plannedStartDate,
        plannedEndDate: validated.plannedEndDate,
        addressText: validated.addressText,
        sourceIds: [file.name],
        dataOrigin: 'public',
      });
      savedProject = saveResult.project;
    }

    return NextResponse.json({
      success: true,
      data: validated,
      savedProject,
      sourceTitle: file.name,
      extractedTextPreview: text.substring(0, 200) + '...'
    });

  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during notice ingestion.' },
      { status: 500 }
    );
  }
}
