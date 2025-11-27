import { Search, Film } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MovieHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export const MovieHeader = ({ searchQuery, onSearchChange }: MovieHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/90 border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_8px_24px_hsl(var(--ring))]">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              CineSuggest
            </span>
          </div>
          <div className="relative max-w-md mx-auto w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-11 pr-4 py-3 rounded-full bg-secondary border-border/50 focus:border-primary/50 transition-all"
            />
          </div>
          <nav className="hidden md:flex gap-2">
            <button className="px-4 py-2 rounded-full font-semibold text-foreground bg-primary/10 hover:bg-primary/20 transition-colors">
              Movies
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
