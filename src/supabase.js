import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const makeMockQuery = () => {
  const mockPromise = Promise.resolve({ data: null, error: new Error('Supabase client not initialized') });
  const queryBuilder = {
    then: (onfulfilled, onrejected) => mockPromise.then(onfulfilled, onrejected),
    catch: (onrejected) => mockPromise.catch(onrejected),
    select: () => queryBuilder,
    insert: () => queryBuilder,
    update: () => queryBuilder,
    delete: () => queryBuilder,
    eq: () => queryBuilder,
    order: () => queryBuilder,
    limit: () => queryBuilder,
    single: () => queryBuilder
  };
  return queryBuilder;
};

let supabaseClient = null;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials are missing. Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
} else {
  try {
    if (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) {
      supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    } else {
      console.warn('Invalid VITE_SUPABASE_URL format.');
    }
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
  }
}

export const supabase = supabaseClient || {
  from: () => ({
    select: () => makeMockQuery(),
    insert: () => makeMockQuery(),
    update: () => makeMockQuery(),
    delete: () => makeMockQuery()
  }),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase client not initialized') }),
    signOut: () => Promise.resolve({ error: null })
  },
  storage: {
    from: () => ({
      list: () => Promise.resolve({ data: [], error: new Error('Supabase client not initialized') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      upload: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') }),
      remove: () => Promise.resolve({ data: null, error: new Error('Supabase client not initialized') })
    })
  }
};

