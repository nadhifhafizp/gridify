import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import Features from "@/components/landing/features";
import HowItWorks from "@/components/landing/how-it-works";
import Footer from "@/components/landing/footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30 font-sans overflow-x-hidden">
      {/* Pass user session ke Navbar */}
      <Navbar user={user} />

      <main>
        <Hero />
        <Features />
        <HowItWorks />

        {/* Final CTA Section */}
        <section className="py-24 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-indigo-600/5"></div>
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px]"></div>

          <div className="max-w-3xl mx-auto text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Siap Menggelar Turnamen?
            </h2>
            <p className="text-xl text-slate-300 mb-10">
              Bergabunglah dengan komunitas organizer lainnya. Buat turnamen
              pertamamu sekarang, gratis!
            </p>

            {/* CTA Dynamic berdasarkan User */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {user ? (
                <Link
                  href="/dashboard/create"
                  className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all shadow-lg shadow-white/10 flex items-center justify-center gap-2"
                >
                  Buat Turnamen <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-8 py-4 rounded-xl bg-white text-slate-900 font-bold text-lg hover:bg-slate-100 transition-all shadow-lg shadow-white/10"
                  >
                    Daftar Gratis
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-4 rounded-xl bg-slate-800 text-white font-bold text-lg hover:bg-slate-700 transition-all border border-slate-700 flex items-center justify-center gap-2 group"
                  >
                    Login
                    <ArrowRight
                      size={18}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
