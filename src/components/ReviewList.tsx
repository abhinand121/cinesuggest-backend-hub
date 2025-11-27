import { useState, useEffect } from "react";
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Volume2, Video, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  review_text: string;
  created_at: string;
  guest_user_id: string;
}

interface ReviewListProps {
  movieId: string;
  guestUserId: string;
  refreshTrigger: number;
}

export const ReviewList = ({ movieId, guestUserId, refreshTrigger }: ReviewListProps) => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [movieId, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      const { data: reviewsData, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("movie_id", movieId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch additional data for each review
      const enrichedReviews = await Promise.all(
        (reviewsData || []).map(async (review) => {
          // Get media files
          const { data: media } = await supabase
            .from("media_files")
            .select("*")
            .eq("review_id", review.id);

          // Get ticket verification
          const { data: ticket } = await supabase
            .from("ticket_verifications")
            .select("*")
            .eq("review_id", review.id)
            .single();

          // Get votes
          const { data: votes } = await supabase
            .from("votes")
            .select("*")
            .eq("review_id", review.id);

          const likes = votes?.filter((v) => v.vote_type === "like").length || 0;
          const dislikes = votes?.filter((v) => v.vote_type === "dislike").length || 0;
          const userVote = votes?.find((v) => v.guest_user_id === guestUserId);

          // Get replies
          const { data: replies } = await supabase
            .from("replies")
            .select("*")
            .eq("review_id", review.id)
            .order("created_at", { ascending: true });

          return {
            ...review,
            media: media || [],
            ticket,
            likes,
            dislikes,
            userVote: userVote?.vote_type || null,
            replies: replies || [],
          };
        })
      );

      setReviews(enrichedReviews);
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error loading reviews",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (reviewId: string, voteType: "like" | "dislike") => {
    try {
      const review = reviews.find((r) => r.id === reviewId);
      
      if (review?.userVote === voteType) {
        // Remove vote
        await supabase
          .from("votes")
          .delete()
          .eq("review_id", reviewId)
          .eq("guest_user_id", guestUserId);
      } else if (review?.userVote) {
        // Update vote
        await supabase
          .from("votes")
          .update({ vote_type: voteType })
          .eq("review_id", reviewId)
          .eq("guest_user_id", guestUserId);
      } else {
        // Create new vote
        await supabase.from("votes").insert({
          review_id: reviewId,
          guest_user_id: guestUserId,
          vote_type: voteType,
        });
      }

      fetchReviews();
    } catch (error: any) {
      console.error("Error voting:", error);
      toast({
        title: "Error",
        description: "Failed to register vote",
        variant: "destructive",
      });
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) return;

    try {
      await supabase.from("replies").insert({
        review_id: reviewId,
        guest_user_id: guestUserId,
        reply_text: replyText,
      });

      toast({
        title: "Reply posted",
        description: "Your reply has been added",
      });

      setReplyText("");
      setReplyingTo(null);
      fetchReviews();
    } catch (error: any) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading reviews...</div>;
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id} className="p-6 bg-card border-border/50 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= review.rating
                          ? "fill-primary text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
                {review.ticket?.validation_status === "valid" && (
                  <div className="flex items-center gap-1 text-success text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          {review.review_text && (
            <p className="text-foreground leading-relaxed">{review.review_text}</p>
          )}

          {review.media.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {review.media.map((media: any) => (
                <a
                  key={media.id}
                  href={media.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm"
                >
                  {media.file_type === "audio" ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  <span>View {media.file_type}</span>
                </a>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(review.id, "like")}
              className={cn(
                "gap-1",
                review.userVote === "like" && "text-primary"
              )}
            >
              <ThumbsUp className="w-4 h-4" />
              {review.likes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(review.id, "dislike")}
              className={cn(
                "gap-1",
                review.userVote === "dislike" && "text-destructive"
              )}
            >
              <ThumbsDown className="w-4 h-4" />
              {review.dislikes}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
              className="gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              Reply ({review.replies.length})
            </Button>
          </div>

          {replyingTo === review.id && (
            <div className="space-y-2 pl-6 border-l-2 border-border">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="bg-secondary border-border/50"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleReply(review.id)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Post Reply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {review.replies.length > 0 && (
            <div className="space-y-3 pl-6 border-l-2 border-border">
              {review.replies.map((reply: any) => (
                <div key={reply.id} className="space-y-1">
                  <p className="text-sm text-foreground">{reply.reply_text}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
