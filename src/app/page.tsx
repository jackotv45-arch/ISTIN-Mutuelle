import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { LatestNews } from "@/components/home/LatestNews";
import { NextEvent } from "@/components/home/NextEvent";
import { FinancePreview } from "@/components/home/FinancePreview";
import { AboutTeaser } from "@/components/home/AboutTeaser";
import { BureauPreview } from "@/components/home/BureauPreview";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { CtaJoin } from "@/components/home/CtaJoin";

export default function HomePage() {
  return <>
    <Header />
    <main className="flex-1">
      <Hero />
      <div className="reveal"><LatestNews /></div>
      <div className="reveal reveal-delay-1"><NextEvent /></div>
      <div className="reveal"><FinancePreview /></div>
      <div className="reveal reveal-delay-1"><AboutTeaser /></div>
      <div className="reveal"><BureauPreview /></div>
      <div className="reveal reveal-delay-1"><GalleryPreview /></div>
      <div className="reveal"><CtaJoin /></div>
    </main>
    <Footer />
  </>;
}
