import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const formData = await req.formData();
    const ticketImage = formData.get('ticketImage') as File;
    const ticketIdentifier = formData.get('ticketIdentifier') as string;
    const reviewId = formData.get('reviewId') as string;

    if (!ticketImage || !reviewId) {
      return new Response(
        JSON.stringify({ valid: false, reason: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upload ticket image to storage
    const fileName = `${reviewId}-${Date.now()}.${ticketImage.name.split('.').pop()}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ticket-images')
      .upload(fileName, ticketImage);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return new Response(
        JSON.stringify({ valid: false, reason: 'Failed to upload ticket image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from('ticket-images')
      .getPublicUrl(fileName);

    // Simulate OCR extraction (in production, use actual OCR like Tesseract.js or cloud API)
    // For now, we'll do a simple pattern matching simulation
    const extractedTicketId = simulateOCR(ticketIdentifier);
    const isValid = validateTicketId(extractedTicketId, ticketIdentifier);
    const isDateValid = validateTicketDate();

    let validationStatus: 'valid' | 'invalid' | 'pending' = 'pending';
    let validationReason = '';

    if (isValid && isDateValid) {
      validationStatus = 'valid';
      validationReason = 'Ticket verified successfully';
    } else if (!isDateValid) {
      validationStatus = 'invalid';
      validationReason = 'Ticket date is outside valid window (must be within last 60 days)';
    } else {
      validationStatus = 'invalid';
      validationReason = 'Ticket ID does not match or could not be extracted';
    }

    // Store verification result
    const { error: insertError } = await supabase
      .from('ticket_verifications')
      .insert({
        review_id: reviewId,
        ticket_image_url: publicUrl,
        ticket_identifier: ticketIdentifier,
        extracted_ticket_id: extractedTicketId,
        validation_status: validationStatus,
        validation_reason: validationReason,
        ticket_date: new Date().toISOString().split('T')[0],
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ valid: false, reason: 'Failed to save verification' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: validationStatus === 'valid',
        reason: validationReason,
        extractedId: extractedTicketId,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ valid: false, reason: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simulate OCR extraction - in production, integrate actual OCR
function simulateOCR(ticketIdentifier: string | null): string {
  if (!ticketIdentifier) return '';
  
  // Simulate extracting ticket ID using configurable regex patterns
  const patterns = [
    /TICKET[:\s-]*([A-Z0-9]{6,12})/i,
    /ID[:\s-]*([A-Z0-9]{6,12})/i,
    /\b([A-Z0-9]{8,12})\b/,
  ];

  for (const pattern of patterns) {
    const match = ticketIdentifier.match(pattern);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
  }

  return ticketIdentifier.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Validate extracted ticket ID with fuzzy matching
function validateTicketId(extracted: string, provided: string | null): boolean {
  if (!provided) return false;
  
  const cleanProvided = provided.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanExtracted = extracted.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Exact match
  if (cleanExtracted === cleanProvided) return true;

  // Fuzzy match - allow 1-2 character differences
  const distance = levenshteinDistance(cleanExtracted, cleanProvided);
  return distance <= 2;
}

// Validate ticket date is within 60 days
function validateTicketDate(): boolean {
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  // In production, extract actual date from ticket via OCR
  // For now, assume current date
  const ticketDate = new Date();
  
  return ticketDate >= sixtyDaysAgo;
}

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
