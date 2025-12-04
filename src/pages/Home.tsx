import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MovieHeader } from "@/components/MovieHeader";
import { MovieCard } from "@/components/MovieCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Film, Calendar, Star, TrendingUp } from "lucide-react";

const FEATURED_MOVIE_TITLES = [
  "Baahubali",
  "KGF",
  "RRR",
  "3 Idiots",
  "Dangal",
  "Avengers: Endgame",
  "Avatar",
  "Interstellar",
  "Inception",
  "Titanic"
];

const categories = [
  {
    id: "genre",
    title: "Browse by Genre",
    description: "Action, Drama, Sci-Fi & more",
    icon: Film,
    gradient: "from-primary to-orange-600",
  },
  {
    id: "year",
    title: "Browse by Year",
    description: "Classic to Latest releases",
    icon: Calendar,
    gradient: "from-accent to-yellow-500",
  },
  {
    id: "rating",
    title: "Top Rated",
    description: "Highest reviewed movies",
    icon: Star,
    gradient: "from-green-500 to-emerald-600",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [featuredMovies, setFeaturedMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedMovies();
  }, []);

  const fetchFeaturedMovies = async () => {
    try {
      const { data, error } = await supabase
        .from("movies")
        .select("*")
        .in("title", FEATURED_MOVIE_TITLES);

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

      setFeaturedMovies(moviesWithStats);
    } catch (error: any) {
      toast({
        title: "Error loading featured movies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/movies?filter=${categoryId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <MovieHeader showSearch={false} />

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground mb-4 tracking-tight">
            Welcome to <span className="text-primary">Nova</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover, review, and share your movie experiences with verified ticket reviews
          </p>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 px-6">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Explore Movies
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="group relative p-8 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_8px_30px_hsl(var(--primary)/0.15)] text-left overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${category.gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                  <category.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">{category.title}</h3>
                <p className="text-muted-foreground">{category.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Movies Section */}
      <section className="py-12 px-6 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <Star className="w-8 h-8 text-accent" />
            Featured Movies
          </h2>
          
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : featuredMovies.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Featured movies coming soon...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {featuredMovies.map((movie) => (
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">Ready to explore?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Browse our complete collection of movies and share your reviews with the community.
          </p>
          <button
            onClick={() => navigate("/movies")}
            className="px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:shadow-[0_8px_30px_hsl(var(--primary)/0.4)] transition-all"
          >
            Browse All Movies
          </button>
        </div>
      </section>
    </div>
  );
};

export default Home;
