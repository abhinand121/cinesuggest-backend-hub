import { useState } from "react";
import { Star, Upload, Mic, Video, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  movieId: string;
  guestUserId: string;
  onReviewSubmitted: () => void;
}

export const ReviewForm = ({ movieId, guestUserId, onReviewSubmitted }: ReviewFormProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [ticketImage, setTicketImage] = useState<File | null>(null);
  const [ticketId, setTicketId] = useState("");
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setMediaFiles((prev) => [...prev, ...files]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Create review
      const { data: review, error: reviewError } = await supabase
        .from("reviews")
        .insert({
          movie_id: movieId,
          guest_user_id: guestUserId,
          rating,
          review_text: reviewText || null,
        })
        .select()
        .single();

      if (reviewError) throw reviewError;

      // Upload media files if any
      for (const file of mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${review.id}-${Date.now()}.${fileExt}`;
        const fileType = file.type.startsWith("audio/") ? "audio" : "video";

        const { error: uploadError } = await supabase.storage
          .from("reviews-media")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("reviews-media")
          .getPublicUrl(fileName);

        await supabase.from("media_files").insert({
          review_id: review.id,
          file_type: fileType,
          file_url: publicUrl,
          file_size_bytes: file.size,
        });
      }

      // Handle ticket verification if provided
      if (ticketImage) {
        const formData = new FormData();
        formData.append("ticketImage", ticketImage);
        formData.append("ticketIdentifier", ticketId);
        formData.append("reviewId", review.id);

        const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
          "verify-ticket",
          { body: formData }
        );

        if (verificationError) {
          console.error("Ticket verification error:", verificationError);
        } else if (verificationData?.valid) {
          toast({
            title: "Ticket verified!",
            description: "Your ticket has been validated",
          });
        } else {
          toast({
            title: "Ticket verification pending",
            description: verificationData?.reason || "Manual review may be required",
            variant: "default",
          });
        }
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback",
      });

      // Reset form
      setRating(0);
      setReviewText("");
      setTicketImage(null);
      setTicketId("");
      setMediaFiles([]);
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-border/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label className="text-base font-semibold mb-3 block">Your Rating *</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn(
                    "w-8 h-8 transition-colors",
                    star <= (hoveredRating || rating)
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  )}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="review-text">Your Review</Label>
          <Textarea
            id="review-text"
            placeholder="Share your thoughts about this movie..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            className="min-h-[120px] bg-secondary border-border/50 focus:border-primary/50"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="ticket-image">Ticket Image (Optional)</Label>
            <div className="mt-2">
              <label
                htmlFor="ticket-image"
                className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
                <span className="text-sm">
                  {ticketImage ? ticketImage.name : "Upload ticket"}
                </span>
              </label>
              <input
                id="ticket-image"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setTicketImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="ticket-id">Ticket ID (Optional)</Label>
            <Input
              id="ticket-id"
              placeholder="Enter ticket identifier"
              value={ticketId}
              onChange={(e) => setTicketId(e.target.value)}
              className="mt-2 bg-secondary border-border/50 focus:border-primary/50"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="media-upload">Add Audio/Video (Optional)</Label>
          <div className="mt-2">
            <label
              htmlFor="media-upload"
              className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-border/50 rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Video className="w-4 h-4" />
              <Mic className="w-4 h-4" />
              <span className="text-sm">
                {mediaFiles.length > 0
                  ? `${mediaFiles.length} file(s) selected`
                  : "Upload media"}
              </span>
            </label>
            <input
              id="media-upload"
              type="file"
              accept="audio/*,video/*"
              multiple
              className="hidden"
              onChange={handleMediaUpload}
            />
          </div>
          {mediaFiles.length > 0 && (
            <div className="mt-2 space-y-1">
              {mediaFiles.map((file, idx) => (
                <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                  <Upload className="w-3 h-3" />
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting || rating === 0}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Review"
          )}
        </Button>
      </form>
    </Card>
  );
};
