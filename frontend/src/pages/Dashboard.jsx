import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Badge,
  Avatar,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  VolunteerActivism,
  Search,
  ChatBubbleOutlined,
  Add,
  Checkroom,
  MenuBook,
  Blender,
  LocalLaundryService,
  Inventory2,
  ArrowForward,
  Circle,
} from '@mui/icons-material';

// ── Mock Data ────────────────────────────────────────────────

const myDonations = [
  { id: 1, name: 'Winter Parka', category: 'Clothing', status: 'Available', requests: 2 },
  { id: 2, name: 'Organic Chemistry Textbook', category: 'Textbooks', status: 'Reserved', requests: 1 },
  { id: 3, name: 'Desk Lamp', category: 'Electronics', status: 'Completed', requests: 0 },
];

const featuredItems = [
  { id: 1, name: 'Blue Hoodie', category: 'Clothing', condition: 'Good', location: 'UMass Amherst', donor: 'Alex M.' },
  { id: 2, name: 'Calculus Textbook', category: 'Textbooks', condition: 'Fair', location: 'Amherst College', donor: 'Sam K.' },
  { id: 3, name: 'Rice Cooker', category: 'Electronics', condition: 'New', location: 'Hampshire College', donor: 'Jordan L.' },
  { id: 4, name: 'Warm Blanket', category: 'Bedding', condition: 'Good', location: 'Smith College', donor: 'Riley T.' },
];

const messages = [
  { id: 1, from: 'Alex M.', preview: 'Hey! When can you pick up the hoodie?', time: '2m ago', unread: true },
  { id: 2, from: 'Sam K.', preview: 'The textbook is in great shape, just some highlights', time: '1h ago', unread: true },
  { id: 3, from: 'Jordan L.', preview: 'Thanks for requesting! I can meet Thursday', time: '3h ago', unread: false },
];

const notifications = [
  { id: 1, text: 'Your request for "Blue Hoodie" was approved!', time: '5m ago', type: 'success' },
  { id: 2, text: 'New request on your "Winter Parka"', time: '20m ago', type: 'info' },
  { id: 3, text: 'Alex M. sent you a message', time: '1h ago', type: 'message' },
  { id: 4, text: '"Desk Lamp" exchange completed', time: '2h ago', type: 'success' },
];

const categoryIcons = {
  Clothing: <Checkroom sx={{ fontSize: 18 }} />,
  Textbooks: <MenuBook sx={{ fontSize: 18 }} />,
  Electronics: <Blender sx={{ fontSize: 18 }} />,
  Bedding: <LocalLaundryService sx={{ fontSize: 18 }} />,
  Other: <Inventory2 sx={{ fontSize: 18 }} />,
};

const statusColors = {
  Available: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Reserved: { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
  Completed: { bg: '#f5f5f5', color: '#8a6d4b', border: '#e0e0e0' },
  Approved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  Pending: { bg: '#FFF3E0', color: '#E5A657', border: '#ffe0b2' },
};

// ── Pixel Sparkle Component ──────────────────────────────────

function PixelSparkle({ top, left, size = 8 }) {
  return (
    <Box
      sx={{
        position: 'absolute',
        top,
        left,
        width: size,
        height: size,
        zIndex: 0,
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

// ── Dashboard ────────────────────────────────────────────────

export default function Dashboard() {
  const [activeNav, setActiveNav] = useState('dashboard');

  const navItems = [
    { key: 'donate', label: 'Donate', icon: <VolunteerActivism sx={{ fontSize: 20 }} />, to: '/donate' },
    { key: 'browse', label: 'Browse', icon: <Search sx={{ fontSize: 20 }} />, to: '/browse' },
    { key: 'messages', label: 'Messages', icon: <ChatBubbleOutlined sx={{ fontSize: 20 }} />, to: '/messages', badge: 2 },
  ];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFAF5' }}>
      {/* ── Navbar ──────────────────────────────── */}
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
        <Box
          component={Link}
          to="/dashboard"
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', cursor: 'pointer' }}
          onClick={() => window.location.reload()}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #B53324, #E5A657)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VolunteerActivism sx={{ color: '#F5E2CE', fontSize: 18 }} />
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#B53324', letterSpacing: '-0.5px' }}>
            ShareLine
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
          {navItems.map((item) => (
            <Button
              key={item.key}
              component={Link}
              to={item.to}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: activeNav === item.key ? '#B53324' : '#8a6d4b',
                backgroundColor: activeNav === item.key ? '#FFF3E0' : 'transparent',
                borderRadius: 2,
                px: { xs: 1, md: 2 },
                py: 0.8,
                minWidth: 'auto',
                gap: 0.5,
                '&:hover': { backgroundColor: '#FFF3E0', color: '#B53324' },
              }}
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

          <Button
            component={Link}
            to="/profile"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#8a6d4b',
              borderRadius: 2,
              px: 1.5,
              py: 0.8,
              ml: 1,
              gap: 1,
              '&:hover': { backgroundColor: '#FFF3E0', color: '#B53324' },
            }}
          >
            <Avatar
              sx={{
                width: 30,
                height: 30,
                backgroundColor: '#E5A657',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              B
            </Avatar>
            <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>Profile</Box>
          </Button>
        </Box>
      </Box>

      {/* ── Main Content ───────────────────────── */}
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

        {/* ── Welcome Hero ───────────────────── */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #B53324, #E5A657)',
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <PixelSparkle top="10%" left="85%" size={10} />
          <PixelSparkle top="70%" left="90%" size={8} />
          <PixelSparkle top="20%" left="75%" size={6} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#fff', mb: 0.5 }}>
              Welcome back, Brunna!
            </Typography>
            <Typography variant="body2" sx={{ color: '#F5E2CE', mb: 3, maxWidth: 450 }}>
              You have 2 pending requests and 2 unread messages. Keep the sharing spirit going!
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                backgroundColor: '#fff',
                color: '#B53324',
                borderRadius: 2,
                px: 3,
                boxShadow: 'none',
                '&:hover': { backgroundColor: '#F5E2CE', boxShadow: 'none' },
              }}
            >
              Donate an Item
            </Button>
          </Box>

          {/* Decorative pixel heart */}
          <Box sx={{ position: 'absolute', bottom: 16, right: 24, opacity: 0.15 }}>
            <svg width="80" height="70" viewBox="0 0 16 14" shapeRendering="crispEdges">
              <rect x="2" y="0" width="4" height="2" fill="#fff" />
              <rect x="10" y="0" width="4" height="2" fill="#fff" />
              <rect x="0" y="2" width="8" height="2" fill="#fff" />
              <rect x="8" y="2" width="8" height="2" fill="#fff" />
              <rect x="0" y="4" width="16" height="2" fill="#fff" />
              <rect x="2" y="6" width="12" height="2" fill="#fff" />
              <rect x="4" y="8" width="8" height="2" fill="#fff" />
              <rect x="6" y="10" width="4" height="2" fill="#fff" />
            </svg>
          </Box>
        </Box>


        {/* ── Two Column Layout ──────────────── */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
            mb: 4,
          }}
        >
          {/* ── My Donations ─────────────────── */}
          <Box
            sx={{
              backgroundColor: '#fff',
              border: '1px solid #f0e0cc',
              borderRadius: 3,
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1rem' }}>My Donations</Typography>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.8rem' }}
              >
                View all
              </Button>
            </Box>
            {myDonations.map((item) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 1.5,
                  borderBottom: '1px solid #faf5ef',
                  '&:last-child': { borderBottom: 'none' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 2,
                      backgroundColor: '#FFF3E0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E5A657',
                    }}
                  >
                    {categoryIcons[item.category] || categoryIcons.Other}
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem' }}>{item.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#8a6d4b' }}>
                      {item.requests} request{item.requests !== 1 ? 's' : ''}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={item.status}
                  size="small"
                  sx={{
                    backgroundColor: statusColors[item.status].bg,
                    color: statusColors[item.status].color,
                    border: `1px solid ${statusColors[item.status].border}`,
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                  }}
                />
              </Box>
            ))}
          </Box>

          {/* ── Messages Preview ─────────────── */}
          <Box
            sx={{
              backgroundColor: '#fff',
              border: '1px solid #f0e0cc',
              borderRadius: 3,
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
              <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1rem' }}>Messages</Typography>
              <Button
                size="small"
                endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
                sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.8rem' }}
              >
                View all
              </Button>
            </Box>
            {messages.map((msg) => (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 1.5,
                  py: 1.5,
                  borderBottom: '1px solid #faf5ef',
                  cursor: 'pointer',
                  '&:last-child': { borderBottom: 'none' },
                  '&:hover': { backgroundColor: '#faf8f5', mx: -1.5, px: 1.5, borderRadius: 2 },
                }}
              >
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    backgroundColor: msg.unread ? '#B53324' : '#DFBC94',
                    color: '#fff',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}
                >
                  {msg.from[0]}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ fontWeight: msg.unread ? 700 : 500, color: '#3d2c1e', fontSize: '0.85rem' }}>
                      {msg.from}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#8a6d4b', flexShrink: 0, ml: 1 }}>{msg.time}</Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      color: msg.unread ? '#3d2c1e' : '#8a6d4b',
                      fontWeight: msg.unread ? 500 : 400,
                      fontSize: '0.8rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {msg.preview}
                  </Typography>
                </Box>
                {msg.unread && (
                  <Circle sx={{ color: '#B53324', fontSize: 8, mt: 1 }} />
                )}
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Browse Featured Items ──────────── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1.1rem' }}>Featured Items</Typography>
            <Button
              component={Link}
              to="/browse"
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.85rem' }}
            >
              Browse all
            </Button>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {featuredItems.map((item) => (
              <Box
                key={item.id}
                sx={{
                  backgroundColor: '#fff',
                  border: '1px solid #f0e0cc',
                  borderRadius: 3,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 20px rgba(181,51,36,0.08)',
                  },
                }}
              >
                {/* Image placeholder with pixel art accent */}
                <Box
                  sx={{
                    height: 120,
                    backgroundColor: '#faf5ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Box sx={{ color: '#DFBC94', opacity: 0.6 }}>
                    {categoryIcons[item.category] ? (
                      <Box sx={{ '& .MuiSvgIcon-root': { fontSize: 40 } }}>{categoryIcons[item.category]}</Box>
                    ) : (
                      <Inventory2 sx={{ fontSize: 40 }} />
                    )}
                  </Box>
                  <Chip
                    label={item.condition}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: '#fff',
                      color: '#8a6d4b',
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      height: 22,
                      border: '1px solid #f0e0cc',
                    }}
                  />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem', mb: 0.5 }}>{item.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#8a6d4b', display: 'block', mb: 1 }}>{item.location}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={item.category}
                      size="small"
                      sx={{
                        backgroundColor: '#FFF3E0',
                        color: '#E5A657',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 22,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#DFBC94' }}>by {item.donor}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Requests Sent ────────────────── */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1.1rem' }}>Requests Sent</Typography>
            <Button
              endIcon={<ArrowForward sx={{ fontSize: 14 }} />}
              sx={{ textTransform: 'none', color: '#B53324', fontWeight: 600, fontSize: '0.85rem' }}
            >
              View all
            </Button>
          </Box>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
              gap: 2,
            }}
          >
            {[
              { id: 1, name: 'Blue Hoodie', category: 'Clothing', status: 'Approved', location: 'UMass Amherst', donor: 'Alex M.', qty: 1 },
              { id: 2, name: 'Calculus Textbook', category: 'Textbooks', status: 'Pending', location: 'Amherst College', donor: 'Sam K.', qty: 1 },
            ].map((req) => (
              <Box
                key={req.id}
                sx={{
                  backgroundColor: '#fff',
                  border: '1px solid #f0e0cc',
                  borderRadius: 3,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 6px 20px rgba(181,51,36,0.08)',
                  },
                }}
              >
                <Box
                  sx={{
                    height: 120,
                    backgroundColor: '#faf5ef',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                >
                  <Box sx={{ color: '#DFBC94', opacity: 0.6 }}>
                    {categoryIcons[req.category] ? (
                      <Box sx={{ '& .MuiSvgIcon-root': { fontSize: 40 } }}>{categoryIcons[req.category]}</Box>
                    ) : (
                      <Inventory2 sx={{ fontSize: 40 }} />
                    )}
                  </Box>
                  <Chip
                    label={req.status}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      backgroundColor: statusColors[req.status]?.bg || '#f5f5f5',
                      color: statusColors[req.status]?.color || '#8a6d4b',
                      border: `1px solid ${statusColors[req.status]?.border || '#e0e0e0'}`,
                      fontWeight: 600,
                      fontSize: '0.65rem',
                      height: 22,
                    }}
                  />
                </Box>
                <Box sx={{ p: 2 }}>
                  <Typography sx={{ fontWeight: 600, color: '#3d2c1e', fontSize: '0.85rem', mb: 0.5 }}>{req.name}</Typography>
                  <Typography variant="caption" sx={{ color: '#8a6d4b', display: 'block', mb: 1 }}>{req.location}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Chip
                      label={req.category}
                      size="small"
                      sx={{
                        backgroundColor: '#FFF3E0',
                        color: '#E5A657',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        height: 22,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: '#DFBC94' }}>from {req.donor}</Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ── Activity / Notifications ────────── */}
        <Box
          sx={{
            backgroundColor: '#fff',
            border: '1px solid #f0e0cc',
            borderRadius: 3,
            p: 3,
            mb: 4,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '1rem' }}>Recent Activity</Typography>
            <Button
              size="small"
              sx={{ textTransform: 'none', color: '#8a6d4b', fontWeight: 500, fontSize: '0.8rem' }}
            >
              Mark all read
            </Button>
          </Box>
          {notifications.map((notif) => (
            <Box
              key={notif.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                borderBottom: '1px solid #faf5ef',
                '&:last-child': { borderBottom: 'none' },
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor:
                    notif.type === 'success' ? '#16a34a' :
                    notif.type === 'message' ? '#B53324' : '#E5A657',
                  flexShrink: 0,
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ color: '#3d2c1e', fontSize: '0.85rem' }}>{notif.text}</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#DFBC94', flexShrink: 0 }}>{notif.time}</Typography>
            </Box>
          ))}
        </Box>

        {/* ── Sharing Progress ────────────────── */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, #fef2f0, #FFF3E0)',
            border: '1px solid #f0e0cc',
            borderRadius: 3,
            p: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography sx={{ fontWeight: 700, color: '#3d2c1e', fontSize: '0.95rem', mb: 0.5 }}>
              Your sharing streak
            </Typography>
            <Typography variant="body2" sx={{ color: '#8a6d4b', mb: 1.5 }}>
              3 items donated this semester. Keep it up!
            </Typography>
            <LinearProgress
              variant="determinate"
              value={60}
              sx={{
                height: 8,
                borderRadius: 4,
                backgroundColor: '#f0e0cc',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                  background: 'linear-gradient(90deg, #B53324, #E5A657)',
                },
              }}
            />
            <Typography variant="caption" sx={{ color: '#8a6d4b', mt: 0.5, display: 'block' }}>3 of 5 to earn "Super Sharer" badge</Typography>
          </Box>

          {/* Pixel trophy */}
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
      </Box>
    </Box>
  );
}