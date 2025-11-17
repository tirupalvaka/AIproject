// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-slate-900">
          Digital Readiness Workspace
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Open <code className="rounded bg-slate-100 px-1 py-0.5">/digital-readiness</code> to view the live score.
        </p>
      </div>
    </main>
  );
}

