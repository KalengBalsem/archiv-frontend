'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/utils/supabaseClient'; // Pastikan path ini benar
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { UserAvatarProfile } from '@/components/user-avatar-profile';

export function UserNav() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // 1. Ambil user saat komponen dimuat
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabaseClient.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  // 2. Fungsi Logout Manual
  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/login'); // Redirect ke halaman login
    router.refresh();
  };

  if (!user) return null; // Atau tampilkan Skeleton/Loading

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
           {/* Pastikan UserAvatarProfile bisa menerima object User dari supabaseClient */}
          <UserAvatarProfile
            user={{
              imageUrl: user.user_metadata?.avatar_url,
              fullName: user.user_metadata?.full_name ?? null,
              emailAddresses: [{ emailAddress: user.email ?? '' }]
            }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' sideOffset={10} forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>
              {/* supabaseClient menyimpan nama di user_metadata, atau fallback ke email */}
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className='text-muted-foreground text-xs leading-none'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/profile')}>
            Profile
          </DropdownMenuItem>
          {/* <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem> */}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}