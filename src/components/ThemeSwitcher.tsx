import { Check, Palette } from "lucide-react";
import { THEMES, type ThemeId } from "@/app/theme";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function ThemeSwitcher({
  onChangeTheme,
  themeId,
}: {
  onChangeTheme: (themeId: ThemeId) => void;
  themeId: ThemeId;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          aria-label="テーマを変更"
          title="テーマを変更"
          size="icon"
          type="button"
          variant="outline"
        >
          <Palette className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        {THEMES.map((theme) => {
          const isSelected = theme.id === themeId;
          return (
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                isSelected && "bg-accent text-accent-foreground",
              )}
              key={theme.id}
              onClick={() => onChangeTheme(theme.id)}
              type="button"
            >
              <span>{theme.label}</span>
              {isSelected ? <Check className="h-4 w-4" /> : null}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
