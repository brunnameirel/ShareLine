import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { readApiError } from '../utils/readApiError';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * useMessages — loads history from FastAPI, then subscribes to
 * Supabase Realtime postgres_changes for live updates.
 *
 * @param {string|null} requestId  — the request UUID to subscribe to
 * @param {string|null} authToken  — the Supabase JWT for FastAPI calls
 */
export function useMessages(requestId, authToken) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const channelRef = useRef(null);

  // ------------------------------------------------------------------
  // 1. Fetch history from FastAPI on mount / requestId change
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!requestId || !authToken) return;

    setLoading(true);
    setError(null);
    setMessages([]);

    fetch(`${API}/messages/${requestId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setMessages(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [requestId, authToken]);

  // ------------------------------------------------------------------
  // 2. Subscribe to Supabase Realtime postgres_changes
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!requestId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => {
          const newMsg = payload.new;
          if (!newMsg) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [requestId]);

  // ------------------------------------------------------------------
  // 3. Send a message via FastAPI — append locally immediately so the
  //    sender sees it without waiting for the realtime event.
  // ------------------------------------------------------------------
  const sendMessage = useCallback(
    async (body) => {
      if (!body.trim() || !requestId || !authToken) return false;

      setSending(true);
      setError(null);
      try {
        const res = await fetch(`${API}/messages/${requestId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ body: body.trim() }),
        });
        if (!res.ok) throw new Error(await readApiError(res));
        const saved = await res.json();
        // Add locally — realtime dedup will ignore it when it arrives
        setMessages((prev) => {
          if (prev.some((m) => m.id === saved.id)) return prev;
          return [...prev, saved];
        });
        return true;
      } catch (err) {
        setError(err.message);
        return false;
      } finally {
        setSending(false);
      }
    },
    [requestId, authToken]
  );

  const clearSendError = useCallback(() => setError(null), []);

  return { messages, loading, error, sending, sendMessage, clearSendError };
}
