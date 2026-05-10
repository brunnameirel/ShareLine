import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Badge,
  Avatar,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  VolunteerActivism,
  Search,
  ChatBubbleOutlined,
  Forum as ForumIcon,
  EnergySavingsLeaf,
  Add,
  Checkroom,
  MenuBook,
  Blender,
  LocalLaundryService,
  Inventory2,
  ArrowForward,
} from '@mui/icons-material';
import { supabase } from '../supabaseClient';
import ItemImage from '../components/ItemImages.jsx';

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

// ── Static maps ────────────────────────────────────────────────

const categoryIcons = {
  Clothing: <Checkroom sx={{ fontSize: 18 }} />,
  Textbooks: <MenuBook sx={{ fontSize: 18 }} />,
  Electronics: <Blender sx={{ fontSize: 18 }} />,
  Bedding: <LocalLaundryService sx={{ fontSize: 18 }} />,
  Other: <Inventory2 sx={{ fontSize: 18 }} />,
};

const statusColors = {
  Available: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Reserved:  { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
  Completed: { bg: '#f5f5f5', color: '#8a6d4b', border: '#e0e0e0' },
  Approved:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Pending:   { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
  Rejected:  { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// ── Pixel Sparkle ───────────────────────────────────────────────

function PixelSparkle({ top, left, size = 8 }) {
  return (
    <Box
      sx={{
        position: 'absolute', top, left, width: size, height: size, zIndex: 0,
        animation: 'sparkle 2.5s ease-in-out infinite',
        '@keyframes sparkle': {
          '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
          '50%': { opacity: 0.7, transform: 'scale(1.4)' },
        },
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 8 8" shapeRendering="crispEdges">
        <rect x="3" y="0" width="2" height="8" fill="#E5A657" />
        <rect x="0" y="3" width="8" height="2" fill="#E5A657" />
      </svg>
    </Box>
  );
}

// ── Dashboard ────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState('dashboard');
  const [profile, setProfile] = useState(null);        // { id, name, is_donor, is_requester }
  const [myItems, setMyItems] = useState([]);           // donor's items (with embedded request[])
  const [sentRequests, setSentRequests] = useState([]); // requester's sent requests
  const [featuredItems, setFeaturedItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messageThreads, setMessageThreads] = useState([]);
  const [completedDonations, setCompletedDonations] = useState(0);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    // 1. Resolve DB profile via FastAPI (bypasses RLS) + name from auth metadata
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const meRes = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });

    if (meRes.status === 404) {
      navigate('/onboarding', { replace: true });
      return;
    }
    if (!meRes.ok) {
      console.error('Failed to fetch user profile', meRes.status);
      return;
    }
    const userData = await meRes.json();

    // Name lives in auth metadata (set during onboarding via updateUser)
    const meta = authUser.user_metadata;
    const name = meta?.name || meta?.full_name || '';

    const prof = { ...userData, name };
    setProfile(prof);

    // 2. Parallel data loads
    const tasks = [];

    if (prof.is_donor) {
      // Items with embedded request array (used for count)
      tasks.push(
        supabase
          .from('item')
          .select('id, name, category, status, request(id)')
          .eq('donor_id', prof.id)
          .order('created_at', { ascending: false })
          .limit(5)
          .then(({ data }) => setMyItems(data || []))
      );
      // Completed donations for streak
      tasks.push(
        supabase
          .from('item')
          .select('id', { count: 'exact', head: true })
          .eq('donor_id', prof.id)
          .eq('status', 'Completed')
          .then(({ count }) => setCompletedDonations(count || 0))
      );
    }

    if (prof.is_requester) {
      tasks.push(
        supabase
          .from('request')
          .select('id, status, item:item_id(name, category, location, photo_urls, donor:donor_id(name))')
          .eq('requester_id', prof.id)
          .order('created_at', { ascending: false })
          .limit(6)
          .then(({ data }) => setSentRequests(data || []))
      );
    }

    // Featured items: available items not donated by this user
    tasks.push(
      supabase
        .from('item')
        .select('id, name, category, condition, location, photo_urls, donor:donor_id(name)')
        .eq('status', 'Available')
        .neq('donor_id', prof.id)
        .order('created_at', { ascending: false })
        .limit(4)
        .then(({ data }) => setFeaturedItems(data || []))
    );

    // Notifications
    tasks.push(
      supabase
        .from('notification')
        .select('*')
        .eq('user_id', prof.id)
        .order('created_at', { ascending: false })
        .limit(5)
        .then(({ data }) => setNotifications(data || []))
    );

    await Promise.all(tasks);

    // 3. Message thread previews (depends on nothing above, done after for clarity)
    await loadMessagePreviews(prof.id);
  };

  const loadMessagePreviews = async (userId) => {
    // Threads where user is the requester
    const { data: reqThreads } = await supabase
      .from('request')
      .select('id, item:item_id(name)')
      .eq('status', 'Approved')
      .eq('requester_id', userId);

    // Threads where user is the donor
    const { data: donorItems } = await supabase
      .from('item')
      .select('id')
      .eq('donor_id', userId);

    let donorThreads = [];
    if (donorItems?.length > 0) {
      const { data } = await supabase
        .from('request')
        .select('id, item:item_id(name)')
        .eq('status', 'Approved')
        .in('item_id', donorItems.map((i) => i.id));
      donorThreads = data || [];
    }

    const allThreads = [...(reqThreads || []), ...donorThreads];
    const uniqueThreads = allThreads.filter((t, i) => allThreads.findIndex((t2) => t2.id === t.id) === i);
    if (uniqueThreads.length === 0) return;

    // Latest message per thread
    const { data: recentMsgs } = await supabase
      .from('message')
      .select('id, request_id, body, created_at')
      .in('request_id', uniqueThreads.map((t) => t.id))
      .order('created_at', { ascending: false })
      .limit(30);

    if (!recentMsgs) return;

    const msgByThread = {};
    recentMsgs.forEach((m) => { if (!msgByThread[m.request_id]) msgByThread[m.request_id] = m; });

    const withMessages = uniqueThreads
      .map((t) => ({ ...t, latest: msgByThread[t.id] }))
      .filter((t) => t.latest)
      .sort((a, b) => new Date(b.latest.created_at) - new Date(a.latest.created_at))
      .slice(0, 3);

    setMessageThreads(withMessages);
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase
      .from('notification')
      .update({ is_read: true })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // ── Derived stats ──────────────────────────────────────────────
  const pendingOnItems   = myItems.reduce((s, i) => s + (i.request?.length || 0), 0);
  const myPending        = sentRequests.filter((r) => r.status === 'Pending').length;
  const totalPending     = pendingOnItems + myPending;
  const unreadNotifs     = notifications.filter((n) => !n.is_read).length;

  const navItems = [
    { key: 'donate',   label: 'Donate',   icon: <VolunteerActivism sx={{ fontSize: 20 }} />, to: '/donate' },
    { key: 'browse',   label: 'Browse',   icon: <Search sx={{ fontSize: 20 }} />,             to: '/browse' },
    { key: 'forum',    label: 'Forum',    icon: <ForumIcon sx={{ fontSize: 20 }} />,           to: '/forum' },
    { key: 'impact',   label: 'Impact',   icon: <EnergySavingsLeaf sx={{ fontSize: 20 }} />, to: '/impact' },
    { key: 'messages', label: 'Messages', icon: <ChatBubbleOutlined sx={{ fontSize: 20 }} />, to: '/messages',
      badge: messageThreads.length || null },
  ];

  // ── Render ─────────────────────────────────────────────────────
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFAF5' }}>

      {/* Navbar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: { xs: 2, md: 5 }, py: 1.5, backgroundColor: '#fff', borderBottom: '1px solid #f0e0cc', position: 'sticky', top: 0, zIndex: 10 }}>
        <Box component={Link} to="/dashboard" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none' }} onClick={() => window.location.reload()}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2, background: 'linear-gradient(135deg, #B53324, #E5A657)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VolunteerActivism sx={{ color: '#F5E2CE', fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#B53324', letterSpacing: '-0.5px' }}>ShareLine</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
          {navItems.map((item) => (
            <Button key={item.key} component={Link} to={item.to}
              sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: activeNav === item.key ? '#B53324' : '#8a6d4b', backgroundColor: activeNav === item.key ? '#FFF3E0' : 'transparent', borderRadius: 2, px: { xs: 1, md: 2 }, py: 0.8, minWidth: 'auto', gap: 0.5, '&:hover': { backgroundColor: '#FFF3E0', color: '#B53324' } }}
              onClick={() => setActiveNav(item.key)}
            >
              {item.badge ? (
                <Badge badgeContent={item.badge} sx={{ '& .MuiBadge-badge': { backgroundColor: '#B53324', color: '#fff', fontSize: '0.65rem', minWidth: 16, height: 16 } }}>
                  {item.icon}
                </Badge>
              ) : item.icon}
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>{item.label}</Box>
            </Button>
          ))}
          <Button component={Link} to="/profile"
            sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: '#8a6d4b', borderRadius: 2, px: 1.5, py: 0.8, ml: 1, gap: 1, '&:hover': { backgroundColor: '#FFF3E0', color: '#B53324' } }}
          >
            <Avatar sx={{ width: 30, height: 30, backgroundColor: '#E5A657', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
              {profile?.name ? profile.name[0].toUpperCase() : '?'}
            </Avatar>
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Profile</Box>
          </Button>
        </Box>
      </Box>

      {/* Main content */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

        {/* Hero */}
        <Box sx={{ background: 'linear-gradient(135deg, #B53324, #E5A657)', borderRadius: 4, p: { xs: 3, md: 4 }, mb: 4, position: 'relative', overflow: 'hidden' }}>
          <PixelSparkle top="10%" left="85%" size={10} />
          <PixelSparkle top="70%" left="90%" size={8} />
          <PixelSparkle top="20%" left="75%" size={6} />
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
              Welcome back, {profile?.name || '…'}!
            </Typography>
            <Typography variant="body2" sx={{ color: '#F5E2CE', mb: 3, maxWidth: 450 }}>
              {totalPending > 0 || unreadNotifs > 0
                ? [
                    totalPending > 0 && `${totalPending} pending request${totalPending !== 1 ? 's' : ''}`,
                    unreadNotifs > 0 && `${unreadNotifs} unread notification${unreadNotifs !== 1 ? 's' : ''}`,
                  ].filter(Boolean).join(' and ') + '. Keep the sharing spirit going!'
                : "Everything's up to date. Keep the sharing spirit going!"}
            </Typography>
            <Button variant="contained" startIcon={<Add />} component={Link} to="/donate"
              sx={{ textTransform: 'none', fontWeight: 600, backgroundColor: '#fff', color: '#B53324', borderRadius: 2, px: 3, boxShadow: 'none', '&:hover': { backgroundColor: '#F5E2CE', boxShadow: 'none' } }}>
              Donate an Item
            </Button>
          </Box>
          <Box sx={{ position: 'absolute', bottom: 16, right: 24, opacity: 0.15 }}>
            <svg width="80" height="70" viewBox="0 0 16 14" shapeRendering="crispEdges">
              <rect x="2" y="0" width="4" height="2" fill="#fff" /><rect x="10" y="0" width="4" height="2" fill="#fff" />
              <rect x="0" y="2" width="8" height="2" fill="#fff" /><rect x="8" y="2" width="8" height="2" fill="#fff" />
              <rect x="0" y="4" width="16" height="2" fill="#fff" /><rect x="2" y="6" width="12" height="2" fill="#fff" />
              <rect x="4" y="8" width="8" height="2" fill="#fff" /><rect x="6" y="10" width="4" height="2" fill="#fff" />
            </svg>
          </Box>
        </Box>

        {/* Two-column: My Donations (donor) + Messages preview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: profile?.is_donor ? '1fr 1fr' : '1fr' }, gap: 3, mb: 4 }}>

          {/* My Donations — donor only */}
          {profile?.is_donor && (
            <Box sx={{ backgroundColor: '#fff', border: '1px solid #f0e0cc', borderRadius: 3, p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1rem' }}>My Donations</Typography>
                <Button size="small" component={Link} to="/my-donations" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                  sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.8rem' }}>
                  View all
                </Button>
              </Box>
              {myItems.length > 0 ? myItems.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #faf5ef', '&:last-child': { borderBottom: 'none' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, backgroundColor: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E5A657' }}>
                      {categoryIcons[item.category] || categoryIcons.Other}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem' }}>{item.name}</Typography>
                      <Typography variant="caption" sx={{ color: '#8a6d4b' }}>
                        {item.request?.length || 0} request{item.request?.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip label={item.status} size="small"
                    sx={{ backgroundColor: statusColors[item.status]?.bg, color: statusColors[item.status]?.color, border: `1px solid ${statusColors[item.status]?.border}`, fontWeight: 600, fontSize: '0.7rem', height: 24 }}
                  />
                </Box>
              )) : (
                <Typography sx={{ color: '#8a6d4b', fontSize: '0.85rem', textAlign: 'center', py: 2 }}>No donations yet. Share something!</Typography>
              )}
            </Box>
          )}

          {/* Messages preview */}
          <Box sx={{ backgroundColor: '#fff', border: '1px solid #f0e0cc', borderRadius: 3, p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1rem' }}>Messages</Typography>
              <Button size="small" component={Link} to="/messages" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.8rem' }}>
                View all
              </Button>
            </Box>
            {messageThreads.length > 0 ? messageThreads.map((thread) => (
              <Box key={thread.id} component={Link} to="/messages"
                sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1.5, borderBottom: '1px solid #faf5ef', cursor: 'pointer', textDecoration: 'none', '&:last-child': { borderBottom: 'none' }, '&:hover': { backgroundColor: '#faf8f5', mx: -1.5, px: 1.5, borderRadius: 2 } }}
              >
                <Avatar sx={{ width: 34, height: 34, backgroundColor: '#B53324', color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                  {thread.item?.name?.[0] || '?'}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem' }}>{thread.item?.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#8a6d4b', flexShrink: 0, ml: 1 }}>{timeAgo(thread.latest.created_at)}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#8a6d4b', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {thread.latest.body}
                  </Typography>
                </Box>
              </Box>
            )) : (
              <Typography sx={{ color: '#8a6d4b', fontSize: '0.85rem', textAlign: 'center', py: 2 }}>No messages yet</Typography>
            )}
          </Box>
        </Box>

        {/* Featured Items — always shown */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1.1rem' }}>Featured Items</Typography>
            <Button component={Link} to="/browse" endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.85rem' }}>
              Browse all
            </Button>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
            {featuredItems.length > 0 ? featuredItems.map((item) => (
              <Box key={item.id} sx={{ backgroundColor: '#fff', border: '1px solid #f0e0cc', borderRadius: 3, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 20px rgba(181,51,36,0.08)' }, minHeight: 280, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: 200, backgroundColor: '#faf5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {item.photo_urls ? (
                    <ItemImage
                      objectKey={item.photo_urls}
                      alt={item.name}
                      height={200}
                    />
                  ) : (
                    <Box sx={{ color: '#DFBC94', opacity: 0.6, '& .MuiSvgIcon-root': { fontSize: 40 } }}>
                      {categoryIcons[item.category] || <Inventory2 sx={{ fontSize: 40 }} />}
                    </Box>
                  )}

                  <Chip label={item.condition} size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', color: '#8a6d4b', fontWeight: 600, fontSize: '0.65rem', height: 22, border: '1px solid #f0e0cc' }}
                  />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem', mb: 0.5 }}>{item.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#8a6d4b', display: 'block', mb: 1 }}>{item.location}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip label={item.category} size="small" sx={{ backgroundColor: '#FFF3E0', color: '#E5A657', fontWeight: 600, fontSize: '0.65rem', height: 22 }} />
                    <Typography variant="caption" sx={{ color: '#DFBC94' }}>by {item.donor?.name}</Typography>
                  </Box>
                </Box>
              </Box>
            )) : (
              <Typography sx={{ color: '#8a6d4b', fontSize: '0.85rem', gridColumn: '1 / -1', textAlign: 'center', py: 2 }}>No items available right now</Typography>
            )}
          </Box>
        </Box>

        {/* Requests Sent — requester only */}
        {profile?.is_requester && (
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1.1rem' }}>Requests Sent</Typography>
              <Button endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.85rem' }}>
                View all
              </Button>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
              {sentRequests.length > 0 ? sentRequests.map((req) => (
                <Box key={req.id} sx={{ backgroundColor: '#fff', border: '1px solid #f0e0cc', borderRadius: 3, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 6px 20px rgba(181,51,36,0.08)' }, minHeight: 340, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ height: 200, backgroundColor: '#faf5ef', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {req.item?.photo_urls ? (
                      <ItemImage
                        objectKey={req.item.photo_urls}
                        alt={req.item.name}
                        height={200}
                      />
                    ) : (
                      <Box sx={{ color: '#DFBC94', opacity: 0.6, '& .MuiSvgIcon-root': { fontSize: 40 } }}>
                        {categoryIcons[req.item?.category] || <Inventory2 sx={{ fontSize: 40 }} />}
                      </Box>
                    )}
                    <Chip label={req.status} size="small"
                      sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: statusColors[req.status]?.bg || '#f5f5f5', color: statusColors[req.status]?.color || '#8a6d4b', border: `1px solid ${statusColors[req.status]?.border || '#e0e0e0'}`, fontWeight: 600, fontSize: '0.65rem', height: 22 }}
                    />
                  </Box>
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem', mb: 0.5 }}>{req.item?.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#8a6d4b', display: 'block', mb: 1 }}>{req.item?.location}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Chip label={req.item?.category} size="small" sx={{ backgroundColor: '#FFF3E0', color: '#E5A657', fontWeight: 600, fontSize: '0.65rem', height: 22 }} />
                      <Typography variant="caption" sx={{ color: '#DFBC94' }}>from {req.item?.donor?.name}</Typography>
                    </Box>
                  </Box>
                </Box>
              )) : (
                <Typography sx={{ color: '#8a6d4b', fontSize: '0.85rem', gridColumn: '1 / -1', textAlign: 'center', py: 2 }}>No requests sent yet</Typography>
              )}
            </Box>
          </Box>
        )}

        {/* Recent Activity */}
        <Box sx={{ backgroundColor: '#fff', border: '1px solid #f0e0cc', borderRadius: 3, p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1rem' }}>Recent Activity</Typography>
            <Button size="small" onClick={markAllRead}
              sx={{ textTransform: 'none', color: '#8a6d4b', fontWeight: 500, fontSize: '0.8rem' }}>
              Mark all read
            </Button>
          </Box>
          {notifications.length > 0 ? notifications.map((notif) => (
            <Box key={notif.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: '1px solid #faf5ef', '&:last-child': { borderBottom: 'none' } }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: notif.is_read ? '#e0e0e0' : '#B53324', flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: notif.is_read ? '#8a6d4b' : '#3d2c1e', fontSize: '0.85rem', fontWeight: notif.is_read ? 400 : 500 }}>
                  {notif.message}
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#DFBC94', flexShrink: 0 }}>{timeAgo(notif.created_at)}</Typography>
            </Box>
          )) : (
            <Typography sx={{ color: '#8a6d4b', fontSize: '0.85rem', textAlign: 'center', py: 2 }}>No recent activity</Typography>
          )}
        </Box>

        {/* Sharing Streak — donor only */}
        {profile?.is_donor && (
          <Box sx={{ background: 'linear-gradient(135deg, #fef2f0, #FFF3E0)', border: '1px solid #f0e0cc', borderRadius: 3, p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flex: 1, minWidth: 200 }}>
              <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '0.95rem', mb: 0.5 }}>Your sharing streak</Typography>
              <Typography variant="body2" sx={{ color: '#8a6d4b', mb: 1.5 }}>
                {completedDonations} item{completedDonations !== 1 ? 's' : ''} donated this semester. Keep it up!
              </Typography>
              <LinearProgress variant="determinate" value={Math.min((completedDonations / 5) * 100, 100)}
                sx={{ height: 8, borderRadius: 4, backgroundColor: '#f0e0cc', '& .MuiLinearProgress-bar': { borderRadius: 4, background: 'linear-gradient(90deg, #B53324, #E5A657)' } }}
              />
              <Typography variant="caption" sx={{ color: '#8a6d4b', mt: 0.5, display: 'block' }}>
                {completedDonations} of 5 to earn "Super Sharer" badge
              </Typography>
            </Box>
            <Box sx={{ opacity: 0.7 }}>
              <svg width="48" height="52" viewBox="0 0 24 26" shapeRendering="crispEdges">
                <rect x="4" y="0" width="16" height="4" fill="#E5A657" />
                <rect x="2" y="0" width="4" height="8" fill="#E5A657" />
                <rect x="18" y="0" width="4" height="8" fill="#E5A657" />
                <rect x="4" y="4" width="16" height="10" fill="#E5A657" />
                <rect x="6" y="4" width="12" height="4" fill="#F5E2CE" opacity="0.5" />
                <rect x="8" y="14" width="8" height="4" fill="#c48d45" />
                <rect x="6" y="18" width="12" height="4" fill="#8a6d4b" />
                <rect x="4" y="22" width="16" height="4" fill="#6b4a2e" />
              </svg>
            </Box>
          </Box>
        )}

      </Box>
    </Box>
  );
}
