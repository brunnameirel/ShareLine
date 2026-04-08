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

      // Store the active role for this session
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #f0fdf4 0%, #ecfeff 50%, #f0f9ff 100%)',
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
          borderColor: 'grey.200',
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
                background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                mb: 2,
              }}
            >
              <VolunteerActivism sx={{ color: '#fff', fontSize: 28 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Sign in to ShareLine
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
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
              sx={{ mb: 2.5 }}
              size="medium"
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
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
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    borderColor: '#16a34a',
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
                    backgroundColor: '#ecfeff',
                    color: '#0d9488',
                    borderColor: '#0d9488',
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
                background: 'linear-gradient(135deg, #16a34a, #0d9488)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #15803d, #0f766e)',
                },
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>

          {/* Footer */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Don't have an account?{' '}
            <Link
              to="/register"
              style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign up
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}