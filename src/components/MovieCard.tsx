import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  id: string;
  title: string;
  posterUrl?: string;
  genre?: string[];
  releaseDate?: string;
  rating?: number;
  reviewCount?: number;
  onClick: () => void;
}

export const MovieCard = ({
  title,
  posterUrl,
  genre,
  releaseDate,
  rating = 0,
  reviewCount = 0,
  onClick,
}: MovieCardProps) => {
  return (
    <Card
      onClick={onClick}
      className="group relative overflow-hidden rounded-[var(--radius)] bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-[0_8px_24px_hsl(var(--ring))]"
    >
      <div className="aspect-[2/3] overflow-hidden">
        <img
          src={posterUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {genre?.slice(0, 2).map((g) => (
            <Badge key={g} variant="secondary" className="text-xs">
              {g}
            </Badge>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-primary" />
            <span className="text-sm font-semibold text-foreground">
              {rating.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          </div>
          {releaseDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(releaseDate).getFullYear()}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
