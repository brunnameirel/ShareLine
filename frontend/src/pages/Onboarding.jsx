import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  ButtonBase,
} from '@mui/material';
import {
  VolunteerActivism,
  CardGiftcard,
  Inventory2Outlined,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

export default function Onboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isDonor, setIsDonor] = useState(false);
  const [isRequester, setIsRequester] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) {
        navigate('/login');
        return;
      }
      setSession(s);
      // Pre-fill name from OAuth metadata if available
      const meta = s.user?.user_metadata;
      if (meta?.full_name) setName(meta.full_name);
      else if (meta?.name) setName(meta.name);
    });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isDonor && !isRequester) {
      setError('Pick at least one role to get started.');
      return;
    }

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setLoading(true);

    try {
      // Create the user row via FastAPI (bypasses RLS)
      const res = await fetch('http://localhost:8000/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: session.user.email,
          name: name.trim(),
          is_donor: isDonor,
          is_requester: isRequester,
        }),
      });

      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail.detail || 'Failed to create profile');
      }

      // Also save name to profiles table (where the DB actually stores it)
      await supabase
        .from('profiles')
        .upsert(
          { id: session.user.id, email: session.user.email, name: name.trim() },
          { onConflict: 'id' }
        );

      // Keep auth metadata in sync
      await supabase.auth.updateUser({
        data: { name: name.trim(), is_donor: isDonor, is_requester: isRequester },
      });

      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const RoleCard = ({ selected, onToggle, icon, title, description }) => (
    <ButtonBase
      onClick={onToggle}
      sx={{
        flex: 1,
        borderRadius: 3,
        border: '2px solid',
        borderColor: selected ? '#B53324' : '#e0d3c1',
        backgroundColor: selected ? '#fef7f0' : '#fff',
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        transition: 'all 0.2s ease',
        '&:hover': {
          borderColor: selected ? '#B53324' : '#DFBC94',
          backgroundColor: selected ? '#fef7f0' : '#fdfaf5',
        },
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2.5,
          background: selected
            ? 'linear-gradient(135deg, #B53324, #E5A657)'
            : '#f0e6d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        {icon(selected)}
      </Box>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: selected ? '#B53324' : '#6b5740' }}
      >
        {title}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: '#8a6d4b', textAlign: 'center', lineHeight: 1.4 }}
      >
        {description}
      </Typography>
    </ButtonBase>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
      }}
    >
      {/* Navbar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 6 },
          py: 2,
          backgroundColor: 'rgba(255,250,245,0.9)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box
          component={Link}
          to="/"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            textDecoration: 'none',
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #B53324, #E5A657)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VolunteerActivism sx={{ color: '#F5E2CE', fontSize: 20 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#B53324', letterSpacing: '-0.5px' }}
          >
            ShareLine
          </Typography>
        </Box>
      </Box>

      {/* Content */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: 6,
        }}
      >
        <Card
          elevation={0}
          sx={{
            maxWidth: 480,
            width: '100%',
            borderRadius: 4,
            border: '1px solid',
            borderColor: '#DFBC94',
            backgroundColor: '#fff',
          }}
        >
          <CardContent sx={{ p: 5 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#B53324' }}>
                Almost there!
              </Typography>
              <Typography variant="body2" sx={{ color: '#8a6d4b', mt: 0.5 }}>
                Tell us a bit about how you'd like to use ShareLine
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: '#fce8e6',
                  color: '#B53324',
                }}
              >
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label="Your name"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': { borderColor: '#B53324' },
                  },
                  '& .MuiInputLabel-root.Mui-focused': { color: '#B53324' },
                }}
                size="medium"
              />

              <Typography variant="body2" sx={{ color: '#8a6d4b', mb: 1.5 }}>
                I want to… (select at least one)
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
                <RoleCard
                  selected={isDonor}
                  onToggle={() => setIsDonor(!isDonor)}
                  icon={(sel) => (
                    <CardGiftcard
                      sx={{ color: sel ? '#F5E2CE' : '#8a6d4b', fontSize: 24 }}
                    />
                  )}
                  title="Donate"
                  description="Share items with your community"
                />
                <RoleCard
                  selected={isRequester}
                  onToggle={() => setIsRequester(!isRequester)}
                  icon={(sel) => (
                    <Inventory2Outlined
                      sx={{ color: sel ? '#F5E2CE' : '#8a6d4b', fontSize: 24 }}
                    />
                  )}
                  title="Request"
                  description="Find items you need"
                />
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  background: 'linear-gradient(135deg, #B53324, #E5A657)',
                  boxShadow: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #922a1d, #c48d45)',
                    boxShadow: 'none',
                  },
                }}
              >
                {loading ? 'Setting up…' : 'Get Started'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}