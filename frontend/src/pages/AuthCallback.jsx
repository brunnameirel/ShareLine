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
        console.log('Callback URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);

        const sessionResult = await supabase.auth.getSession();
        console.log('getSession result:', sessionResult);

        const {
          data: { session },
          error,
        } = sessionResult;

        if (error || !session) {
          console.log('No session or session error:', error);
          setStatus('Sign-in failed. Redirecting…');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }

        console.log('Session found:', session);

        const res = await fetch('http://localhost:8000/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        console.log('Profile response status:', res.status);

        if (res.ok) {
          navigate('/dashboard');
        } else if (res.status === 404) {
          navigate('/onboarding');
        } else {
          const text = await res.text();
          console.log('Profile response body:', text);
          navigate('/onboarding');
        }
      } catch (err) {
        console.error('Callback crash:', err);
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