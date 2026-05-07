import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Avatar, Chip, TextField,
  Skeleton, Divider, Switch, FormControlLabel,
} from '@mui/material';
import {
  VolunteerActivism, Edit, Logout, CheckCircle,
  Checkroom, MenuBook, Blender, LocalLaundryService, Inventory2,
  FavoriteBorder, CardGiftcard,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import ItemImage from '../components/ItemImages.jsx';

const API = import.meta.env.VITE_API_URL;

const brand = {
  red: '#B53324', redDark: '#922a1d',
  gold: '#E5A657', goldDark: '#c48d45',
  cream: '#F5E2CE', tan: '#DFBC94',
  muted: '#8a6d4b',
};

const categoryIcons = {
  Clothing:    <Checkroom sx={{ fontSize: 18 }} />,
  Textbooks:   <MenuBook sx={{ fontSize: 18 }} />,
  Electronics: <Blender sx={{ fontSize: 18 }} />,
  Bedding:     <LocalLaundryService sx={{ fontSize: 18 }} />,
  Other:       <Inventory2 sx={{ fontSize: 18 }} />,
};

const statusColors = {
  Available: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Pending:   { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
  Approved:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Rejected:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  Completed: { bg: '#f5f5f5', color: '#8a6d4b', border: '#e0e0e0' },
};

export default function Profile() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [myItems, setMyItems] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDonor, setEditDonor] = useState(false);
  const [editRequester, setEditRequester] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/login'); return; }
      setSession(data.session);
    });
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    const load = async () => {
      // Profile
      const res = await fetch(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const user = await res.json();
      setProfile(user);
      setEditName(user.name);
      setEditDonor(user.is_donor);
      setEditRequester(user.is_requester);

      // Items (donor)
      const { data: items } = await supabase
        .from('item')
        .select('id, name, category, status, condition, photo_urls')
        .eq('donor_id', user.id)
        .order('created_at', { ascending: false });
      setMyItems(items || []);

      // Requests (requester)
      const { data: reqs } = await supabase
        .from('request')
        .select('id, status, requested_quantity, item:item_id(name, category, photo_urls)')
        .eq('requester_id', user.id)
        .order('created_at', { ascending: false });
      setMyRequests(reqs || []);

      setLoading(false);
    };
    load();
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API}/auth/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ name: editName, is_donor: editDonor, is_requester: editRequester }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = await res.json();
      setProfile(updated);
      setSaveSuccess(true);
      setEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const initials = (name = '') => name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  const donatedCount = myItems.length;
  const completedCount = myItems.filter((i) => i.status === 'Completed').length;
  const requestsCount = myRequests.length;
  const approvedCount = myRequests.filter((r) => r.status === 'Approved').length;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFAF5' }}>

      {/* Navbar */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: { xs: 2, md: 5 }, py: 1.5, backgroundColor: '#fff',
        borderBottom: '1px solid #f0e0cc', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Box component={Link} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VolunteerActivism sx={{ color: brand.cream, fontSize: 18 }} />
          </Box>
          <Typography sx={{ fontWeight: 700, color: brand.red, fontSize: 17, letterSpacing: '-0.5px' }}>ShareLine</Typography>
        </Box>
        <Button
          onClick={handleSignOut}
          startIcon={<Logout sx={{ fontSize: 18 }} />}
          sx={{ textTransform: 'none', fontWeight: 600, color: brand.muted, borderRadius: 2, '&:hover': { backgroundColor: '#fef2f0', color: brand.red } }}
        >
          Sign out
        </Button>
      </Box>

      <Box sx={{ maxWidth: 780, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>

        {/* ── Profile card ── */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: 4, border: `1px solid ${brand.tan}`, overflow: 'hidden', mb: 3 }}>

          {/* Banner */}
          <Box sx={{ height: 100, background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`, position: 'relative' }}>
            {/* pixel heart */}
            <Box sx={{ position: 'absolute', bottom: 12, right: 24, opacity: 0.15 }}>
              <svg width="56" height="52" viewBox="0 0 14 13" shapeRendering="crispEdges">
                <rect x="1" y="0" width="4" height="2" fill="#fff" /><rect x="9" y="0" width="4" height="2" fill="#fff" />
                <rect x="0" y="2" width="6" height="2" fill="#fff" /><rect x="8" y="2" width="6" height="2" fill="#fff" />
                <rect x="0" y="4" width="14" height="2" fill="#fff" />
                <rect x="1" y="6" width="12" height="2" fill="#fff" />
                <rect x="2" y="8" width="10" height="2" fill="#fff" />
                <rect x="3" y="10" width="8" height="2" fill="#fff" />
                <rect x="5" y="12" width="4" height="1" fill="#fff" />
              </svg>
            </Box>
          </Box>

          <Box sx={{ px: { xs: 3, md: 4 }, pb: 3 }}>
            {/* Avatar + name row */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mt: -5, mb: 2 }}>
              {loading ? (
                <Skeleton variant="circular" width={80} height={80} />
              ) : (
                <Avatar sx={{
                  width: 80, height: 80, fontSize: 28, fontWeight: 700,
                  background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
                  border: '4px solid #fff', boxShadow: '0 4px 14px rgba(181,51,36,0.2)',
                }}>
                  {initials(profile?.name)}
                </Avatar>
              )}
              <Button
                startIcon={<Edit sx={{ fontSize: 16 }} />}
                onClick={() => { setEditing((e) => !e); setSaveSuccess(false); setSaveError(''); }}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: 13, color: brand.muted, border: `1px solid ${brand.tan}`, borderRadius: 2, px: 2, '&:hover': { backgroundColor: brand.cream, borderColor: brand.gold } }}
              >
                {editing ? 'Cancel' : 'Edit profile'}
              </Button>
            </Box>

            {loading ? (
              <>
                <Skeleton width={160} height={28} />
                <Skeleton width={220} height={18} sx={{ mt: 0.5 }} />
              </>
            ) : editing ? (
              /* ── Edit form ── */
              <Box>
                <TextField
                  label="Display name"
                  fullWidth
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  size="small"
                  sx={{
                    mb: 2.5,
                    '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: brand.tan }, '&.Mui-focused fieldset': { borderColor: brand.red } },
                    '& .MuiInputLabel-root.Mui-focused': { color: brand.red },
                  }}
                />
                <Typography sx={{ fontSize: 13, color: brand.muted, mb: 1 }}>Roles</Typography>
                <Box sx={{ display: 'flex', gap: 2, mb: 2.5 }}>
                  <FormControlLabel
                    control={<Switch checked={editDonor} onChange={(e) => setEditDonor(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: brand.red }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brand.red } }} />}
                    label={<Typography sx={{ fontSize: 14, fontWeight: 600, color: '#2c1a0e' }}>Donor</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={editRequester} onChange={(e) => setEditRequester(e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: brand.gold }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: brand.gold } }} />}
                    label={<Typography sx={{ fontSize: 14, fontWeight: 600, color: '#2c1a0e' }}>Requester</Typography>}
                  />
                </Box>
                {saveError && <Typography sx={{ fontSize: 13, color: brand.red, mb: 1.5 }}>{saveError}</Typography>}
                <Button
                  onClick={handleSave}
                  disabled={saving || !editName.trim()}
                  sx={{
                    textTransform: 'none', fontWeight: 700, px: 4, py: 1, borderRadius: 2,
                    background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
                    color: '#fff', '&:hover': { background: `linear-gradient(135deg, ${brand.redDark}, ${brand.goldDark})` },
                    '&.Mui-disabled': { background: brand.tan, color: '#fff' },
                  }}
                >
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </Box>
            ) : (
              /* ── View mode ── */
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 22, color: '#2c1a0e' }}>{profile?.name}</Typography>
                  {saveSuccess && <CheckCircle sx={{ fontSize: 18, color: '#16a34a' }} />}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {profile?.is_donor && (
                    <Chip icon={<CardGiftcard sx={{ fontSize: 14 }} />} label="Donor" size="small"
                      sx={{ backgroundColor: '#fef2f0', color: brand.red, border: `1px solid #f5c0b8`, fontWeight: 600, fontSize: 12 }} />
                  )}
                  {profile?.is_requester && (
                    <Chip icon={<FavoriteBorder sx={{ fontSize: 14 }} />} label="Requester" size="small"
                      sx={{ backgroundColor: '#FFF3E0', color: brand.gold, border: `1px solid #ffe0b2`, fontWeight: 600, fontSize: 12 }} />
                  )}
                </Box>
              </Box>
            )}
          </Box>

          {/* Stats row */}
          {!loading && !editing && (
            <>
              <Divider sx={{ borderColor: brand.tan }} />
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {[
                  { label: 'Items listed', value: donatedCount },
                  { label: 'Completed', value: completedCount },
                  { label: 'Requests sent', value: requestsCount },
                  { label: 'Approved', value: approvedCount },
                ].map((stat, i) => (
                  <Box key={i} sx={{ textAlign: 'center', py: 2.5, borderRight: i < 3 ? `1px solid ${brand.tan}` : 'none' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 22, color: brand.red }}>{stat.value}</Typography>
                    <Typography sx={{ fontSize: 12, color: brand.muted, mt: 0.2 }}>{stat.label}</Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}
        </Box>

        {/* ── My Donations ── */}
        {(loading || myItems.length > 0) && (
          <Section title="My Donations" icon={<CardGiftcard sx={{ fontSize: 18, color: brand.red }} />}>
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} height={56} sx={{ borderRadius: 2, mb: 1 }} />)
            ) : myItems.map((item) => (
              <Box key={item.id} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.5, borderRadius: 2, mb: 1,
                backgroundColor: '#faf8f5', border: `1px solid ${brand.tan}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 140, height: 140, borderRadius: 2, overflow: 'hidden', backgroundColor: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.gold }}>
                    {item.photo_urls ? (
                      <ItemImage objectKey={item.photo_urls} alt={item.name} height={140} />
                    ) : (
                      categoryIcons[item.category] || categoryIcons.Other
                    )}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#2c1a0e' }}>{item.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: brand.muted }}>{item.category} · {item.condition}</Typography>
                  </Box>
                </Box>
                <Chip label={item.status} size="small" sx={{
                  fontWeight: 600, fontSize: 11, height: 24,
                  backgroundColor: statusColors[item.status]?.bg,
                  color: statusColors[item.status]?.color,
                  border: `1px solid ${statusColors[item.status]?.border}`,
                }} />
              </Box>
            ))}
            {!loading && myItems.length === 0 && (
              <Typography sx={{ color: brand.muted, fontSize: 14, textAlign: 'center', py: 3 }}>No donations yet.</Typography>
            )}
          </Section>
        )}

        {/* ── My Requests ── */}
        {(loading || myRequests.length > 0) && (
          <Section title="My Requests" icon={<FavoriteBorder sx={{ fontSize: 18, color: brand.gold }} />}>
            {loading ? (
              [0, 1, 2].map((i) => <Skeleton key={i} height={56} sx={{ borderRadius: 2, mb: 1 }} />)
            ) : myRequests.map((req) => (
              <Box key={req.id} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2, py: 1.5, borderRadius: 2, mb: 1,
                backgroundColor: '#faf8f5', border: `1px solid ${brand.tan}`,
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 140, height: 140, borderRadius: 2, overflow: 'hidden', backgroundColor: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.gold }}>
                    {req.item?.photo_urls ? (
                      <ItemImage objectKey={req.item.photo_urls} alt={req.item.name} height={140} />
                    ) : (
                      categoryIcons[req.item?.category] || categoryIcons.Other
                    )}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#2c1a0e' }}>{req.item?.name}</Typography>
                    <Typography sx={{ fontSize: 12, color: brand.muted }}>Qty: {req.requested_quantity}</Typography>
                  </Box>
                </Box>
                <Chip label={req.status} size="small" sx={{
                  fontWeight: 600, fontSize: 11, height: 24,
                  backgroundColor: statusColors[req.status]?.bg,
                  color: statusColors[req.status]?.color,
                  border: `1px solid ${statusColors[req.status]?.border}`,
                }} />
              </Box>
            ))}
          </Section>
        )}

        {/* ── Danger zone ── */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: 4, border: `1px solid ${brand.tan}`, p: 3 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#2c1a0e', mb: 0.5 }}>Account</Typography>
          <Typography sx={{ fontSize: 13, color: brand.muted, mb: 2 }}>Sign out of your ShareLine account on this device.</Typography>
          <Button
            onClick={handleSignOut}
            startIcon={<Logout sx={{ fontSize: 16 }} />}
            sx={{ textTransform: 'none', fontWeight: 600, color: brand.red, border: `1px solid #f5c0b8`, borderRadius: 2, px: 3, '&:hover': { backgroundColor: '#fef2f0' } }}
          >
            Sign out
          </Button>
        </Box>

      </Box>
    </Box>
  );
}

function Section({ title, icon, children }) {
  return (
    <Box sx={{ backgroundColor: '#fff', borderRadius: 4, border: `1px solid ${brand.tan}`, p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5 }}>
        {icon}
        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#2c1a0e' }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}
