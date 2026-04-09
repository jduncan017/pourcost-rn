/**
 * Supabase Edge Function: extract-invoice
 *
 * Downloads invoice images from Supabase Storage and sends them to
 * Gemini 2.5 Flash for structured line item extraction via vision.
 *
 * This replaces the separate OCR + Claude text extraction pipeline
 * with a single vision call that sees the actual invoice layout.
 *
 * Environment variables required:
 *   GEMINI_API_KEY — Google AI API key with Gemini access
 *   (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected)
 *
 * Request body:
 *   { storagePaths: string[], systemPrompt: string, userPrompt: string }
 *
 * Response:
 *   Parsed JSON from Gemini's structured extraction
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  if (!GEMINI_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { storagePaths, systemPrompt, userPrompt } = await req.json();

    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'storagePaths must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Download images and convert to base64
    const imageParts: { inlineData: { mimeType: string; data: string } }[] = [];

    for (const path of storagePaths) {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('invoices')
        .download(path);

      if (dlError || !fileData) {
        console.error(`Failed to download ${path}:`, dlError?.message);
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((s, byte) => s + String.fromCharCode(byte), '')
      );

      const ext = path.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      imageParts.push({
        inlineData: { mimeType, data: base64 },
      });
    }

    if (imageParts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No images could be downloaded from storage' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Build Gemini request
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiBody = {
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          parts: [
            ...imageParts,
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
      },
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${geminiResponse.status}`, details: errText }),
        { status: geminiResponse.status, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const geminiResult = await geminiResponse.json();

    // Extract text from Gemini response
    const textContent = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!textContent) {
      return new Response(
        JSON.stringify({ error: 'Gemini returned empty response' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // Gemini with responseMimeType 'application/json' returns valid JSON text.
    // Pass it through directly — don't re-serialize (avoids double-encoding issues).
    // Strip markdown fences just in case.
    let cleaned = textContent.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    // Return as text/plain so the client's supabase.functions.invoke
    // doesn't try to auto-parse (Hermes JSON parser is stricter than V8).
    // The client-side parseExtractionResponse handles string parsing.
    return new Response(cleaned, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
