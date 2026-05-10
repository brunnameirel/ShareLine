import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  VolunteerActivism,
  CardGiftcard,
  ArrowBack,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const brand = {
  red: '#B53324',
  gold: '#E5A657',
  cream: '#F5E2CE',
  tan: '#DFBC94',
  muted: '#8a6d4b',
  ink: '#2c1a0e',
};

const fmtUsd = (n) =>
  new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const fmtKg = (n) =>
  `${new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(n)} kg`;

function Metric({ label, value, hint }) {
  return (
    <Box sx={{ py: 1.25, borderBottom: '1px solid #faf5ef', '&:last-of-type': { borderBottom: 'none' } }}>
      <Typography variant="caption" sx={{ color: brand.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.4 }}>
        {label}
      </Typography>
      <Typography sx={{ fontWeight: 700, fontSize: '1.35rem', color: brand.ink, lineHeight: 1.2 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" sx={{ color: brand.muted, display: 'block', mt: 0.25 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

function ImpactCard({ title, icon, children, accent }) {
  return (
    <Box
      sx={{
        backgroundColor: '#fff',
        border: '1px solid #f0e0cc',
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(44, 26, 14, 0.05)',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          background: accent || `linear-gradient(135deg, ${brand.red}15, ${brand.gold}18)`,
          borderBottom: '1px solid #f0e0cc',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: brand.red,
            border: `1px solid ${brand.tan}`,
          }}
        >
          {icon}
        </Box>
        <Typography sx={{ fontWeight: 700, color: brand.ink, fontSize: '1.05rem' }}>{title}</Typography>
      </Box>
      <Box sx={{ px: 2.5, py: 1 }}>{children}</Box>
    </Box>
  );
}

export default function Impact() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: d }) => {
      if (!d.session) {
        navigate('/login');
        return;
      }
      setSession(d.session);
    });
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      const me = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (me.status === 404) {
        navigate('/onboarding', { replace: true });
        return;
      }
      if (me.ok) setProfile(await me.json());
    })();
  }, [session, navigate]);

  const loadImpact = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/impact/summary`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error('Could not load impact stats.');
      setData(await res.json());
    } catch (e) {
      setError(e.message || 'Something went wrong.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadImpact();
  }, [loadImpact]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFAF5' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 2, md: 5 },
          py: 1.5,
          backgroundColor: '#fff',
          borderBottom: '1px solid #f0e0cc',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box component={Link} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VolunteerActivism sx={{ color: brand.cream, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: brand.red, fontSize: 17, letterSpacing: '-0.5px' }}>ShareLine</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {profile && (
            <Avatar
              onClick={() => navigate('/dashboard')}
              sx={{
                width: 32,
                height: 32,
                backgroundColor: brand.gold,
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {profile.name?.[0]?.toUpperCase() || '?'}
            </Avatar>
          )}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Button
          component={Link}
          to="/dashboard"
          startIcon={<ArrowBack />}
          sx={{ textTransform: 'none', color: brand.muted, fontWeight: 600, mb: 2 }}
        >
          Dashboard
        </Button>

        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 26, md: 32 }, color: brand.ink, mb: 0.75 }}>
            Impact dashboard
          </Typography>
          <Typography sx={{ color: brand.muted, fontSize: 15, maxWidth: 560 }}>
            Rough estimates of how reuse saves money and emissions. Celebrate progress, not perfection.
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress sx={{ color: brand.red }} />
          </Box>
        )}

        {!loading && data && (
          <>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              {data.methodology_note}
            </Alert>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              <ImpactCard title="Your giving" icon={<VolunteerActivism />} accent={`linear-gradient(135deg, ${brand.red}12, #fff)`}>
                <Metric label="Items listed" value={data.giving.items_listed} />
                <Metric label="Units listed" value={data.giving.units_listed} hint="Total quantity across your ShareLine donations." />
                <Metric label="Est. value circulated" value={fmtUsd(data.giving.estimated_value_usd)} />
                <Metric label="Est. CO₂ avoided" value={fmtKg(data.giving.estimated_co2_kg_saved)} hint="Illustrative reuse savings." />
              </ImpactCard>

              <ImpactCard title="Your receiving" icon={<CardGiftcard />} accent={`linear-gradient(135deg, ${brand.gold}20, #fff)`}>
                <Metric label="Active requests" value={data.receiving.active_requests} hint="Pending, approved, or completed (excludes rejected)." />
                <Metric label="Units requested" value={data.receiving.units_requested} />
                <Metric label="Est. value requested" value={fmtUsd(data.receiving.estimated_value_usd)} />
                <Metric label="Est. CO₂ avoided" value={fmtKg(data.receiving.estimated_co2_kg_saved)} />
              </ImpactCard>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}
