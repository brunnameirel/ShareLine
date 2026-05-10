import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, VolunteerActivism } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeRole, setActiveRole] = useState('donor');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message || 'Failed to sign in with Google');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      localStorage.setItem('activeRole', activeRole);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
      }}
    >
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
            cursor: 'pointer',
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

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            component={Link}
            to="/register"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#B53324',
              '&:hover': { backgroundColor: '#F5E2CE' },
            }}
          >
            Register
          </Button>
      </Box>
    </Box>

    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
        px: 2,
      }}
    >
      <Card
        elevation={0}
        sx={{
          maxWidth: 440,
          width: '100%',
          borderRadius: 4,
          border: '1px solid',
          borderColor: '#DFBC94',
          backgroundColor: '#fff',
        }}
      >
        <CardContent sx={{ p: 5 }}>
          {/* Logo / Branding */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 52,
                height: 52,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #B53324, #E5A657)',
                mb: 2,
              }}
            >
              <VolunteerActivism sx={{ color: '#F5E2CE', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ color: '#B53324' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" sx={{ color: '#8a6d4b', mt: 0.5 }}>
              Sign in to ShareLine
            </Typography>
          </Box>

          {/* Error Alert */}
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

          {/* Google OAuth */}
          <Button
            fullWidth
            onClick={handleGoogleLogin}
            sx={{
              py: 1.4,
              mb: 3,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              color: '#3c2a14',
              backgroundColor: '#faf6f0',
              border: '1px solid #DFBC94',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              '&:hover': {
                backgroundColor: '#f3ebe0',
                borderColor: '#c9a56c',
              },
            }}
          >
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.01 24.01 0 0 0 0 21.56l7.98-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            Continue with Google
          </Button>

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ flex: 1, height: '1px', backgroundColor: '#DFBC94' }} />
            <Typography variant="body2" sx={{ px: 2, color: '#8a6d4b', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              or sign in with email
            </Typography>
            <Box sx={{ flex: 1, height: '1px', backgroundColor: '#DFBC94' }} />
          </Box>

          {/* Form */}
          <Box component="form" onSubmit={handleLogin}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': { borderColor: '#B53324' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#B53324' },
              }}
              size="medium"
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  '&.Mui-focused fieldset': { borderColor: '#B53324' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#B53324' },
              }}
              size="medium"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Role Selector */}
            <Typography variant="body2" sx={{ color: '#8a6d4b', mb: 1 }}>
              Log in as
            </Typography>
            <ToggleButtonGroup
              value={activeRole}
              exclusive
              onChange={(e, val) => val && setActiveRole(val)}
              fullWidth
              sx={{ mb: 3 }}
            >
              <ToggleButton
                value="donor"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  '&.Mui-selected': {
                    backgroundColor: '#F5E2CE',
                    color: '#B53324',
                    borderColor: '#B53324',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: '#f0d4b8',
                  },
                }}
              >
                Donor
              </ToggleButton>
              <ToggleButton
                value="requester"
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  '&.Mui-selected': {
                    backgroundColor: '#FFF3E0',
                    color: '#c48d45',
                    borderColor: '#E5A657',
                  },
                  '&.Mui-selected:hover': {
                    backgroundColor: '#ffe8cc',
                  },
                }}
              >
                Requester
              </ToggleButton>
            </ToggleButtonGroup>

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
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>

          {/* Footer */}
          <Typography variant="body2" sx={{ color: '#8a6d4b', textAlign: 'center', mt: 3 }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#B53324', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </Typography>
        </CardContent>
      </Card>
      </Box>
    </Box>
  );
}