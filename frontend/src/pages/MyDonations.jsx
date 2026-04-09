import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, Avatar,
  Skeleton, Collapse, IconButton,
} from '@mui/material';
import {
  VolunteerActivism, Checkroom, MenuBook, Blender,
  LocalLaundryService, Inventory2, ExpandMore, ExpandLess,
  CheckCircle, Cancel, ChatBubbleOutlined, Add,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';

const API = import.meta.env.VITE_API_URL;

const brand = {
  red: '#B53324', redDark: '#922a1d',
  gold: '#E5A657', goldDark: '#c48d45',
  cream: '#F5E2CE', tan: '#DFBC94',
  muted: '#8a6d4b',
};

const categoryIcons = {
  Clothing:    <Checkroom sx={{ fontSize: 20 }} />,
  Textbooks:   <MenuBook sx={{ fontSize: 20 }} />,
  Electronics: <Blender sx={{ fontSize: 20 }} />,
  Bedding:     <LocalLaundryService sx={{ fontSize: 20 }} />,
  Other:       <Inventory2 sx={{ fontSize: 20 }} />,
};

const statusColors = {
  Available: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Reserved:  { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  Completed: { bg: '#f5f5f5', color: '#8a6d4b', border: '#e0e0e0' },
  Pending:   { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
  Approved:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Rejected:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function MyDonations() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) { navigate('/login'); return; }
      setSession(data.session);
    });
  }, [navigate]);

  const fetchItems = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/items/mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDecision = async (requestId, status) => {
    try {
      const res = await fetch(`${API}/requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      // Refresh items to reflect new statuses
      fetchItems();
    } catch {
      alert('Something went wrong. Please try again.');
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
        <Button
          component={Link} to="/donate"
          startIcon={<Add />}
          sx={{ textTransform: 'none', fontWeight: 600, color: brand.red, border: `1px solid ${brand.tan}`, borderRadius: 2, px: 2, '&:hover': { backgroundColor: brand.cream } }}
        >
          Donate item
        </Button>
      </Box>

      <Box sx={{ maxWidth: 780, mx: 'auto', px: { xs: 2, md: 4 }, py: 5 }}>

        {/* Header */}
        <Typography sx={{ fontWeight: 700, fontSize: { xs: 22, md: 28 }, color: '#2c1a0e', mb: 0.5 }}>
          My Donations
        </Typography>
        <Typography sx={{ color: brand.muted, fontSize: 14, mb: 4 }}>
          Review requests on your listed items and approve who receives them.
        </Typography>

        {/* Items */}
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} height={80} sx={{ borderRadius: 3, mb: 2 }} />)
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Inventory2 sx={{ fontSize: 56, color: brand.tan, mb: 2 }} />
            <Typography sx={{ fontWeight: 600, fontSize: 17, color: '#2c1a0e', mb: 1 }}>No items yet</Typography>
            <Typography sx={{ color: brand.muted, fontSize: 14, mb: 3 }}>List something to get started.</Typography>
            <Button
              component={Link} to="/donate"
              sx={{ textTransform: 'none', fontWeight: 700, px: 4, py: 1.2, borderRadius: 2, background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`, color: '#fff' }}
            >
              Donate an item
            </Button>
          </Box>
        ) : (
          items.map((item) => (
            <ItemRow key={item.id} item={item} onDecision={handleDecision} />
          ))
        )}
      </Box>
    </Box>
  );
}

function ItemRow({ item, onDecision }) {
  const pendingCount = item.requests.filter((r) => r.status === 'Pending').length;
  const [open, setOpen] = useState(pendingCount > 0); // auto-expand if pending requests

  return (
    <Box sx={{ backgroundColor: '#fff', borderRadius: 3, border: `1px solid ${pendingCount > 0 ? brand.gold : brand.tan}`, mb: 2, overflow: 'hidden' }}>

      {/* Item header row */}
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2, cursor: 'pointer', '&:hover': { backgroundColor: '#faf8f5' } }}
      >
        <Box sx={{ width: 42, height: 42, borderRadius: 2, backgroundColor: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: brand.gold, flexShrink: 0 }}>
          {categoryIcons[item.category] || categoryIcons.Other}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#2c1a0e' }}>{item.name}</Typography>
            <Chip label={item.status} size="small" sx={{
              height: 22, fontSize: 11, fontWeight: 600,
              backgroundColor: statusColors[item.status]?.bg,
              color: statusColors[item.status]?.color,
              border: `1px solid ${statusColors[item.status]?.border}`,
            }} />
            {pendingCount > 0 && (
              <Chip label={`${pendingCount} pending`} size="small" sx={{
                height: 22, fontSize: 11, fontWeight: 700,
                backgroundColor: '#FFF3E0', color: brand.gold, border: `1px solid #ffe0b2`,
              }} />
            )}
          </Box>
          <Typography sx={{ fontSize: 12, color: brand.muted, mt: 0.2 }}>
            {item.category} · {item.condition} · Qty {item.quantity}
          </Typography>
        </Box>

        <IconButton size="small" sx={{ color: brand.muted }}>
          {open ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Requests list */}
      <Collapse in={open}>
        {item.requests.length === 0 ? (
          <Box sx={{ px: 3, pb: 2.5, pt: 0.5 }}>
            <Typography sx={{ fontSize: 13, color: brand.muted }}>No requests yet — share this listing so others can find it!</Typography>
          </Box>
        ) : (
          <Box sx={{ borderTop: `1px solid ${brand.tan}` }}>
            {item.requests.map((req, i) => (
              <RequestRow
                key={req.id}
                req={req}
                isLast={i === item.requests.length - 1}
                onDecision={onDecision}
              />
            ))}
          </Box>
        )}
      </Collapse>
    </Box>
  );
}

function RequestRow({ req, isLast, onDecision }) {
  const [acting, setActing] = useState(false);

  const decide = async (status) => {
    setActing(true);
    await onDecision(req.id, status);
    setActing(false);
  };

  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 2,
      px: 3, py: 2,
      borderBottom: isLast ? 'none' : `1px solid #faf5ef`,
      flexWrap: 'wrap',
    }}>
      {/* Requester avatar */}
      <Avatar sx={{ width: 38, height: 38, background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {initials(req.requester_name)}
      </Avatar>

      {/* Info */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14, color: '#2c1a0e' }}>{req.requester_name}</Typography>
        <Typography sx={{ fontSize: 12, color: brand.muted }}>Requesting {req.requested_quantity} unit{req.requested_quantity !== 1 ? 's' : ''}</Typography>
      </Box>

      {/* Status / Actions */}
      {req.status === 'Pending' ? (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
          <Button
            size="small"
            disabled={acting}
            onClick={() => decide('Rejected')}
            startIcon={<Cancel sx={{ fontSize: 15 }} />}
            sx={{
              textTransform: 'none', fontWeight: 600, fontSize: 13,
              color: '#dc2626', border: '1px solid #fecaca', borderRadius: 2, px: 1.5,
              '&:hover': { backgroundColor: '#fef2f2' },
            }}
          >
            Decline
          </Button>
          <Button
            size="small"
            disabled={acting}
            onClick={() => decide('Approved')}
            startIcon={<CheckCircle sx={{ fontSize: 15 }} />}
            sx={{
              textTransform: 'none', fontWeight: 600, fontSize: 13,
              background: `linear-gradient(135deg, ${brand.red}, ${brand.gold})`,
              color: '#fff', borderRadius: 2, px: 2,
              '&:hover': { background: `linear-gradient(135deg, ${brand.redDark}, ${brand.goldDark})` },
              '&.Mui-disabled': { background: brand.tan, color: '#fff' },
            }}
          >
            Approve
          </Button>
        </Box>
      ) : req.status === 'Approved' ? (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
          <Chip label="Approved" size="small" icon={<CheckCircle sx={{ fontSize: 13 }} />} sx={{ fontWeight: 600, fontSize: 11, backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }} />
          <Button
            component={Link}
            to="/messages"
            size="small"
            startIcon={<ChatBubbleOutlined sx={{ fontSize: 15 }} />}
            sx={{
              textTransform: 'none', fontWeight: 600, fontSize: 13,
              color: brand.red, border: `1px solid ${brand.tan}`, borderRadius: 2, px: 1.5,
              '&:hover': { backgroundColor: brand.cream },
            }}
          >
            Message
          </Button>
        </Box>
      ) : (
        <Chip label={req.status} size="small" sx={{
          fontWeight: 600, fontSize: 11, height: 24,
          backgroundColor: statusColors[req.status]?.bg,
          color: statusColors[req.status]?.color,
          border: `1px solid ${statusColors[req.status]?.border}`,
        }} />
      )}
    </Box>
  );
}
