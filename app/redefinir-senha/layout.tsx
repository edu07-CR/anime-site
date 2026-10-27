import { Suspense } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div>Carregando...</div>}>{children}</Suspense>;
}