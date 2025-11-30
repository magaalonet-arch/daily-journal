import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snlykdvznxjsgviwqyii.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNubHlrZHZ6bnhqc2d2aXdxeWlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTQ5MjIsImV4cCI6MjA4MDA5MDkyMn0.erLNmeuVLl_7XpfA4d4rR85OBvwuvcq_HNsbHI2WBvk';

export const supabase = createClient(supabaseUrl, supabaseKey);