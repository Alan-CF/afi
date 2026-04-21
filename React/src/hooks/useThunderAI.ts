import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export type ThunderConversationMessage = {
  content: string;
  is_user: boolean;
  created_at: string;
};

type ThunderConversationRow = {
  content: string;
  role: string;
  created_at: string;
};

type UseThunderAIOptions = {
  enabled?: boolean;
};

export function useMessages(options?: UseThunderAIOptions) {
  const enabled = options?.enabled ?? true;
  const [messages, setMessages] = useState<ThunderConversationMessage[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(!enabled);
  const [error, setError] = useState<Error | null>(null);

  const getLastMessages = useCallback(async () => {
    if (!enabled) {
      setMessages([]);
      setError(null);
      setLoading(false);
      setHasLoadedOnce(true);
      return [] as ThunderConversationMessage[];
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("thunder_conversations")
        .select("content, role, created_at")
        .limit(20);

      if (error) {
        throw error;
      }

      const result =
        (data as ThunderConversationRow[] | null)?.map((row) => ({
          content: row.content,
          is_user: row.role === "user",
          created_at: row.created_at,
        }) as ThunderConversationMessage) ?? [];

      setMessages(result);
      setError(null);

      return result;
    } catch (err) {
      const getLastMessagesError =
        err instanceof Error ? err : new Error("Failed to fetch last messages");

      console.error("Error in getLastMessages:", getLastMessagesError);
      setMessages([]);
      setError(getLastMessagesError);

      return [];
    } finally {
      setLoading(false);
      setHasLoadedOnce(true);
    }
  }, [enabled]);

  useEffect(() => {
    void getLastMessages();
  }, [getLastMessages]);

  return {
    messages,
    loading,
    hasLoadedOnce,
    error,
    getLastMessages,
  };
}
