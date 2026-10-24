import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-surface/50 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted">
        <p>© {new Date().getFullYear()} AniVerse. Todos os direitos reservados.</p>
        
        <div className="flex items-center gap-4">
          <Link href="/termos" className="hover:text-accent transition-colors">Termos de Uso</Link>
          <Link href="/privacidade" className="hover:text-accent transition-colors">Política de Privacidade</Link>
        </div>
      </div>
    </footer>
  );
}