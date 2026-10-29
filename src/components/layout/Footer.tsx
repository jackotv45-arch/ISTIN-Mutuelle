import Link from "next/link";
import Image from "next/image";
import { FooterStudentCta } from "@/components/layout/FooterStudentCta";

export function Footer() {
  return (
    <footer className="bg-[#062a4a] text-white">
      <div className="mx-auto max-w-[1200px] px-6 py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Link href="/" className="mb-4 inline-block">
              <Image
                src="/istin-logo-official.png"
                alt="Logo ISTIN"
                width={140}
                height={78}
                className="h-11 w-auto object-contain"
              />
            </Link>
            <p className="mb-2 font-heading text-lg font-bold">
              ISTIN <span className="text-[#ce283c]">MUTUELLE</span>
            </p>
            <p className="max-w-sm text-sm leading-relaxed text-white/65">
              Actualités, agenda et accès aux services de la Mutuelle ISTIN.
            </p>
          </div>

          <div className="lg:col-span-2">
            <p className="relative mb-4 pb-3 font-heading text-[1.05rem] font-bold after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-10 after:bg-[#ce283c] after:content-['']">
              Plateforme
            </p>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <Link href="/actualites" className="hover:text-white">
                  Actualités
                </Link>
              </li>
              <li>
                <Link href="/evenements" className="hover:text-white">
                  Événements
                </Link>
              </li>
              <li>
                <Link href="/finances" className="hover:text-white">
                  Finances
                </Link>
              </li>
              <li>
                <Link href="/galerie" className="hover:text-white">
                  Galerie
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="relative mb-4 pb-3 font-heading text-[1.05rem] font-bold after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-10 after:bg-[#ce283c] after:content-['']">
              Mutuelle
            </p>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <Link href="/bureau" className="hover:text-white">
                  Bureau
                </Link>
              </li>
              <li>
                <Link href="/a-propos" className="hover:text-white">
                  À propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="hover:text-white">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/conditions" className="hover:text-white">
                  Conditions d’utilisation
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <p className="relative mb-4 pb-3 font-heading text-[1.05rem] font-bold after:absolute after:bottom-0 after:left-0 after:h-[3px] after:w-10 after:bg-[#ce283c] after:content-['']">
              Espace étudiant
            </p>
            <FooterStudentCta />
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-3 border-t border-white/10 pt-8 text-xs text-white/45 sm:flex-row">
          <p>ISTIN MUTUELLE</p>
          <p>Libreville, Gabon</p>
        </div>
      </div>
    </footer>
  );
}
