// hooks/use-user-data.ts
import { supabaseClient } from '@/utils/supabaseClient';
import { useEffect, useState } from 'react';

// Tipe ini SEKARANG SESUAI dengan error TypeScript Anda
type FormattedUser = {
  fullName: string | null;
  imageUrl: string | undefined;
  emailAddresses: {
    emailAddress: string;
  }[];
};

export function useUserData() {
  const [user, setUser] = useState<FormattedUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      setLoading(true);

      // 1. Dapatkan auth user
      const { data: authData, error: authError } = await supabaseClient.auth.getUser();
      if (authError || !authData.user) {
        setLoading(false);
        return;
      }

      const authUser = authData.user;

      // 2. Dapatkan profil publik
      const { data: profile, error: profileError } = await supabaseClient
        .from('users') // Tabel public.users Anda
        .select('full_name, avatar_url') // Ambil full_name, sesuai skema Anda
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
        setLoading(false);
        return;
      }

      // 3. Format data agar sesuai dengan kebutuhan komponen
      const formattedUser: FormattedUser = {
        fullName: profile.full_name,
        // 2. Konversi `null` menjadi `undefined`
        imageUrl: profile.avatar_url || undefined,
        emailAddresses: authUser.email ? [{ emailAddress: authUser.email }] : [],
      };

      setUser(formattedUser);
      setLoading(false);
    }

    loadUserData();
  }, []);

  return { user, loading };
}