import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [authError, setAuthError] = useState(null);

  // ── Derived flags ─────────────────────────────────────────────────────────
  const isAuthenticated = Boolean(user);
  const isStaff  = profile?.role === 'staff'  || profile?.role === 'admin';
  const isAdmin  = profile?.role === 'admin';

  // ── Fetch or auto-initialize profile in Supabase ──────────────────────────
  const fetchProfile = useCallback(async (userId, userMetadata = null, userEmail = null) => {
    if (!supabase || !userId) return null;
    try {
      // 1. Check if profile exists by user id
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch warning:', error.message);
      }

      // 2. If not found by ID, also check by email to safely link existing accounts
      if (!data && userEmail) {
        const { data: existingByEmail } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', userEmail.trim().toLowerCase())
          .maybeSingle();

        if (existingByEmail) {
          data = existingByEmail;
        }
      }

      // 3. If profile already exists, preserve all fields (including existing staff role)
      if (data) {
        setProfile(data);
        return data;
      }

      // 4. Create new student profile (Google OAuth or email registration)
      const resolvedName =
        userMetadata?.full_name ||
        userMetadata?.name ||
        userMetadata?.user_name ||
        (userEmail ? userEmail.split('@')[0] : 'Student User');

      const resolvedAvatar =
        userMetadata?.avatar_url ||
        userMetadata?.picture ||
        null;

      const newProfile = {
        id: userId,
        email: (userEmail || '').trim().toLowerCase(),
        full_name: resolvedName,
        role: 'student', // Strictly assign student role; never grant staff privileges
        profile_picture_url: resolvedAvatar,
        notification_preferences: {
          email_notifications: true,
          in_app_notifications: true,
          campus_announcements: true,
        },
        privacy_settings: {
          profile_visibility: 'private',
        },
        last_login: new Date().toISOString(),
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .upsert(newProfile, { onConflict: 'id' })
        .select()
        .maybeSingle();

      if (!insertError && inserted) {
        setProfile(inserted);
        return inserted;
      } else {
        // Fallback to local profile state so student can seamlessly access their dashboard
        setProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.error('fetchProfile error:', err);
    }
  }, []);

  // ── Bootstrap auth session on mount ──────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user.id, session.user.user_metadata, session.user.email);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    }).catch(err => {
      console.error('getSession error:', err);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id, session.user.user_metadata, session.user.email);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ── Sign In (Email + Password) ────────────────────────────────────────────
  const signIn = async ({ email, password }) => {
    setAuthError(null);
    if (!supabase) {
      const msg = 'Database connection is not configured.';
      setAuthError(msg);
      return { error: { message: msg } };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error) {
      setAuthError(error.message);
      return { error };
    }

    if (data?.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, data.user.user_metadata, data.user.email);
    }

    return { data, error: null };
  };

  // ── Sign Up (Create Account) ──────────────────────────────────────────────
  const signUp = async ({ email, password, fullName }) => {
    setAuthError(null);
    if (!supabase) {
      const msg = 'Database connection is not configured.';
      setAuthError(msg);
      return { error: { message: msg } };
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
        },
      },
    });

    if (error) {
      setAuthError(error.message);
      return { error };
    }

    // Check if email confirmation is required or if a session was created immediately
    const sessionActive = Boolean(data?.session);
    const userCreated   = Boolean(data?.user);

    if (sessionActive && data.user) {
      setUser(data.user);
      await fetchProfile(data.user.id, { full_name: fullName.trim() }, data.user.email);
    }

    return {
      data,
      sessionActive,
      userCreated,
      needsVerification: userCreated && !sessionActive,
      error: null,
    };
  };

  // ── Google OAuth ──────────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setAuthError(null);
    if (!supabase) {
      const msg = 'Database connection is not configured.';
      setAuthError(msg);
      return { error: { message: msg } };
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      setAuthError(error.message);
      return { error };
    }
    return { data, error: null };
  };

  // ── Sign Out ──────────────────────────────────────────────────────────────
  const signOut = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut error/warning:', err);
    } finally {
      setUser(null);
      setProfile(null);
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('sb-') || key.includes('supabase.auth.token'))) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {}
    }
  };

  // ── Password Reset ────────────────────────────────────────────────────────
  const resetPassword = async (email) => {
    if (!supabase) return { error: { message: 'Database connection is not configured.' } };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}?page=reset-password`,
    });
    return { error };
  };

  // ── Update Profile Fields ─────────────────────────────────────────────────
  const updateProfile = async (fields) => {
    if (!supabase || !user) return { error: { message: 'Not authenticated' } };

    // Prevent changing role from student to staff/admin via client
    const safeFields = { ...fields };
    delete safeFields.role;
    delete safeFields.id;

    const { data, error } = await supabase
      .from('profiles')
      .update({ ...safeFields, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    return { data, error };
  };

  // ── Upload Profile Picture (Supabase Storage) ─────────────────────────────
  const uploadProfilePicture = async (file) => {
    if (!user || !supabase) return { error: { message: 'Not authenticated' } };

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { error: { message: 'Only JPEG, PNG, and WebP images are allowed.' } };
    }
    if (file.size > 2 * 1024 * 1024) {
      return { error: { message: 'Image must be under 2 MB.' } };
    }

    const ext = file.name.split('.').pop();
    const filePath = `avatars/${user.id}/avatar.${ext}`;

    await supabase.storage
      .from('avatars')
      .remove([`avatars/${user.id}/avatar.jpg`, `avatars/${user.id}/avatar.png`, `avatars/${user.id}/avatar.webp`]);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) return { error: uploadError };

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const publicUrl = urlData?.publicUrl;

    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: publicUrl,
        profile_picture_path: filePath,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!profileError) {
      setProfile(prev => ({ ...prev, profile_picture_url: publicUrl, profile_picture_path: filePath }));
    }

    return { url: publicUrl, error: profileError };
  };

  // ── Remove Profile Picture ────────────────────────────────────────────────
  const removeProfilePicture = async () => {
    if (!user || !supabase) return { error: { message: 'Not authenticated' } };

    if (profile?.profile_picture_path) {
      await supabase.storage.from('avatars').remove([profile.profile_picture_path]);
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        profile_picture_url: null,
        profile_picture_path: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => ({ ...prev, profile_picture_url: null, profile_picture_path: null }));
    }

    return { error };
  };

  const value = {
    user,
    profile,
    loading,
    authError,
    isAuthenticated,
    isStaff,
    isAdmin,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    refreshProfile: () => user && fetchProfile(user.id),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}

export default AuthContext;
