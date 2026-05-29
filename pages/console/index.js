import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ConsoleIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/console/pipeline');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-white font-mono text-xs uppercase tracking-widest">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
        <span>Redirecting to Console...</span>
      </div>
    </div>
  );
}
