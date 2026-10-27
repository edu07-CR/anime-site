import { ShieldCheck } from 'lucide-react';

export function SeloAdmin() {
  return (
    <div className="group relative flex items-center">
      <ShieldCheck 
        size={16} 
        className="text-accent fill-accent/20" 
      />
      {/* Tooltip que aparece ao passar o mouse */}
      <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
        Administrador
      </span>
    </div>
  );
}