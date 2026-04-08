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
      navigate(activeRole === 'donor' ? '/donor/dashboard' : '/requester/dashboard');
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
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
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