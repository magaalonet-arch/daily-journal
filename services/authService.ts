import { User } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  login: async (email: string, password?: string): Promise<User> => {
    if (!password) throw new Error('Password is required');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Login failed');
    }

    return {
      id: data.user.id,
      email: data.user.email!,
      name: data.user.user_metadata?.name || 'User',
    };
  },

  signup: async (email: string, name: string, password?: string): Promise<User> => {
    if (!password) throw new Error('Password is required');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Signup failed');
    }

    // Note: By default Supabase requires email confirmation. 
    // If disabled in project settings, user is returned immediately.
    // If enabled, user session might be null until confirmed.
    
    return {
      id: data.user.id,
      email: data.user.email!,
      name: name,
    };
  },

  getCurrentUser: async (): Promise<User | null> => {
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      return {
        id: data.session.user.id,
        email: data.session.user.email!,
        name: data.session.user.user_metadata?.name || 'User',
      };
    }
    return null;
  },

  logout: async (): Promise<void> => {
    await supabase.auth.signOut();
  }
};