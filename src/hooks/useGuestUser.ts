import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const GUEST_TOKEN_KEY = "cinesuggest_guest_token";
const GUEST_ID_KEY = "cinesuggest_guest_id";

export const useGuestUser = () => {
  const [guestUserId, setGuestUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeGuestUser();
  }, []);

  const initializeGuestUser = async () => {
    try {
      // Check if guest token exists in localStorage
      const existingToken = localStorage.getItem(GUEST_TOKEN_KEY);
      const existingId = localStorage.getItem(GUEST_ID_KEY);

      if (existingToken && existingId) {
        // Verify the guest user still exists
        const { data, error } = await supabase
          .from("guest_users")
          .select("id")
          .eq("user_token", existingToken)
          .single();

        if (!error && data) {
          setGuestUserId(data.id);
          setLoading(false);
          return;
        }
      }

      // Create new guest user
      const { data, error } = await supabase.functions.invoke("create-guest-user");

      if (error) throw error;

      const { guestUserId: newId, userToken } = data;
      localStorage.setItem(GUEST_TOKEN_KEY, userToken);
      localStorage.setItem(GUEST_ID_KEY, newId);
      setGuestUserId(newId);
    } catch (error) {
      console.error("Error initializing guest user:", error);
    } finally {
      setLoading(false);
    }
  };

  return { guestUserId, loading };
};
