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
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff, VolunteerActivism } from '@mui/icons-material';
import { supabase } from '../supabaseClient';

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDonor, setIsDonor] = useState(false);
  const [isRequester, setIsRequester] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (!isDonor && !isRequester) {
      setError('Please select at least one role.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up with Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            is_donor: isDonor,
            is_requester: isRequester,
          },
        },
      });

      if (authError) throw authError;

      // 2. Create profile in your backend
      const token = data.session?.access_token;
      if (token) {
        const res = await fetch('http://localhost:8000/auth/profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            name,
            is_donor: isDonor,
            is_requester: isRequester,
          }),
        });

        if (!res.ok) {
          const detail = await res.json();
          throw new Error(detail.detail || 'Failed to create profile');
        }
      }

      navigate('/login');
    } catch (err) {
      setError(err.message || 'Registration failed');
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
              Create your account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Join the Five College sharing community
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Form */}
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              label="Full Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ mb: 2.5 }}
              size="medium"
            />

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
              helperText="Must be at least 8 characters"
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

            {/* Role Selection */}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              I want to… (select at least one)
            </Typography>
            <FormGroup row sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDonor}
                    onChange={(e) => setIsDonor(e.target.checked)}
                    sx={{
                      '&.Mui-checked': { color: '#16a34a' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    Donate items
                  </Typography>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isRequester}
                    onChange={(e) => setIsRequester(e.target.checked)}
                    sx={{
                      '&.Mui-checked': { color: '#0d9488' },
                    }}
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={500}>
                    Request items
                  </Typography>
                }
              />
            </FormGroup>

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
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </Box>

          {/* Footer */}
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 3 }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}