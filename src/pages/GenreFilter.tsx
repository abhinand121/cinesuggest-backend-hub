import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MovieCard } from "@/components/MovieCard";
import { MovieHeader } from "@/components/MovieHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Film, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const GENRES = [
  "Action", "Drama", "Comedy", "Thriller", "Sci-Fi", 
  "Romance", "Horror", "Adventure", "Animation", "Fantasy"
];

const GenreFilter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("title", { ascending: true });

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

  const filteredMovies = selectedGenre
    ? movies.filter((movie) => 
        movie.genre?.some((g: string) => 
          g.toLowerCase().includes(selectedGenre.toLowerCase())
        )
      )
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg">
            <Film className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Browse by Genre</h1>
            <p className="text-muted-foreground">Find movies by your favorite genre</p>
          </div>
        </div>

        {/* Genre Pills */}
        <div className="flex flex-wrap gap-3 mb-10">
          <Button
            variant={selectedGenre === null ? "default" : "outline"}
            onClick={() => setSelectedGenre(null)}
            className="rounded-full"
          >
            All Genres
          </Button>
          {GENRES.map((genre) => (
            <Button
              key={genre}
              variant={selectedGenre === genre ? "default" : "outline"}
              onClick={() => setSelectedGenre(genre)}
              className="rounded-full"
            >
              {genre}
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
              No movies found in this genre.
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

export default GenreFilter;
