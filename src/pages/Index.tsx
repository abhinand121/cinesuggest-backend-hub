import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MovieCard } from "@/components/MovieCard";
import { MovieHeader } from "@/components/MovieHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch review stats for each movie
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

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <MovieHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      
      <main className="container mx-auto px-6 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-xl text-muted-foreground">
              {searchQuery ? "No movies found matching your search." : "No movies available yet."}
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              {searchQuery ? "Search Results" : "All Movies"}
            </h2>
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
          </>
        )}
      </main>
    </div>
  );
};

export default Index;
