import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MovieCard } from "@/components/MovieCard";
import { MovieHeader } from "@/components/MovieHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const YEAR_RANGES = [
  { label: "2020s", start: 2020, end: 2029 },
  { label: "2010s", start: 2010, end: 2019 },
  { label: "2000s", start: 2000, end: 2009 },
  { label: "1990s", start: 1990, end: 1999 },
  { label: "Classic (Before 1990)", start: 1900, end: 1989 },
];

const YearFilter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("release_date", { ascending: false });

      if (error) throw error;

      const moviesWithStats = await Promise.all(
        (data || []).map(async (movie) => {
          const { data: reviews } = await supabase
            .from("reviews")
            .select("rating")
            .eq("movie_id", movie.id);

          const avgRating =
            reviews && reviews.length > 0
              ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
              : 0;

          return {
            ...movie,
            rating: avgRating,
            reviewCount: reviews?.length || 0,
          };
        })
      );

      setMovies(moviesWithStats);
    } catch (error: any) {
      toast({
        title: "Error loading movies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = selectedRange
    ? movies.filter((movie) => {
        if (!movie.release_date) return false;
        const year = new Date(movie.release_date).getFullYear();
        return year >= selectedRange.start && year <= selectedRange.end;
      })
    : movies;

  return (
    <div className="min-h-screen bg-background">
      <MovieHeader showSearch={false} />
      
      <main className="container mx-auto px-6 py-8">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-yellow-500 flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Browse by Year</h1>
            <p className="text-muted-foreground">Explore movies from different eras</p>
          </div>
        </div>

        {/* Year Range Pills */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Button
            variant={selectedRange === null ? "default" : "outline"}
            onClick={() => setSelectedRange(null)}
            className="rounded-full"
          >
            All Years
          </Button>
          {YEAR_RANGES.map((range) => (
            <Button
              key={range.label}
              variant={selectedRange?.start === range.start ? "default" : "outline"}
              onClick={() => setSelectedRange({ start: range.start, end: range.end })}
              className="rounded-full"
            >
              {range.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl text-muted-foreground">
              No movies found from this period.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                id={movie.id}
                title={movie.title}
                posterUrl={movie.poster_url}
                genre={movie.genre}
                releaseDate={movie.release_date}
                rating={movie.rating}
                reviewCount={movie.reviewCount}
                onClick={() => navigate(`/movie/${movie.id}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default YearFilter;
