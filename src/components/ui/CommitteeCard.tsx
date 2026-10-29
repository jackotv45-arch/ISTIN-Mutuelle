import Image from "next/image";
import type { EditableSectionItem } from "@/lib/admin-sections";

export function CommitteeCard({ member, compact = false }: { member: EditableSectionItem; compact?: boolean }) {
  return <article className="group relative overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white text-center shadow-[0_14px_35px_rgba(6,42,74,0.07)] transition duration-300 hover:-translate-y-1.5 hover:border-istin-blue/25 hover:shadow-[0_24px_55px_rgba(6,42,74,0.15)]">
    <div className="relative h-28 bg-gradient-to-br from-[#e8f2fa] via-white to-[#fbeef0]">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-istin-red via-white to-istin-blue" />
      <span className="absolute -right-7 -top-10 h-28 w-28 rounded-full bg-istin-blue/5" />
      <span className="absolute -left-8 bottom-0 h-20 w-20 rounded-full bg-istin-red/5" />
      <div className="absolute left-1/2 top-full z-10 h-[8.5rem] w-[8.5rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-istin-red via-white to-istin-blue p-[3px] shadow-lg">
        <div className="relative h-full w-full overflow-hidden rounded-full border-[5px] border-white bg-slate-100">
          {member.image ? <Image src={member.image} alt={"Photo de " + member.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="136px" /> : <span className="grid h-full place-items-center px-3 text-xs font-semibold text-slate-500">Photo à ajouter</span>}
        </div>
      </div>
    </div>
    <div className={compact ? "px-4 pb-5 pt-[4.8rem]" : "px-5 pb-6 pt-[4.8rem]"}>
      <h3 className={compact ? "font-heading text-base font-extrabold text-[#1c2733]" : "font-heading text-lg font-extrabold text-[#1c2733]"}>{member.title}</h3>
      <div className="mt-2 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-istin-red" />
        <p className="text-[0.68rem] font-bold uppercase tracking-[.12em] text-istin-blue">{member.value}</p>
      </div>
      {!compact && member.details && <p className="mx-auto mt-3 max-w-[17rem] text-sm leading-relaxed text-slate-500">{member.details}</p>}
    </div>
  </article>;
}