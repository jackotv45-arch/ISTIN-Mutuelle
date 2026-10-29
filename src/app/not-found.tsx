import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-40 pb-20">
        <div className="container-main text-center max-w-md mx-auto">
          <p className="font-heading text-6xl font-bold text-istin-blue mb-2">404</p>
          <h1 className="font-heading text-2xl font-semibold text-foreground mb-3">
            Page introuvable
          </h1>
          <p className="text-muted-foreground mb-8">
            La page demandée n&apos;existe pas ou a été déplacée.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 px-6 items-center justify-center rounded-xl bg-istin-blue text-white font-semibold text-sm hover:bg-istin-blue-dark transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
