export function ScoreIndicator({ score, size = 'md' }) {
  const color =
    score >= 80 ? 'text-green-700 bg-green-100 ring-green-600/20' :
    score >= 60 ? 'text-yellow-700 bg-yellow-100 ring-yellow-600/20' :
    score >= 40 ? 'text-orange-700 bg-orange-100 ring-orange-600/20' :
                  'text-red-700 bg-red-100 ring-red-600/20';

  const sizes = {
    sm: 'text-xs px-2 py-0.5 min-w-[44px]',
    md: 'text-sm px-2.5 py-1 min-w-[52px]',
    lg: 'text-2xl font-bold px-4 py-2 min-w-[72px]',
  };

  if (score == null) return <span className="text-gray-400 text-sm">—</span>;

  return (
    <span className={`inline-flex items-center justify-center rounded-full font-semibold ring-1 ring-inset ${color} ${sizes[size]}`}>
      {score}
    </span>
  );
}
