import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Avatar,
  IconButton,
} from '@mui/material';
import { VolunteerActivism, ArrowBack, Send } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const brand = {
  red: '#B53324',
  gold: '#E5A657',
  cream: '#F5E2CE',
  tan: '#DFBC94',
  muted: '#8a6d4b',
};

function initials(name) {
  return (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ForumThread() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/login');
        return;
      }
      setSession(data.session);
    });
  }, [navigate]);

  const load = async (tok) => {
    if (!threadId) return;
    setLoading(true);
    try {
      const me = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (me.status === 404) {
        navigate('/onboarding', {
          replace: true,
          state: { message: 'Finish setting up your ShareLine profile to use the forum.' },
        });
        return;
      }
      const res = await fetch(`${API}/forum/threads/${threadId}`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (!res.ok) throw new Error('Thread not found');
      setThread(await res.json());
    } catch {
      setThread(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session) return;
    load(session.access_token);
  }, [session, threadId]);

  const sendReply = async () => {
    if (!session || !reply.trim()) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`${API}/forum/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setReply('');
      await load(session.access_token);
    } catch (e) {
      setError(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFAF5' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 5 },
          py: 1.5,
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0e0cc',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton component={Link} to="/forum" size="small" sx={{ color: brand.red }}>
            <ArrowBack />
          </IconButton>
          <Box
            component={Link}
            to="/dashboard"
            sx={{ display: 'flex', alignItems: 'center', gap: 1, textDecoration: 'none' }}
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
          </Box>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 780, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: brand.red }} />
          </Box>
        ) : !thread ? (
          <Typography sx={{ color: brand.muted }}>Thread not found.</Typography>
        ) : (
          <>
            <Typography sx={{ fontWeight: 800, fontSize: { xs: 22, md: 28 }, color: '#2c1a0e', mb: 1 }}>
              {thread.title}
            </Typography>
            <Typography sx={{ color: brand.muted, mb: 4, fontSize: 14 }}>
              {thread.category} · started by {thread.author_name}
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {thread.posts.map((p) => (
                <Box
                  key={p.id}
                  sx={{
                    backgroundColor: '#fff',
                    border: `1px solid ${brand.tan}`,
                    borderRadius: 2,
                    p: 2,
                    display: 'flex',
                    gap: 2,
                  }}
                >
                  <Avatar sx={{ bgcolor: brand.gold, width: 40, height: 40 }}>
                    {initials(p.author_name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: '#2c1a0e', fontSize: 14 }}>
                      {p.author_name}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: brand.muted, mb: 1 }}>
                      {new Date(p.created_at).toLocaleString()}
                    </Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap', color: '#3d2c1e', fontSize: 15 }}>
                      {p.body}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 4, pt: 3, borderTop: `1px solid ${brand.tan}` }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Reply</Typography>
              {error && (
                <Typography color="error" sx={{ mb: 1, fontSize: 14 }}>
                  {error}
                </Typography>
              )}
              <TextField
                fullWidth
                multiline
                minRows={3}
                placeholder="Write your reply…"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                startIcon={sending ? <CircularProgress size={18} color="inherit" /> : <Send />}
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  background: brand.red,
                  boxShadow: 'none',
                  '&:hover': { background: '#922a1d', boxShadow: 'none' },
                }}
              >
                Post reply
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
