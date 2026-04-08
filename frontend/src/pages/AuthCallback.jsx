import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { VolunteerActivism } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Finishing sign-in…');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Supabase automatically picks up the tokens/code from the URL
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error || !session) {
          setStatus('Sign-in failed. Redirecting…');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        // Check if the user already has a backend profile
        const res = await fetch('http://localhost:8000/auth/profile', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          // Profile exists — go straight to dashboard
          navigate('/dashboard');
        } else if (res.status === 404) {
          // No profile yet — send to onboarding to pick roles
          navigate('/onboarding');
        } else {
          // Some other error — try onboarding anyway
          navigate('/onboarding');
        }
      } catch {
        setStatus('Something went wrong. Redirecting…');
        setTimeout(() => navigate('/login'), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #B53324, #E5A657)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <VolunteerActivism sx={{ color: '#F5E2CE', fontSize: 30 }} />
      </Box>
      <CircularProgress size={28} sx={{ color: '#B53324' }} />
      <Typography variant="body2" sx={{ color: '#8a6d4b' }}>
        {status}
      </Typography>
    </Box>
  );
}