import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  Chip,
} from '@mui/material';
import {
  VolunteerActivism,
  Checkroom,
  MenuBook,
  Blender,
  LocalLaundryService,
  Inventory2,
  CheckCircle,
  ArrowBack,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const API = import.meta.env.VITE_API_URL;

const brand = {
  red: '#B53324',
  redDark: '#922a1d',
  gold: '#E5A657',
  goldDark: '#c48d45',
  cream: '#F5E2CE',
  tan: '#DFBC94',
  muted: '#8a6d4b',
  bg: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
};

const CATEGORIES = [
  { value: 'Clothing',     icon: <Checkroom sx={{ fontSize: 28 }} />,          label: 'Clothing' },
  { value: 'Textbooks',    icon: <MenuBook sx={{ fontSize: 28 }} />,            label: 'Textbooks' },
  { value: 'Electronics',  icon: <Blender sx={{ fontSize: 28 }} />,             label: 'Electronics' },
  { value: 'Bedding',      icon: <LocalLaundryService sx={{ fontSize: 28 }} />, label: 'Bedding' },
  { value: 'Other',        icon: <Inventory2 sx={{ fontSize: 28 }} />,          label: 'Other' },
];

const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];

function PixelSparkle({ top, left, size = 8 }) {
  return (
    <Box sx={{
      position: 'absolute', top, left, width: size, height: size, zIndex: 0, pointerEvents: 'none',
      animation: 'sparkle 2.5s ease-in-out infinite',
      '@keyframes sparkle': {
        '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
        '50%': { opacity: 0.7, transform: 'scale(1.4)' },
      },
    }}>
      <svg width="100%" height="100%" viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="3" y="0" width="2" height="8" fill="#E5A657" />
        <rect x="0" y="3" width="8" height="2" fill="#E5A657" />
      </svg>
    </Box>
  );
}

export default function Donate() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: '',
    description: '',
    condition: '',
    quantity: 1,
    location: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/login'); return; }
      setSession(data.session);
    });
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((u) => setProfile(u))
      .catch(() => {});
  }, [session]);

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) { setError('Please select a category.'); return; }
    if (!form.condition) { setError('Please select a condition.'); return; }

    setLoading(true);
    try {

      let photoKey = null;
      // If user selected a photo, get presigned URL to upload photo to s3
      if (selectedFile) {
        const uploadUrlRes = await fetch(`${API}/uploads/presigned-url`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            filename: selectedFile.name,
            content_type: selectedFile.type,
          }),
        });

        // Checks if presigned URL request was successful
        if (!uploadUrlRes.ok) {
          const err = await uploadUrlRes.json();
          throw new Error(err.detail || `Upload URL failed: HTTP ${uploadUrlRes.status}`);
        }

        // Extract upload URL and object key from response
        const { upload_url, object_key } = await uploadUrlRes.json();

        // Upload photo directly to S3 using the presigned URL
        const s3Res = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': selectedFile.type,
          },
          body: selectedFile,
        });

        // Checks if S3 upload was successful
        if (!s3Res.ok) {
          throw new Error(`S3 upload failed: HTTP ${s3Res.status}`);
        }

        // Store the object key to save in the item record (can be used later to generate display URL)
        photoKey = object_key;
      }

      //Attempt donation form submission
      const res = await fetch(`${API}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), photo_urls: photoKey }),
      });

      //error in form submission
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      setSuccess(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', background: brand.bg, display: 'flex', flexDirection: 'column' }}>
        <Navbar profile={profile} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2 }}>
          <Box sx={{
            textAlign: 'center', maxWidth: 420,
            backgroundColor: '#fff', borderRadius: 4, p: 6,
            border: `1px solid ${brand.tan}`,
            boxShadow: '0 8px 32px rgba(181,51,36,0.08)',
          }}>
            <Box sx={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 3,
            }}>
              <CheckCircle sx={{ fontSize: 38, color: '#fff' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: 22, color: '#2c1a0e', mb: 1 }}>
              Item listed!
            </Typography>
            <Typography sx={{ color: brand.muted, fontSize: 14, mb: 4 }}>
              <strong style={{ color: brand.red }}>{form.name}</strong> is now visible to students
              looking for donations. Thank you for sharing!
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                onClick={() => { setSuccess(false); setForm({ name: '', category: '', description: '', condition: '', quantity: 1, location: '' }); setSelectedFile(null); }}
                sx={{
                  textTransform: 'none', fontWeight: 600, borderRadius: 2,
                  border: `1px solid ${brand.tan}`, color: brand.muted,
                  px: 3, '&:hover': { backgroundColor: brand.cream },
                }}
              >
                Donate another
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                sx={{
                  textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3,
                  background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
                  color: '#fff', '&:hover': { background: `linear-gradient(135deg, ${brand.redDark}, ${brand.goldDark})` },
                }}
              >
                Go to dashboard
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', background: brand.bg, display: 'flex', flexDirection: 'column' }}>
      <Navbar profile={profile} />

      <Box sx={{ flex: 1, maxWidth: 680, width: '100%', mx: 'auto', px: { xs: 2, md: 3 }, py: 5 }}>

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/dashboard')}
            sx={{ textTransform: 'none', color: brand.muted, fontWeight: 600, mb: 2, '&:hover': { backgroundColor: 'rgba(181,51,36,0.06)' } }}
          >
            Back to dashboard
          </Button>
          <Box sx={{
            background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
            borderRadius: 4, p: { xs: 3, md: 4 }, position: 'relative', overflow: 'hidden',
          }}>
            <PixelSparkle top="12%" left="82%" size={10} />
            <PixelSparkle top="65%" left="88%" size={7} />
            <PixelSparkle top="30%" left="92%" size={5} />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: 22, md: 26 }, color: '#fff', mb: 0.5 }}>
                Donate an Item
              </Typography>
              <Typography sx={{ color: '#F5E2CE', fontSize: 14 }}>
                Fill out the details below and your item will be visible to students right away.
              </Typography>
            </Box>
            <Box sx={{ position: 'absolute', bottom: 12, right: 20, opacity: 0.12 }}>
              <svg width="72" height="64" viewBox="0 0 16 14" shapeRendering="crispEdges">
                <rect x="2" y="0" width="4" height="2" fill="#fff" /><rect x="10" y="0" width="4" height="2" fill="#fff" />
                <rect x="0" y="2" width="8" height="2" fill="#fff" /><rect x="8" y="2" width="8" height="2" fill="#fff" />
                <rect x="0" y="4" width="16" height="2" fill="#fff" /><rect x="2" y="6" width="12" height="2" fill="#fff" />
                <rect x="4" y="8" width="8" height="2" fill="#fff" /><rect x="6" y="10" width="4" height="2" fill="#fff" />
              </svg>
            </Box>
          </Box>
        </Box>

        {/* Form card */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ backgroundColor: '#fff', borderRadius: 4, border: `1px solid ${brand.tan}`, overflow: 'hidden' }}
        >
          {error && (
            <Alert severity="error" sx={{ m: 3, mb: 0, borderRadius: 2, backgroundColor: '#fce8e6', color: brand.red }}>
              {error}
            </Alert>
          )}

          {/* ── Section 1: Item basics ── */}
          <Section label="What are you donating?" step="1">
            <TextField
              label="Item name"
              fullWidth
              required
              value={form.name}
              onChange={set('name')}
              placeholder="e.g. Winter jacket, Calculus textbook…"
              sx={fieldSx}
            />

            {/* Category picker */}
            <Typography sx={{ fontSize: 13, color: brand.muted, mb: 1.5 }}>Category</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1.5, mb: 0.5 }}>
              {CATEGORIES.map((cat) => {
                const active = form.category === cat.value;
                return (
                  <Box
                    key={cat.value}
                    onClick={() => setForm((p) => ({ ...p, category: cat.value }))}
                    sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 0.75, py: 2, px: 1, borderRadius: 3, cursor: 'pointer',
                      border: `2px solid ${active ? brand.red : brand.tan}`,
                      backgroundColor: active ? '#fef2f0' : '#faf8f5',
                      color: active ? brand.red : brand.muted,
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: brand.red, color: brand.red, backgroundColor: '#fef2f0' },
                    }}
                  >
                    {cat.icon}
                    <Typography sx={{ fontSize: 11, fontWeight: 600, textAlign: 'center', lineHeight: 1.2 }}>
                      {cat.label}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Section>

          <Divider />

          {/* ── Section 2: Details ── */}
          <Section label="Tell us about it" step="2">
            <TextField
              label="Description"
              fullWidth
              required
              multiline
              rows={3}
              value={form.description}
              onChange={set('description')}
              placeholder="Size, brand, what's included, any defects…"
              sx={fieldSx}
            />

            {/* Condition */}
            <Typography sx={{ fontSize: 13, color: brand.muted, mb: 1.5 }}>Condition</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
              {CONDITIONS.map((cond) => {
                const active = form.condition === cond;
                return (
                  <Chip
                    key={cond}
                    label={cond}
                    onClick={() => setForm((p) => ({ ...p, condition: cond }))}
                    sx={{
                      fontWeight: 600, fontSize: 13, px: 0.5, height: 36,
                      border: `2px solid ${active ? brand.red : brand.tan}`,
                      backgroundColor: active ? '#fef2f0' : '#faf8f5',
                      color: active ? brand.red : brand.muted,
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: '#fef2f0', borderColor: brand.red, color: brand.red },
                      '& .MuiChip-label': { px: 1.5 },
                    }}
                  />
                );
              })}
            </Box>

            <TextField
              label="Quantity"
              type="number"
              fullWidth
              required
              value={form.quantity}
              onChange={set('quantity')}
              inputProps={{ min: 1, max: 99 }}
              sx={{ ...fieldSx, mt: 3 }}
            />
          </Section>

          <Divider />

          <TextField
            type="file"
            fullWidth
            inputProps={{ accept: 'image/*' }}
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            sx={{ ...fieldSx, mt: 3 }}
          />

          <Divider />

          {/* ── Section 3: Pickup ── */}
          <Section label="Where can it be picked up?" step="3">
            <TextField
              label="Location"
              fullWidth
              required
              value={form.location}
              onChange={set('location')}
              placeholder="e.g. North Campus, Building A lobby…"
              sx={fieldSx}
            />
          </Section>

          {/* ── Submit ── */}
          <Box sx={{ px: 4, py: 3, borderTop: `1px solid ${brand.tan}`, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              disabled={loading}
              sx={{
                textTransform: 'none', fontWeight: 700, fontSize: 15,
                px: 5, py: 1.5, borderRadius: 3,
                background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
                color: '#fff', boxShadow: '0 4px 14px rgba(181,51,36,0.25)',
                '&:hover': { background: `linear-gradient(135deg, ${brand.redDark}, ${brand.goldDark})`, boxShadow: '0 6px 18px rgba(181,51,36,0.3)' },
                '&.Mui-disabled': { background: brand.tan, color: '#fff', boxShadow: 'none' },
              }}
            >
              {loading ? 'Listing…' : 'List item'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Navbar({ profile }) {
  const navigate = useNavigate();
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      px: { xs: 2, md: 5 }, py: 1.5,
      backgroundColor: 'rgba(255,250,245,0.92)', backdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${brand.tan}`, position: 'sticky', top: 0, zIndex: 10,
    }}>
      <Box component={Link} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: 2,
          background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <VolunteerActivism sx={{ color: brand.cream, fontSize: 18 }} />
        </Box>
        <Typography sx={{ fontWeight: 700, color: brand.red, fontSize: 17, letterSpacing: '-0.5px' }}>
          ShareLine
        </Typography>
      </Box>
      {profile && (
        <Avatar sx={{
          width: 32, height: 32, backgroundColor: brand.gold,
          color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
        }}
          onClick={() => navigate('/dashboard')}
        >
          {profile.name?.[0]?.toUpperCase() || '?'}
        </Avatar>
      )}
    </Box>
  );
}

function Section({ step, label, children }) {
  return (
    <Box sx={{ px: { xs: 3, md: 4 }, pt: 3.5, pb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Box sx={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{step}</Typography>
        </Box>
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#2c1a0e' }}>{label}</Typography>
      </Box>
      {children}
    </Box>
  );
}

function Divider() {
  return <Box sx={{ height: '1px', backgroundColor: brand.tan, mx: 4 }} />;
}

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: brand.tan },
    '&:hover fieldset': { borderColor: brand.gold },
    '&.Mui-focused fieldset': { borderColor: brand.red },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: brand.red },
};
