/**
 * Supabase Edge Function: ocr-invoice
 *
 * Fetches an invoice image from Supabase Storage and sends it to
 * Google Cloud Vision API for OCR text extraction.
 *
 * Environment variables required (set via Supabase dashboard):
 *   GOOGLE_VISION_API_KEY — Google Cloud API key with Vision API enabled
 *   SUPABASE_SERVICE_ROLE_KEY — for accessing Storage from the Edge Function
 *   SUPABASE_URL — auto-injected by Supabase
 *
 * Request body:
 *   { storagePaths: string[] }   — array of Supabase Storage paths
 *
 * Response:
 *   { pages: { path: string; text: string; error?: string }[] }
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const VISION_API_URL = `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`;

// Service role client for Storage access
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

  if (!GOOGLE_VISION_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'GOOGLE_VISION_API_KEY not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }

  try {
    const { storagePaths } = await req.json();

    if (!Array.isArray(storagePaths) || storagePaths.length === 0) {
      return new Response(
        JSON.stringify({ error: 'storagePaths must be a non-empty array' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const pages: { path: string; text: string; error?: string }[] = [];

    for (const storagePath of storagePaths) {
      try {
        // Download image from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('invoices')
          .download(storagePath);

        if (downloadError || !fileData) {
          pages.push({ path: storagePath, text: '', error: `Download failed: ${downloadError?.message}` });
          continue;
        }

        // Convert to base64
        const arrayBuffer = await fileData.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        );

        // Call Google Vision API
        const visionResponse = await fetch(VISION_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [
              {
                image: { content: base64 },
                features: [
                  { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
                ],
              },
            ],
          }),
        });

        if (!visionResponse.ok) {
          const errText = await visionResponse.text();
          pages.push({ path: storagePath, text: '', error: `Vision API error: ${visionResponse.status} ${errText}` });
          continue;
        }

        const visionResult = await visionResponse.json();
        const annotation = visionResult.responses?.[0]?.fullTextAnnotation;
        const text = annotation?.text ?? '';

        pages.push({ path: storagePath, text });
      } catch (err) {
        pages.push({
          path: storagePath,
          text: '',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Combine all page texts into one
    const combinedText = pages
      .map(p => p.text)
      .filter(Boolean)
      .join('\n\n--- PAGE BREAK ---\n\n');

    return new Response(
      JSON.stringify({ pages, combinedText }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
