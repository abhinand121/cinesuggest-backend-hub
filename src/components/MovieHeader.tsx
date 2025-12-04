import { Search, Film, Home, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";

interface MovieHeaderProps {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
}

export const MovieHeader = ({ searchQuery = "", onSearchChange, showSearch = true }: MovieHeaderProps) => {
  const navigate = useNavigate();
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/90 border-b border-border/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-[0_8px_24px_hsl(var(--ring))]">
              <Film className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              Nova
            </span>
          </Link>
          
          {showSearch && onSearchChange && (
            <div className="relative max-w-md mx-auto w-full hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-11 pr-4 py-3 rounded-full bg-secondary border-border/50 focus:border-primary/50 transition-all"
              />
            </div>
          )}
          
          <nav className="flex items-center gap-2">
            <button 
              onClick={() => navigate("/")}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Home"
            >
              <Home className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate("/login")}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Login"
            >
              <User className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate("/movies")}
              className="px-4 py-2 rounded-full font-semibold text-foreground bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              Movies
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};