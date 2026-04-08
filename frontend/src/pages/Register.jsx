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
              Create your account
            </Typography>
            <Typography variant="body2" sx={{ color: '#8a6d4b', mt: 0.5 }}>
              Join the Five College sharing community
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
          <Box component="form" onSubmit={handleRegister}>
            <TextField
              label="Full Name"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              helperText="Must be at least 8 characters"
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

            {/* Role Selection */}
            <Typography variant="body2" sx={{ color: '#8a6d4b', mb: 0.5 }}>
              I want to… (select at least one)
            </Typography>
            <FormGroup row sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isDonor}
                    onChange={(e) => setIsDonor(e.target.checked)}
                    sx={{
                      '&.Mui-checked': { color: '#B53324' },
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
                      '&.Mui-checked': { color: '#E5A657' },
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
                background: 'linear-gradient(135deg, #B53324, #E5A657)',
                boxShadow: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #922a1d, #c48d45)',
                  boxShadow: 'none',
                },
              }}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </Button>
          </Box>

          {/* Footer */}
          <Typography variant="body2" sx={{ color: '#8a6d4b', textAlign: 'center', mt: 3 }}>
            Already have an account?{' '}
            <Link
              to="/login"
              style={{ color: '#B53324', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign in
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}