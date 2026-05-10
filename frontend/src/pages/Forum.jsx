import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  TextField,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Avatar,
} from '@mui/material';
import { VolunteerActivism, Forum as ForumIcon, Add } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const brand = {
  red: '#B53324',
  gold: '#E5A657',
  cream: '#F5E2CE',
  tan: '#DFBC94',
  muted: '#8a6d4b',
};

const CATEGORIES = ['General', 'Tips', 'ISO', 'Campus'];

export default function Forum() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [openNew, setOpenNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newBody, setNewBody] = useState('');
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate('/login');
        return;
      }
      setSession(data.session);
    });
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 404) {
        navigate('/onboarding', {
          replace: true,
          state: { message: 'Finish setting up your ShareLine profile to use the forum.' },
        });
        return;
      }
      if (res.ok) setProfile(await res.json());
    })();
  }, [session, navigate]);

  const loadThreads = useCallback(async () => {
    if (!session || !profile) return;
    setLoading(true);
    const q = category ? `?category=${encodeURIComponent(category)}` : '';
    try {
      const res = await fetch(`${API}/forum/threads${q}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
      setThreads(await res.json());
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [session, profile, category]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleCreate = async () => {
    if (!session || !newTitle.trim() || !newBody.trim()) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch(`${API}/forum/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          body: newBody.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      const thread = await res.json();
      setOpenNew(false);
      setNewTitle('');
      setNewBody('');
      navigate(`/forum/${thread.id}`);
    } catch (e) {
      setCreateError(e.message || 'Could not create thread');
    } finally {
      setCreating(false);
    }
  };

  const initials = (name) =>
    (name || '?')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

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
          <Typography sx={{ fontWeight: 700, color: brand.red, fontSize: 17 }}>
            ShareLine
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenNew(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              background: brand.red,
              boxShadow: 'none',
              '&:hover': { background: '#922a1d', boxShadow: 'none' },
            }}
          >
            New thread
          </Button>
          {profile && (
            <Avatar
              onClick={() => navigate('/dashboard')}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: brand.gold,
                color: '#fff',
                cursor: 'pointer',
                fontSize: '0.8rem',
              }}
            >
              {initials(profile.name)}
            </Avatar>
          )}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 900, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <ForumIcon sx={{ fontSize: 36, color: brand.red }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: { xs: 22, md: 28 }, color: '#2c1a0e' }}>
              Community forum
            </Typography>
            <Typography sx={{ color: brand.muted, fontSize: 15 }}>
              Discuss donations, campus tips, or ISO posts — separate from private deal messages.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip
            label="All topics"
            onClick={() => setCategory('')}
            sx={{
              fontWeight: 600,
              border: `2px solid ${category === '' ? brand.red : brand.tan}`,
              backgroundColor: category === '' ? '#fef2f0' : '#faf8f5',
              color: category === '' ? brand.red : brand.muted,
            }}
          />
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={c}
              onClick={() => setCategory(c)}
              sx={{
                fontWeight: 600,
                border: `2px solid ${category === c ? brand.red : brand.tan}`,
                backgroundColor: category === c ? '#fef2f0' : '#faf8f5',
                color: category === c ? brand.red : brand.muted,
              }}
            />
          ))}
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: brand.red }} />
          </Box>
        ) : threads.length === 0 ? (
          <Typography sx={{ color: brand.muted, textAlign: 'center', py: 6 }}>
            No threads yet. Start the conversation with “New thread”.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {threads.map((t) => (
              <Box
                key={t.id}
                component={Link}
                to={`/forum/${t.id}`}
                sx={{
                  textDecoration: 'none',
                  backgroundColor: '#fff',
                  border: `1px solid ${brand.tan}`,
                  borderRadius: 2,
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 2,
                  transition: 'box-shadow 0.15s',
                  '&:hover': { boxShadow: '0 4px 14px rgba(181,51,36,0.12)' },
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: '#2c1a0e', mb: 0.5 }}>
                    {t.title}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: brand.muted }}>
                    {t.author_name} · {t.post_count} post{t.post_count === 1 ? '' : 's'} ·{' '}
                    {new Date(t.updated_at).toLocaleString()}
                  </Typography>
                </Box>
                <Chip
                  label={t.category}
                  size="small"
                  sx={{ fontWeight: 600, backgroundColor: brand.cream, color: brand.red }}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={openNew} onClose={() => !creating && setOpenNew(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New forum thread</DialogTitle>
        <DialogContent>
          {createError && (
            <Typography color="error" sx={{ mb: 2, fontSize: 14 }}>
              {createError}
            </Typography>
          )}
          <TextField
            select
            label="Category"
            fullWidth
            margin="normal"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Title"
            fullWidth
            margin="normal"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <TextField
            label="Opening message"
            fullWidth
            margin="normal"
            multiline
            minRows={4}
            value={newBody}
            onChange={(e) => setNewBody(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenNew(false)} disabled={creating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleCreate} disabled={creating}>
            {creating ? <CircularProgress size={22} /> : 'Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
