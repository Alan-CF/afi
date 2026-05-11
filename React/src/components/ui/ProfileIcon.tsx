import type { UserProfileData } from '../../hooks/useProfile';
import { UserCircleIcon } from '@heroicons/react/24/solid';
import { useState } from 'react';

interface ProfileIconProps {
  className?: React.ComponentProps<'div'>['className'];
  user?: UserProfileData | null;
  userLoading?: boolean;
  userError?: Error | null;
  hasLoadedOnce?: boolean;
}

function getUserHexColor(userId: string) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += value.toString(16).padStart(2, '0');
  }
  return color;
}

function getInitial(username: string): string {
  return username?.charAt(0).toUpperCase() || '';
}

export default function ProfileIcon(profile: ProfileIconProps) {
  const [imageError, setImageError] = useState(false);

  // Show loading circle if loading
  if (profile.userLoading) {
    return (
      <div className={profile.className}>
        <div className="w-10 h-10 rounded-full border-2 border-gray-300 border-t-blue-500 animate-spin" />
      </div>
    );
  }

  // No user - show circle icon
  if (!profile.user) {
    return (
      <div className={profile.className}>
        <UserCircleIcon className="w-10 h-10 text-gray-400" />
      </div>
    );
  }

  // User has valid image - show image
  if (profile.user.avatar_url && !imageError) {
    return (
      <div className={profile.className}>
        <img
          src={profile.user.avatar_url}
          alt={profile.user.username || 'Profile'}
          className="w-10 h-10 rounded-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // User but no image or image failed - show first letter with color
  const initial = getInitial(profile.user.username || '');
  const backgroundColor = getUserHexColor(profile.user.id || '');

  return (
    <div className={profile.className}>
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
        style={{ backgroundColor }}
        title={profile.user.username || 'User'}
      >
        {initial}
      </div>
    </div>
  );
}
