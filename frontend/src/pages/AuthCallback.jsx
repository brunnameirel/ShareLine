import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { VolunteerActivism } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

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

        // Check if a DB profile already exists via FastAPI (bypasses RLS)
        const res = await fetch(`${API}/auth/me`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        if (res.ok) {
          const userData = await res.json();
          // If neither role is set the user row was auto-created (DB trigger) but
          // onboarding was never completed — send them there to pick roles + name.
          if (!userData.is_donor && !userData.is_requester) {
            navigate('/onboarding');
          } else {
            navigate('/dashboard');
          }
        } else if (res.status === 404) {
          const meta = session.user.user_metadata;
          // Only auto-create if roles were explicitly set — this means it's an email-signup
          // user returning after email confirmation. Google OAuth users have meta.name from
          // Google but never have is_donor/is_requester, so they always go to onboarding.
          const hasRoles = meta?.is_donor !== undefined || meta?.is_requester !== undefined;
          if (meta?.name && hasRoles) {
            const createRes = await fetch(`${API}/auth/profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                email: session.user.email,
                name: meta.name,
                is_donor: meta.is_donor || false,
                is_requester: meta.is_requester || false,
              }),
            });

            if (createRes.ok) {
              await supabase
                .from('profiles')
                .upsert(
                  { id: session.user.id, email: session.user.email, name: meta.name },
                  { onConflict: 'id' }
                );
              navigate('/dashboard');
              return;
            }
          }
          navigate('/onboarding');
        } else {
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