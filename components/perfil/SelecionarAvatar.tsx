'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';

export const AVATARES = [
  { id: 'aria', name: 'Aria', image: '/avatars/Aria.png' },
  { id: 'astra', name: 'Astra', image: '/avatars/Astra.png' },
  { id: 'ignis', name: 'Ignis', image: '/avatars/Ignis.png' },
  { id: 'kira', name: 'Kira', image: '/avatars/Kira.png' },
  { id: 'koby', name: 'Koby', image: '/avatars/Koby.png' },
  { id: 'maya', name: 'Maya', image: '/avatars/Maya.png' },
  { id: 'nyx', name: 'Nyx', image: '/avatars/Nyx.png' },
  { id: 'orion', name: 'Orion', image: '/avatars/Orion.png' },
];

interface SeletorAvataresProps {
  selectedAvatar: string;
  onSelect: (image: string) => void;
}

export function SeletorAvatares({ selectedAvatar, onSelect }: SeletorAvataresProps) {
  return (
    <div className="grid grid-cols-4 gap-3">
      {AVATARES.map((avatar) => (
        <button
          key={avatar.id}
          type="button"
          onClick={() => onSelect(avatar.image)}
          className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
            selectedAvatar === avatar.image 
              ? 'border-accent ring-4 ring-accent/20' 
              : 'border-border hover:border-accent/50'
          }`}
        >
          <Image src={avatar.image} alt={avatar.name} fill className="object-cover" />
          {selectedAvatar === avatar.image && (
            <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
              <Check className="text-white drop-shadow-md" size={24} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}