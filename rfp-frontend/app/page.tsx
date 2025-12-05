// app/page.tsx
import RfpCreator from "@/components/RfpCreator";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI-Powered RFP Creator</h1>
          <p className="text-slate-600">
            Start by describing what you want to procure in natural language. Later, this will
            call the backend to generate a structured RFP using Artifical Intelligence.
          </p>
        </header>

        <section className="border rounded-2xl bg-white shadow-sm p-5">
          <RfpCreator />
        </section>
      </div>
    </main>
  );
}