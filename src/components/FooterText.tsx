import { useLanguage } from "@/app/LanguageProvider";
import type { ActivePane, CenterView } from "@/app/types";

export function FooterText({
  activePane,
  view,
}: {
  activePane: ActivePane;
  view: CenterView;
}) {
  const { t } = useLanguage();
  const centerFooters = {
    tree: t.footerTree,
    kanban: t.footerKanban,
    calendar: t.footerCalendar,
    report: t.footerReport,
  };

  return activePane === "projects" ? t.footerProjects : centerFooters[view];
}
