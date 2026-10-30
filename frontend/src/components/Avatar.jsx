import { initials } from '../utils/format';

export default function Avatar({ name, size = 'h-6 w-6 text-[10px]' }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800 ${size}`} title={name}>
      {initials(name)}
    </span>
  );
}
