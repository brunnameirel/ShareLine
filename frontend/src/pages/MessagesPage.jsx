import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Box, Typography, Avatar, IconButton, TextField, CircularProgress,
  Skeleton, Alert, Button, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Tooltip, Snackbar,
} from '@mui/material';
import {
  Send, ArrowBack, VolunteerActivism, ChatBubbleOutlined,
  CheckCircleOutline, Flag,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import { useMessages } from '../hooks/useMessages';

// Helpers

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

function initials(name = '') {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─── Brand tokens (matches your Login page) ──────────────────────────────────

const brand = {
  red: '#B53324',
  redDark: '#922a1d',
  gold: '#E5A657',
  goldDark: '#c48d45',
  cream: '#F5E2CE',
  tan: '#DFBC94',
  muted: '#8a6d4b',
  bg: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
};

// ─── Thread list item ─────────────────────────────────────────────────────────

function ThreadItem({ thread, isActive, onClick }) {
  const lastMsg = thread.lastMessage;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.5,
        cursor: 'pointer',
        borderRadius: 3,
        mx: 1,
        transition: 'background 0.15s',
        background: isActive ? brand.cream : 'transparent',
        '&:hover': { background: isActive ? brand.cream : 'rgba(181,51,36,0.05)' },
      }}
    >
      <Avatar
        sx={{
          width: 48,
          height: 48,
          background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
          fontWeight: 700,
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {initials(thread.otherUserName)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography
            sx={{
              fontWeight: thread.unread ? 700 : 600,
              fontSize: 14,
              color: '#2c1a0e',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 130,
            }}
          >
            {thread.otherUserName}
          </Typography>
          {lastMsg && (
            <Typography sx={{ fontSize: 11, color: brand.muted, flexShrink: 0, ml: 1 }}>
              {formatTime(lastMsg.created_at)}
            </Typography>
          )}
        </Box>
        <Typography
          sx={{
            fontSize: 13,
            color: thread.unread ? '#2c1a0e' : brand.muted,
            fontWeight: thread.unread ? 600 : 400,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {thread.itemName}
        </Typography>
        {lastMsg && (
          <Typography
            sx={{
              fontSize: 12,
              color: brand.muted,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lastMsg.body}
          </Typography>
        )}
      </Box>
      {thread.unread && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: brand.red,
            flexShrink: 0,
          }}
        />
      )}
    </Box>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ msg, isMine }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isMine ? 'flex-end' : 'flex-start',
        mb: 0.5,
      }}
    >
      <Box
        sx={{
          maxWidth: '70%',
          px: 2,
          py: 1.2,
          borderRadius: isMine ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
          background: isMine
            ? `linear-gradient(135deg, ${brand.red}, ${brand.gold})`
            : '#fff',
          color: isMine ? '#fff' : '#2c1a0e',
          boxShadow: isMine
            ? '0 2px 8px rgba(181,51,36,0.25)'
            : '0 1px 4px rgba(0,0,0,0.08)',
          border: isMine ? 'none' : `1px solid ${brand.tan}`,
        }}
      >
        <Typography sx={{ fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word' }}>
          {msg.body}
        </Typography>
        <Typography
          sx={{
            fontSize: 10,
            mt: 0.5,
            textAlign: 'right',
            opacity: 0.7,
            color: isMine ? '#fff' : brand.muted,
          }}
        >
          {formatTime(msg.created_at)}
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyInbox() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        color: brand.muted,
      }}
    >
      <Box
        sx={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: brand.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: `2px solid ${brand.tan}`,
        }}
      >
        <ChatBubbleOutlined sx={{ fontSize: 32, color: brand.tan }} />
      </Box>
      <Typography sx={{ fontWeight: 600, fontSize: 16, color: '#2c1a0e' }}>
        No messages yet
      </Typography>
      <Typography sx={{ fontSize: 13, textAlign: 'center', maxWidth: 240 }}>
        When a request is approved, you can message the other party here.
      </Typography>
    </Box>
  );
}

function NoThreadSelected() {
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        color: brand.muted,
        background: 'rgba(245,226,206,0.3)',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ChatBubbleOutlined sx={{ fontSize: 36, color: '#fff' }} />
      </Box>
      <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#2c1a0e' }}>
        Your Messages
      </Typography>
      <Typography sx={{ fontSize: 14, color: brand.muted }}>
        Select a conversation to start chatting
      </Typography>
    </Box>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const navigate = useNavigate();
  const { requestId: paramRequestId } = useParams(); // optional: /messages/:requestId

  const [session, setSession] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [threads, setThreads] = useState([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeRequestId, setActiveRequestId] = useState(paramRequestId || null);
  const [input, setInput] = useState('');
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // 'complete' | 'report' | null
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Get session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) navigate('/login');
    });
  }, [navigate]);

  // 2. Get internal user id from FastAPI (needed for isMine + Supabase queries)
  useEffect(() => {
    if (!session) return;
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((u) => setMyUserId(u.id))
      .catch((e) => console.error('Failed to load user:', e));
  }, [session]);

  // 3. Load approved threads via Supabase directly (same as Dashboard)
  useEffect(() => {
    if (!myUserId) return;

    const load = async () => {
      setThreadsLoading(true);
      try {
        const res = await fetch(`${API}/requests?status=Approved`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setThreads(
          data.map((req) => ({
            requestId: req.id,
            itemName: req.item_name,
            otherUserName: req.other_user_name,
            lastMessage: null,
            unread: false,
          }))
        );
      } catch (e) {
        console.error('Failed to load threads:', e);
      } finally {
        setThreadsLoading(false);
      }
    };

    load();
  }, [myUserId]);

  const activeThread = threads.find((t) => t.requestId === activeRequestId);

  const { messages, loading: msgsLoading, sending, sendMessage, error: sendError, clearSendError } = useMessages(
    activeRequestId,
    session?.access_token
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update thread's lastMessage in sidebar when new messages arrive
  useEffect(() => {
    if (!activeRequestId || messages.length === 0) return;
    const last = messages[messages.length - 1];
    setThreads((prev) =>
      prev.map((t) =>
        t.requestId === activeRequestId ? { ...t, lastMessage: last } : t
      )
    );
  }, [messages, activeRequestId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    const ok = await sendMessage(text);
    if (!ok) setInput(text);
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleComplete = async () => {
    setCompleteDialogOpen(false);
    setActionLoading('complete');
    try {
      const res = await fetch(`${API}/requests/${activeRequestId}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setSnackbar({ open: true, message: data.detail || 'Failed to complete transaction', severity: 'error' });
        return;
      }
      setThreads((prev) => prev.filter((t) => t.requestId !== activeRequestId));
      setActiveRequestId(null);
      setSnackbar({ open: true, message: 'Transaction completed! The chat has been closed.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to complete transaction', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleReport = async () => {
    setReportDialogOpen(false);
    setActionLoading('report');
    try {
      const res = await fetch(`${API}/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request_id: activeRequestId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSnackbar({ open: true, message: data.detail || 'Failed to report user', severity: 'error' });
        return;
      }
      const data = await res.json();
      setSnackbar({
        open: true,
        message: data.is_banned
          ? 'User reported and banned due to multiple reports.'
          : 'User reported successfully. Thank you for keeping ShareLine safe.',
        severity: 'success',
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to report user', severity: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FFFAF5' }}>

      {/* ── Top navbar ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 5 },
          py: 1.5,
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0e0cc',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box
          component={Link}
          to="/dashboard"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VolunteerActivism sx={{ color: brand.cream, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: brand.red, fontSize: 17, letterSpacing: '-0.5px' }}>
            ShareLine
          </Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, color: '#2c1a0e', fontSize: 15 }}>
          Messages
        </Typography>
        <Box sx={{ width: 80 }} />
      </Box>

      {/* ── Main layout ── */}
      <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Sidebar ── */}
        <Box
          sx={{
            width: { xs: activeRequestId ? 0 : '100%', md: 320 },
            flexShrink: 0,
            borderRight: `1px solid ${brand.tan}`,
            backgroundColor: '#fff',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.2s',
          }}
        >
          {/* Sidebar header */}
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${brand.tan}` }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#2c1a0e' }}>
              Conversations
            </Typography>
          </Box>

          {/* Thread list */}
          <Box sx={{ flex: 1, overflowY: 'auto', py: 1 }}>
            {threadsLoading ? (
              [0, 1, 2].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 1.5 }}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="60%" height={16} />
                    <Skeleton width="40%" height={13} sx={{ mt: 0.5 }} />
                  </Box>
                </Box>
              ))
            ) : threads.length === 0 ? (
              <EmptyInbox />
            ) : (
              threads.map((t) => (
                <ThreadItem
                  key={t.requestId}
                  thread={t}
                  isActive={t.requestId === activeRequestId}
                  onClick={() => setActiveRequestId(t.requestId)}
                />
              ))
            )}
          </Box>
        </Box>

        {/* ── Chat panel ── */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#FFFAF5',
          }}
        >
          {!activeRequestId ? (
            <NoThreadSelected />
          ) : (
            <>
              {/* Chat header */}
              <Box
                sx={{
                  px: 3,
                  py: 1.5,
                  borderBottom: `1px solid ${brand.tan}`,
                  backgroundColor: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  flexShrink: 0,
                }}
              >
                {/* Back button on mobile */}
                <IconButton
                  size="small"
                  onClick={() => setActiveRequestId(null)}
                  sx={{ display: { md: 'none' }, mr: 0.5 }}
                >
                  <ArrowBack sx={{ fontSize: 20, color: brand.red }} />
                </IconButton>

                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {initials(activeThread?.otherUserName || 'U')}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#2c1a0e' }}>
                    {activeThread?.otherUserName || 'Conversation'}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: brand.muted }}>
                    {activeThread?.itemName}
                  </Typography>
                </Box>

                {/* Action buttons */}
                <Box sx={{ display: 'flex', gap: 0.5, ml: 'auto' }}>
                  <Tooltip title="Transaction Complete — close this chat">
                    <span>
                      <IconButton
                        onClick={() => setCompleteDialogOpen(true)}
                        disabled={actionLoading === 'complete'}
                        sx={{
                          color: '#2e7d32',
                          '&:hover': { background: 'rgba(46,125,50,0.08)' },
                        }}
                      >
                        {actionLoading === 'complete'
                          ? <CircularProgress size={20} sx={{ color: '#2e7d32' }} />
                          : <CheckCircleOutline />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Report this user">
                    <span>
                      <IconButton
                        onClick={() => setReportDialogOpen(true)}
                        disabled={actionLoading === 'report'}
                        sx={{
                          color: brand.red,
                          '&:hover': { background: 'rgba(181,51,36,0.08)' },
                        }}
                      >
                        {actionLoading === 'report'
                          ? <CircularProgress size={20} sx={{ color: brand.red }} />
                          : <Flag />}
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>

              {/* Messages area */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  px: { xs: 2, md: 3 },
                  py: 2,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {msgsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress size={28} sx={{ color: brand.red }} />
                  </Box>
                ) : messages.length === 0 ? (
                  <Box
                    sx={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      color: brand.muted,
                    }}
                  >
                    <ChatBubbleOutlined sx={{ fontSize: 36, color: brand.tan }} />
                    <Typography sx={{ fontSize: 14 }}>No messages yet — say hello!</Typography>
                  </Box>
                ) : (
                  <>
                    {messages.map((msg, i) => {
                      const isMine = msg.sender_id === myUserId;
                      const prev = messages[i - 1];
                      const showDateDivider =
                        !prev ||
                        new Date(msg.created_at).toDateString() !==
                          new Date(prev.created_at).toDateString();

                      return (
                        <Box key={msg.id}>
                          {showDateDivider && (
                            <Box sx={{ textAlign: 'center', my: 2 }}>
                              <Typography
                                sx={{
                                  display: 'inline-block',
                                  fontSize: 11,
                                  color: brand.muted,
                                  background: 'rgba(223,188,148,0.3)',
                                  px: 1.5,
                                  py: 0.4,
                                  borderRadius: 99,
                                }}
                              >
                                {new Date(msg.created_at).toLocaleDateString([], {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </Typography>
                            </Box>
                          )}
                          <Bubble msg={msg} isMine={isMine} />
                        </Box>
                      );
                    })}
                    <div ref={bottomRef} />
                  </>
                )}
              </Box>

              {/* Input bar */}
              <Box
                sx={{
                  px: { xs: 2, md: 3 },
                  py: 1.5,
                  borderTop: `1px solid ${brand.tan}`,
                  backgroundColor: '#fff',
                  flexShrink: 0,
                }}
              >
                {sendError && (
                  <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }} onClose={clearSendError}>
                    {sendError}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <TextField
                  inputRef={inputRef}
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Message…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 6,
                      backgroundColor: '#fff',
                      fontSize: 14,
                      '& fieldset': { borderColor: brand.tan },
                      '&:hover fieldset': { borderColor: brand.gold },
                      '&.Mui-focused fieldset': { borderColor: brand.red },
                    },
                  }}
                />
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  sx={{
                    width: 42,
                    height: 42,
                    background:
                      input.trim()
                        ? `linear-gradient(135deg, ${brand.red}, ${brand.gold})`
                        : brand.tan,
                    color: '#fff',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                    '&:hover': {
                      background: input.trim()
                        ? `linear-gradient(135deg, ${brand.redDark}, ${brand.goldDark})`
                        : brand.tan,
                    },
                    '&.Mui-disabled': { background: brand.tan, color: '#fff' },
                  }}
                >
                  {sending ? (
                    <CircularProgress size={18} sx={{ color: '#fff' }} />
                  ) : (
                    <Send sx={{ fontSize: 18 }} />
                  )}
                </IconButton>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* Complete Transaction Dialog */}
      <Dialog open={completeDialogOpen} onClose={() => setCompleteDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#2c1a0e' }}>Complete Transaction?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Mark this exchange as done. The chat will be deleted and the item will be recorded as donated.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setCompleteDialogOpen(false)} sx={{ color: brand.muted }}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            variant="contained"
            sx={{ background: '#2e7d32', '&:hover': { background: '#1b5e20' }, borderRadius: 2 }}
          >
            Yes, Complete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report User Dialog */}
      <Dialog open={reportDialogOpen} onClose={() => setReportDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: brand.red }}>Report User?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to report <strong>{activeThread?.otherUserName}</strong>?
            Users reported 3 or more times will be automatically banned.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setReportDialogOpen(false)} sx={{ color: brand.muted }}>
            Cancel
          </Button>
          <Button
            onClick={handleReport}
            variant="contained"
            sx={{ background: brand.red, '&:hover': { background: brand.redDark }, borderRadius: 2 }}
          >
            Report
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}