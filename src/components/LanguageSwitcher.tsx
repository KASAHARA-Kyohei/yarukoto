import { Check, Globe } from "lucide-react";
import { useState } from "react";
import { LANGUAGES } from "@/app/language";
import { useLanguage } from "@/app/LanguageProvider";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          aria-label={t.language}
          title={t.language}
          size="icon"
          type="button"
          variant="outline"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.stopPropagation();
          }}
        >
          <Globe className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-label={t.language}
        className="w-36 p-1"
        onKeyDown={(event) => event.stopPropagation()}
      >
        {LANGUAGES.map(({ id, label }) => (
          <Button
            aria-pressed={id === language}
            className="w-full justify-between aria-pressed:bg-accent"
            key={id}
            lang={id}
            type="button"
            variant="ghost"
            onClick={() => {
              setLanguage(id);
              setOpen(false);
            }}
          >
            {label}
            {id === language ? <Check aria-hidden="true" className="h-4 w-4" /> : null}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
