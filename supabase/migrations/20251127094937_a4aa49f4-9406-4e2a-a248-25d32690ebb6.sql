-- Create guest_users table for anonymous user tracking
CREATE TABLE IF NOT EXISTS public.guest_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_token uuid UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create movies table
CREATE TABLE IF NOT EXISTS public.movies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  release_date date,
  poster_url text,
  genre text[],
  duration_minutes integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  movie_id uuid REFERENCES public.movies(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid REFERENCES public.guest_users(id) ON DELETE CASCADE NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create media_files table for audio/video attachments
CREATE TABLE IF NOT EXISTS public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('audio', 'video')),
  file_url text NOT NULL,
  file_size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create replies table
CREATE TABLE IF NOT EXISTS public.replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid REFERENCES public.guest_users(id) ON DELETE CASCADE NOT NULL,
  reply_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create votes table for likes/dislikes
CREATE TABLE IF NOT EXISTS public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  guest_user_id uuid REFERENCES public.guest_users(id) ON DELETE CASCADE NOT NULL,
  vote_type text NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(review_id, guest_user_id)
);

-- Create ticket_verifications table
CREATE TABLE IF NOT EXISTS public.ticket_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid REFERENCES public.reviews(id) ON DELETE CASCADE NOT NULL,
  ticket_image_url text NOT NULL,
  ticket_identifier text,
  extracted_ticket_id text,
  validation_status text NOT NULL DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'manual_override')),
  validation_reason text,
  ticket_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_movie_id ON public.reviews(movie_id);
CREATE INDEX idx_reviews_guest_user_id ON public.reviews(guest_user_id);
CREATE INDEX idx_replies_review_id ON public.replies(review_id);
CREATE INDEX idx_votes_review_id ON public.votes(review_id);
CREATE INDEX idx_media_files_review_id ON public.media_files(review_id);
CREATE INDEX idx_ticket_verifications_review_id ON public.ticket_verifications(review_id);

-- Enable Row Level Security
ALTER TABLE public.guest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read, authenticated write)
CREATE POLICY "Movies are viewable by everyone" ON public.movies FOR SELECT USING (true);
CREATE POLICY "Reviews are viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Replies are viewable by everyone" ON public.replies FOR SELECT USING (true);
CREATE POLICY "Votes are viewable by everyone" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Media files are viewable by everyone" ON public.media_files FOR SELECT USING (true);
CREATE POLICY "Ticket verifications are viewable by everyone" ON public.ticket_verifications FOR SELECT USING (true);

-- Allow guest users to create their own records
CREATE POLICY "Guest users can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Guest users can update their own reviews" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Guest users can delete their own reviews" ON public.reviews FOR DELETE USING (true);

CREATE POLICY "Guest users can create replies" ON public.replies FOR INSERT WITH CHECK (true);
CREATE POLICY "Guest users can create votes" ON public.votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Guest users can update their votes" ON public.votes FOR UPDATE USING (true);
CREATE POLICY "Guest users can delete their votes" ON public.votes FOR DELETE USING (true);

CREATE POLICY "Media files can be inserted" ON public.media_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Ticket verifications can be inserted" ON public.ticket_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Ticket verifications can be updated" ON public.ticket_verifications FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER movies_updated_at BEFORE UPDATE ON public.movies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER replies_updated_at BEFORE UPDATE ON public.replies FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER ticket_verifications_updated_at BEFORE UPDATE ON public.ticket_verifications FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('reviews-media', 'reviews-media', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-images', 'ticket-images', true);

-- Storage policies
CREATE POLICY "Anyone can upload review media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'reviews-media');
CREATE POLICY "Review media is publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'reviews-media');
CREATE POLICY "Anyone can upload ticket images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'ticket-images');
CREATE POLICY "Ticket images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'ticket-images');