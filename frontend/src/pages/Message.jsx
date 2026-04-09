import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, List, ListItem, ListItemAvatar, Avatar,
  ListItemText, TextField, IconButton
} from '@mui/material';
import { Send, VolunteerActivism } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

export default function Message() {
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null); // internal DB UUID
  const scrollRef = useRef(null);

  // 1. Resolve Supabase auth user → internal DB user ID
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user')
        .select('id')
        .eq('supabase_id', user.id)
        .single();

      if (error) console.error('Error resolving user ID:', error);
      else if (data) setCurrentUserId(data.id);
    };
    getUser();
  }, []);

  // 2. Fetch approved request threads for the current user
  useEffect(() => {
    if (!currentUserId) return;

    const fetchThreads = async () => {
      // Threads where current user is the requester
      const { data: asRequester } = await supabase
        .from('request')
        .select('id, status, requester_id, item:item_id (name, donor_id), requester:requester_id (name)')
        .eq('status', 'Approved')
        .eq('requester_id', currentUserId);

      // Items where current user is the donor → get their approved requests
      const { data: donorItems } = await supabase
        .from('item')
        .select('id')
        .eq('donor_id', currentUserId);

      let asDonor = [];
      if (donorItems?.length > 0) {
        const itemIds = donorItems.map((i) => i.id);
        const { data } = await supabase
          .from('request')
          .select('id, status, requester_id, item:item_id (name, donor_id), requester:requester_id (name)')
          .eq('status', 'Approved')
          .in('item_id', itemIds);
        asDonor = data || [];
      }

      // Merge and deduplicate
      const all = [...(asRequester || []), ...asDonor];
      const unique = all.filter((t, i) => all.findIndex((t2) => t2.id === t.id) === i);
      setThreads(unique);
    };

    fetchThreads();
  }, [currentUserId]);

  // 3. Fetch message history + subscribe to real-time inserts
  useEffect(() => {
    if (!activeThread) return;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('message')
        .select('*')
        .eq('request_id', activeThread.id)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error);
      else setMessages(data || []);
    };

    fetchMessages();

    const channel = supabase
      .channel(`messages-${activeThread.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'message',
          filter: `request_id=eq.${activeThread.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.find((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [activeThread]);

  // 4. Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 5. Send message via Supabase insert
  const handleSend = async () => {
    if (!inputText.trim() || !activeThread || !currentUserId) return;

    const { error } = await supabase.from('message').insert({
      request_id: activeThread.id,
      sender_id: currentUserId,
      body: inputText.trim(),
    });

    if (error) console.error('Error sending message:', error);
    else setInputText('');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#fff' }}>
      {/* SIDEBAR */}
      <Box sx={{ width: 350, borderRight: '1px solid #DFBC94', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #DFBC94', display: 'flex', alignItems: 'center', gap: 2 }}>
          <VolunteerActivism sx={{ color: '#B53324' }} />
          <Typography variant="h6" fontWeight={700} sx={{ color: '#B53324' }}>Messages</Typography>
        </Box>
        <List sx={{ p: 0, overflowY: 'auto' }}>
          {threads.length > 0 ? (
            threads.map((t) => (
              <ListItem
                button
                key={t.id}
                onClick={() => setActiveThread(t)}
                selected={activeThread?.id === t.id}
                sx={{ py: 2, borderBottom: '1px solid #f9f0e6', '&.Mui-selected': { bgcolor: '#F5E2CE' } }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: '#B53324' }}>{t.item?.name ? t.item.name[0] : '?'}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography fontWeight={600}>{t.item?.name || 'Item Request'}</Typography>}
                  secondary={t.requester?.name || t.status}
                />
              </ListItem>
            ))
          ) : (
            <Typography sx={{ p: 3, color: 'text.secondary', textAlign: 'center' }}>
              No active chats found
            </Typography>
          )}
        </List>
      </Box>

      {/* CHAT AREA */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {activeThread ? (
          <>
            <Box sx={{ p: 2, borderBottom: '1px solid #DFBC94', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography fontWeight={700}>{activeThread.item?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                with {activeThread.requester?.name}
              </Typography>
            </Box>
            <Box
              ref={scrollRef}
              sx={{ flexGrow: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5, bgcolor: '#fafafa' }}
            >
              {messages.map((m) => {
                const isMe = m.sender_id === currentUserId;
                return (
                  <Box
                    key={m.id}
                    sx={{
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      bgcolor: isMe ? '#B53324' : '#fff',
                      color: isMe ? '#fff' : '#000',
                      p: '10px 16px',
                      borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      maxWidth: '70%',
                    }}
                  >
                    <Typography variant="body2">{m.body}</Typography>
                  </Box>
                );
              })}
            </Box>
            <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #DFBC94' }}>
              <TextField
                fullWidth
                placeholder="Write a message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                InputProps={{
                  sx: { borderRadius: 10 },
                  endAdornment: (
                    <IconButton onClick={handleSend} sx={{ color: '#B53324' }}>
                      <Send />
                    </IconButton>
                  ),
                }}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.5 }}>
            <VolunteerActivism sx={{ fontSize: 60, mb: 2, color: '#DFBC94' }} />
            <Typography variant="h6">Select a conversation to start</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
