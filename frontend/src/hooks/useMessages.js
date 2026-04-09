import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';

/**
 * useMessages — loads history from FastAPI, then subscribes to
 * Supabase Realtime broadcast for live updates.
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

    fetch(`${import.meta.env.VITE_API_URL}/messages/${requestId}`, {
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
  // 2. Subscribe to Supabase Realtime broadcast for live messages
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!requestId) return;

    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`request:${requestId}`, {
        config: { private: true },
      })
      .on('broadcast', { event: 'INSERT' }, (payload) => {
        const newMsg = payload?.payload?.new;
        if (!newMsg) return;
        setMessages((prev) => {
          // Deduplicate in case history fetch and broadcast overlap
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [requestId]);

  // ------------------------------------------------------------------
  // 3. Send a message via FastAPI (DB insert → triggers broadcast)
  // ------------------------------------------------------------------
  const sendMessage = useCallback(
    async (body) => {
      if (!body.trim() || !requestId || !authToken) return;

      setSending(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/messages/${requestId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({ body: body.trim() }),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // Don't append locally — Realtime broadcast will deliver it
      } catch (err) {
        setError(err.message);
      } finally {
        setSending(false);
      }
    },
    [requestId, authToken]
  );

  return { messages, loading, error, sending, sendMessage };
}