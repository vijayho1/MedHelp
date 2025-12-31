import { Stethoscope } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ size = 'md' }: LogoProps) {
  const sizes = {
    sm: { icon: 20, text: 'text-lg' },
    md: { icon: 28, text: 'text-2xl' },
    lg: { icon: 36, text: 'text-3xl' },
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center rounded-lg bg-primary/10 p-1.5">
        <Stethoscope className="text-primary" size={sizes[size].icon} />
      </div>
      <span className={`font-bold text-gradient ${sizes[size].text}`}>
        MedHelp
      </span>
    </div>
  );
}
