import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, Avatar, Chip,
  InputAdornment, CircularProgress, Dialog, DialogContent,
  IconButton, Skeleton,
} from '@mui/material';
import {
  VolunteerActivism, Search, Checkroom, MenuBook, Blender,
  LocalLaundryService, Inventory2, Close, LocationOn,
  Person, CheckCircle,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import ItemImage from '../components/ItemImages.jsx';

const API = import.meta.env.VITE_API_URL;

const brand = {
  red: '#B53324', redDark: '#922a1d',
  gold: '#E5A657', goldDark: '#c48d45',
  cream: '#F5E2CE', tan: '#DFBC94',
  muted: '#8a6d4b',
  bg: 'linear-gradient(145deg, #F5E2CE 0%, #DFBC94 50%, #F5E2CE 100%)',
};

const CATEGORIES = [
  { value: '',            label: 'All',         icon: null },
  { value: 'Clothing',   label: 'Clothing',     icon: <Checkroom sx={{ fontSize: 16 }} /> },
  { value: 'Textbooks',  label: 'Textbooks',    icon: <MenuBook sx={{ fontSize: 16 }} /> },
  { value: 'Electronics',label: 'Electronics',  icon: <Blender sx={{ fontSize: 16 }} /> },
  { value: 'Bedding',    label: 'Bedding',      icon: <LocalLaundryService sx={{ fontSize: 16 }} /> },
  { value: 'Other',      label: 'Other',        icon: <Inventory2 sx={{ fontSize: 16 }} /> },
];

const CATEGORY_BIG_ICONS = {
  Clothing:    <Checkroom sx={{ fontSize: 40 }} />,
  Textbooks:   <MenuBook sx={{ fontSize: 40 }} />,
  Electronics: <Blender sx={{ fontSize: 40 }} />,
  Bedding:     <LocalLaundryService sx={{ fontSize: 40 }} />,
  Other:       <Inventory2 sx={{ fontSize: 40 }} />,
};

const CONDITIONS = ['', 'New', 'Like New', 'Good', 'Fair'];

const conditionColor = {
  New:      { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  'Like New':{ bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Good:     { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
  Fair:     { bg: '#f5f5f5', color: '#8a6d4b', border: '#e0e0e0' },
};

export default function Browse() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  const [selected, setSelected] = useState(null); // item for detail modal
  const [requesting, setRequesting] = useState(false);
  const [requestDone, setRequestDone] = useState(false);
  const [requestError, setRequestError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/login'); return; }
      setSession(data.session);
    });
  }, [navigate]);

  useEffect(() => {
    if (!session) return;
    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json()).then(setProfile).catch(() => {});
  }, [session]);

  const fetchItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (category)  params.set('category', category);
    if (condition) params.set('condition', condition);
    if (search)    params.set('search', search);

    try {
      const res = await fetch(`${API}/items?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session, category, condition, search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const openItem = (item) => {
    setSelected(item);
    setRequestDone(false);
    setRequestError('');
  };

  const closeItem = () => { setSelected(null); setRequestDone(false); setRequestError(''); };

  const handleRequest = async () => {
    if (!selected || !session) return;
    setRequesting(true);
    setRequestError('');
    try {
      const res = await fetch(`${API}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ item_id: selected.id, requested_quantity: 1 }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      setRequestDone(true);
    } catch (e) {
      setRequestError(e.message);
    } finally {
      setRequesting(false);
    }
  };

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Button component={Link} to="/donate" sx={{ textTransform: 'none', fontWeight: 600, color: brand.red, border: `1px solid ${brand.tan}`, borderRadius: 2, px: 2, '&:hover': { backgroundColor: brand.cream } }}>
            Donate
          </Button>
          {profile && (
            <Avatar onClick={() => navigate('/dashboard')} sx={{ width: 32, height: 32, backgroundColor: brand.gold, color: '#fff', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}>
              {profile.name?.[0]?.toUpperCase() || '?'}
            </Avatar>
          )}
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

        {/* Hero */}
        <Box sx={{ mb: 4 }}>
          <Typography sx={{ fontWeight: 700, fontSize: { xs: 24, md: 30 }, color: '#2c1a0e', mb: 0.5 }}>
            Browse Items
          </Typography>
          <Typography sx={{ color: brand.muted, fontSize: 15 }}>
            Free items donated by students on campus — request what you need.
          </Typography>
        </Box>

        {/* Search + filters */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: 3, border: `1px solid ${brand.tan}`, p: 3, mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search by name or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search sx={{ color: brand.muted, fontSize: 20 }} /></InputAdornment>,
            }}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': { borderColor: brand.tan },
                '&:hover fieldset': { borderColor: brand.gold },
                '&.Mui-focused fieldset': { borderColor: brand.red },
              },
            }}
          />

          {/* Category filter */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            {CATEGORIES.map((cat) => {
              const active = category === cat.value;
              return (
                <Chip
                  key={cat.value}
                  icon={cat.icon || undefined}
                  label={cat.label}
                  onClick={() => setCategory(cat.value)}
                  sx={{
                    fontWeight: 600, fontSize: 13,
                    border: `2px solid ${active ? brand.red : brand.tan}`,
                    backgroundColor: active ? '#fef2f0' : '#faf8f5',
                    color: active ? brand.red : brand.muted,
                    '&:hover': { backgroundColor: '#fef2f0', borderColor: brand.red, color: brand.red },
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
              );
            })}
          </Box>

          {/* Condition filter */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {CONDITIONS.map((cond) => {
              const active = condition === cond;
              const label = cond || 'Any condition';
              return (
                <Chip
                  key={cond}
                  label={label}
                  onClick={() => setCondition(cond)}
                  size="small"
                  sx={{
                    fontWeight: 600, fontSize: 12,
                    border: `1.5px solid ${active ? brand.red : brand.tan}`,
                    backgroundColor: active ? '#fef2f0' : 'transparent',
                    color: active ? brand.red : brand.muted,
                    '&:hover': { backgroundColor: '#fef2f0', borderColor: brand.red, color: brand.red },
                  }}
                />
              );
            })}
          </Box>
        </Box>

        {/* Results count */}
        {!loading && (
          <Typography sx={{ color: brand.muted, fontSize: 13, mb: 2 }}>
            {items.length} item{items.length !== 1 ? 's' : ''} available
          </Typography>
        )}

        {/* Grid */}
        {loading ? (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5 }}>
            {[...Array(8)].map((_, i) => (
              <Box key={i} sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${brand.tan}`, backgroundColor: '#fff' }}>
                <Skeleton variant="rectangular" height={140} />
                <Box sx={{ p: 2 }}>
                  <Skeleton width="70%" height={18} />
                  <Skeleton width="45%" height={14} sx={{ mt: 0.5 }} />
                  <Skeleton width="55%" height={14} sx={{ mt: 1 }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10, color: brand.muted }}>
            <Inventory2 sx={{ fontSize: 56, color: brand.tan, mb: 2 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 17, color: '#2c1a0e', mb: 1 }}>No items found</Typography>
            <Typography sx={{ fontSize: 14 }}>Try adjusting your search or filters.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: '1fr 1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2.5 }}>
            {items.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => openItem(item)} />
            ))}
          </Box>
        )}
      </Box>

      {/* Detail modal */}
      <Dialog open={!!selected} onClose={closeItem} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, border: `1px solid ${brand.tan}` } }}>
        {selected && (
          <DialogContent sx={{ p: 0 }}>
            {/* Modal header */}
            <Box sx={{ background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`, p: 3, position: 'relative' }}>
              <IconButton onClick={closeItem} size="small" sx={{ position: 'absolute', top: 12, right: 12, color: '#fff', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' } }}>
                <Close />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  {CATEGORY_BIG_ICONS[selected.category] || <Inventory2 sx={{ fontSize: 40 }} />}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: 20, color: '#fff' }}>{selected.name}</Typography>
                  <Typography sx={{ color: '#F5E2CE', fontSize: 13 }}>{selected.category}</Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              {/* Chips row */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                <Chip label={selected.condition} size="small" sx={{ fontWeight: 600, fontSize: 12, backgroundColor: conditionColor[selected.condition]?.bg, color: conditionColor[selected.condition]?.color, border: `1px solid ${conditionColor[selected.condition]?.border}` }} />
                <Chip label={`Qty: ${selected.quantity}`} size="small" sx={{ fontWeight: 600, fontSize: 12, backgroundColor: '#FFF3E0', color: brand.gold, border: `1px solid #ffe0b2` }} />
              </Box>

              {/* Description */}
              <Typography sx={{ fontSize: 13, color: brand.muted, mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</Typography>
              <Typography sx={{ fontSize: 14, color: '#2c1a0e', mb: 3, lineHeight: 1.6 }}>{selected.description}</Typography>

              {/* Meta */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: brand.muted }} />
                  <Typography sx={{ fontSize: 14, color: brand.muted }}>{selected.location}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Person sx={{ fontSize: 16, color: brand.muted }} />
                  <Typography sx={{ fontSize: 14, color: brand.muted }}>Donated by <strong style={{ color: '#2c1a0e' }}>{selected.donor_name}</strong></Typography>
                </Box>
              </Box>

              {/* Request action */}
              {requestDone ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2, px: 2.5, py: 2 }}>
                  <CheckCircle sx={{ color: '#16a34a', fontSize: 22 }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, color: '#16a34a', fontSize: 14 }}>Request sent!</Typography>
                    <Typography sx={{ fontSize: 13, color: '#8a6d4b' }}>The donor will review your request and get back to you.</Typography>
                  </Box>
                </Box>
              ) : (
                <>
                  {requestError && (
                    <Typography sx={{ fontSize: 13, color: brand.red, mb: 1.5, backgroundColor: '#fce8e6', border: `1px solid #f5c0b8`, borderRadius: 2, px: 2, py: 1 }}>
                      {requestError}
                    </Typography>
                  )}
                  <Button
                    fullWidth
                    onClick={handleRequest}
                    disabled={requesting}
                    sx={{
                      textTransform: 'none', fontWeight: 700, fontSize: 15, py: 1.5, borderRadius: 2,
                      background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
                      color: '#fff', boxShadow: '0 4px 14px rgba(181,51,36,0.2)',
                      '&:hover': { background: `linear-gradient(135deg, ${brand.redDark}, ${brand.goldDark})` },
                      '&.Mui-disabled': { background: brand.tan, color: '#fff', boxShadow: 'none' },
                    }}
                  >
                    {requesting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Request this item'}
                  </Button>
                </>
              )}
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </Box>
  );
}

function ItemCard({ item, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        backgroundColor: '#fff', borderRadius: 3, border: `1px solid ${brand.tan}`,
        overflow: 'hidden', cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(181,51,36,0.1)', borderColor: brand.gold },
      }}
    >
      {/* Retrieve image from s3 */}
      <Box sx={{ position: 'relative' }}>
        {item.photo_urls ? (
          <ItemImage objectKey={item.photo_urls} alt={item.name} />
        ) : (
          <Box
            sx={{
              height: 140,
              backgroundColor: '#faf5ef',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{ color: brand.tan, opacity: 0.8 }}>
              {CATEGORY_BIG_ICONS[item.category] || <Inventory2 sx={{ fontSize: 40 }} />}
            </Box>
          </Box>
        )}

        <Chip
          label={item.condition}
          size="small"
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            fontWeight: 600,
            fontSize: '0.65rem',
            height: 22,
            backgroundColor: conditionColor[item.condition]?.bg || '#f5f5f5',
            color: conditionColor[item.condition]?.color || brand.muted,
            border: `1px solid ${conditionColor[item.condition]?.border || '#e0e0e0'}`,
          }}
        />
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography sx={{ fontWeight: 700, color: '#2c1a0e', fontSize: 14, mb: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </Typography>
        <Typography sx={{ fontSize: 12, color: brand.muted, mb: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip label={item.category} size="small" sx={{ backgroundColor: '#FFF3E0', color: brand.gold, fontWeight: 600, fontSize: '0.65rem', height: 20 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <LocationOn sx={{ fontSize: 12, color: brand.tan }} />
            <Typography sx={{ fontSize: 11, color: brand.tan, maxWidth: 80, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.location}</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
