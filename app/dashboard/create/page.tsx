import { createClient } from "@/lib/supabase/server";
import CreateTournamentForm from "@/features/tournaments/components/create-tournament-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function CreateTournamentPage() {
  const supabase = await createClient();

  // Ambil list game dari database (Master Data yang pernah kita bahas)
  const { data: games } = await supabase.from("games").select("*");

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Back */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-4 gap-2 text-sm"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Setup New Tournament</h1>
        <p className="text-slate-400">
          Konfigurasi dasar untuk memulai kompetisi baru.
        </p>
      </div>

      {/* Render Form */}
      <CreateTournamentForm games={games || []} />
    </div>
  );
}
