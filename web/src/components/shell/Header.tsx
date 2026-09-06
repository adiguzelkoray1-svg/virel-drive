import Link from "next/link";
import { Icon } from "@/components/icons";
import { PersonAvatar } from "@/components/ui";
import { SearchBox } from "./SearchBox";

export function Header({ searchPlaceholder, newHref, newLabel = "Yeni", user, left, alerts = 0 }: {
  searchPlaceholder: string; newHref: string; newLabel?: string;
  user: { name: string }; left?: React.ReactNode; alerts?: number;
}) {
  return (
    <header className="h-[68px] bg-surface border-b border-border flex items-center px-8 gap-6 shrink-0">
      <div className="flex items-center gap-2 w-[280px] shrink-0">{left}</div>
      <div className="flex-1 flex justify-center">
        <SearchBox placeholder={searchPlaceholder} />
      </div>
      <div className="flex items-center gap-2.5 w-[280px] justify-end shrink-0">
        <Link href={newHref} className="btn btn-primary h-[38px] px-3.5"><Icon name="plus" size={16} />{newLabel}</Link>
        <Link href="/app#dikkat" className="ibtn relative" title="Dikkat gerektirenler" aria-label="Dikkat gerektirenler">
          <Icon name="bell" size={18} />
          {alerts > 0 && <span className="absolute top-[7px] right-2 w-[7px] h-[7px] rounded-full bg-danger border-[1.5px] border-surface" />}
        </Link>
        <PersonAvatar name={user.name} size={36} className="bg-blue text-on-brand" />
      </div>
    </header>
  );
}
