import { createClient } from '@supabase/supabase-js';
import { CAMPUS_DOCUMENTS } from '../data/campusDocuments';
import { CAMPUS_BUILDINGS } from '../data/campusBuildings';
import { INITIAL_STAFF_ESCALATIONS, INITIAL_STUDENT_HISTORY } from '../data/initialHistory';
import { getStoredDocuments, getStoredEscalations, getStoredHistory } from './storage';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';
const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    supabaseUrl !== 'https://your-project.supabase.co' &&
    !supabaseUrl.includes('placeholder')
  );
};

// Create client instance (or dummy null if unconfigured)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch Campus Documents from Supabase or fallback to storage
 */
export async function getCampusDocumentsFromDB() {
  if (!isSupabaseConfigured() || !supabase) {
    return getStoredDocuments();
  }

  try {
    const { data, error } = await supabase
      .from('campus_documents')
      .select('*')
      .eq('is_active', true)
      .order('title', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase fetch failed or empty, falling back to local dataset', error);
      return getStoredDocuments();
    }

    return data.map(d => ({
      id: d.id,
      code: d.code,
      title: d.title,
      category: d.category,
      sourceType: d.source_type,
      uploadDate: d.upload_date,
      clause: d.clause,
      pageNumber: d.page_number,
      buildingId: d.building_id,
      isActive: d.is_active,
      summary: d.summary,
      content: d.content,
      keywords: d.keywords || []
    }));
  } catch (err) {
    console.error('Error fetching documents from Supabase:', err);
    return getStoredDocuments();
  }
}

/**
 * Fetch Campus Buildings from Supabase or fallback
 */
export async function getCampusBuildingsFromDB() {
  if (!isSupabaseConfigured() || !supabase) {
    return CAMPUS_BUILDINGS;
  }

  try {
    const { data, error } = await supabase
      .from('campus_buildings')
      .select('*')
      .order('number', { ascending: true });

    if (error || !data || data.length === 0) {
      return CAMPUS_BUILDINGS;
    }

    return data.map(b => ({
      id: b.id,
      number: b.number,
      name: b.name,
      code: b.code,
      category: b.category,
      shortDescription: b.short_description,
      fullDescription: b.full_description,
      venues: b.venues || [],
      offices: b.offices || [],
      timings: b.timings,
      svg: b.svg_layout
    }));
  } catch (err) {
    console.error('Error fetching buildings from Supabase:', err);
    return CAMPUS_BUILDINGS;
  }
}

/**
 * Record a question and its verified answer in Supabase
 */
export async function saveQuestionToDB(questionData) {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const qId = questionData.id || `q-${Date.now()}`;
    const { error: qError } = await supabase
      .from('questions')
      .insert([{
        id: qId,
        student_name: questionData.studentName || 'Student User',
        query_text: questionData.question,
        category: questionData.category || 'General',
        status: questionData.status || 'ANSWERED',
        confidence_score: questionData.confidenceScore || 0,
        is_above_floor: questionData.confidenceScore >= 75,
        escalation_reason: questionData.escalationReason || null
      }]);

    if (qError) {
      console.warn('Error saving question to Supabase:', qError);
      return null;
    }

    // Save corresponding answer record if present
    if (questionData.answer) {
      await supabase
        .from('answers')
        .insert([{
          question_id: qId,
          answer_text: questionData.answer,
          confidence_score: questionData.confidenceScore || 0,
          doc_code: questionData.citation?.docCode || null,
          doc_title: questionData.citation?.docTitle || null,
          clause: questionData.citation?.clause || null,
          page_number: questionData.citation?.page || null,
          excerpt: questionData.citation?.excerpt || null,
          action_id: questionData.actionId || null
        }]);
    }

    return qId;
  } catch (err) {
    console.error('Failed to write to Supabase questions table', err);
    return null;
  }
}

/**
 * Save low-confidence question to Supabase escalations
 */
export async function saveEscalationToDB(esc) {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { error } = await supabase
      .from('escalations')
      .insert([{
        id: esc.id,
        student_name: esc.studentName || 'Student User',
        query_text: esc.question,
        category: esc.category || 'General',
        confidence_score: esc.confidenceScore,
        retrieved_weak_matches: esc.retrievedWeakMatches || [],
        escalation_reason: esc.escalationReason,
        status: 'PENDING'
      }]);

    if (error) console.warn('Supabase escalation insert error:', error);
  } catch (err) {
    console.error('Failed to insert escalation into Supabase', err);
  }
}
