import { JournalEntry } from '../types';
import { supabase } from './supabaseClient';

export const journalService = {
  getEntries: async (userId: string): Promise<JournalEntry[]> => {
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching entries:', error);
      throw new Error(error.message);
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      aiAnalysis: row.ai_analysis || undefined,
    }));
  },

  saveEntry: async (entry: JournalEntry): Promise<JournalEntry> => {
    const dbEntry = {
      id: entry.id,
      user_id: entry.userId,
      title: entry.title,
      content: entry.content,
      updated_at: new Date().toISOString(),
      created_at: entry.createdAt,
      ai_analysis: entry.aiAnalysis || null,
    };

    const { data, error } = await supabase
      .from('entries')
      .upsert(dbEntry)
      .select()
      .single();

    if (error) {
      console.error('Error saving entry:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      userId: data.user_id,
      title: data.title,
      content: data.content,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      aiAnalysis: data.ai_analysis || undefined,
    };
  },

  deleteEntry: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entry:', error);
      throw new Error(error.message);
    }
  }
};