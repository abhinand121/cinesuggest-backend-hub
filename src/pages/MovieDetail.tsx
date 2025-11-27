import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Clock, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMovie();
    }
  }, [id]);

  const fetchMovie = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("movie_id", id);

      const avgRating =
        reviews && reviews.length > 0
          ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
          : 0;

      setMovie({
        ...data,
        rating: avgRating,
        reviewCount: reviews?.length || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error loading movie",
        description: error.message,
        variant: "destructive",
      });
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!movie) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-6 hover:bg-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Movies
        </Button>

        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          <div className="space-y-4">
            <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius)] border border-border/50">
              <img
                src={movie.poster_url || "/placeholder.svg"}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-foreground">{movie.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 fill-primary text-primary" />
                  <span className="text-2xl font-bold text-foreground">
                    {movie.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">({movie.reviewCount} reviews)</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {movie.genre?.map((g: string) => (
                  <Badge key={g} variant="secondary">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-6 text-muted-foreground">
              {movie.duration_minutes && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{movie.duration_minutes} min</span>
                </div>
              )}
              {movie.release_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(movie.release_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {movie.description && (
              <div>
                <h2 className="text-xl font-semibold mb-3 text-foreground">Overview</h2>
                <p className="text-muted-foreground leading-relaxed">{movie.description}</p>
              </div>
            )}

            <div className="pt-6">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Reviews</h2>
              <p className="text-muted-foreground">Review system coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetail;
