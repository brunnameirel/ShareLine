import React from 'react';
import { Link } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import {
  VolunteerActivism,
  Search,
  ChatBubbleOutlined,
  NotificationsNone,
  ArrowForward,
} from '@mui/icons-material';

const features = [
  {
    icon: <VolunteerActivism sx={{ fontSize: 32, color: '#B53324' }} />,
    title: 'Donate with ease',
    desc: 'List items in seconds. Add photos, set a pickup spot, and let the community find what they need.',
  },
  {
    icon: <Search sx={{ fontSize: 32, color: '#B53324' }} />,
    title: 'Browse & request',
    desc: 'Filter by category, campus, or keyword. Found something you need? Request it in one click.',
  },
  {
    icon: <ChatBubbleOutlined sx={{ fontSize: 32, color: '#B53324' }} />,
    title: 'Coordinate in-app',
    desc: 'Message donors directly to arrange pickup. No need to share personal contact info.',
  },
  {
    icon: <NotificationsNone sx={{ fontSize: 32, color: '#B53324' }} />,
    title: 'Stay in the loop',
    desc: 'Get notified when your request is approved, a new message arrives, or an item you want is listed.',
  },
];

const campuses = [
  'UMass Amherst',
  'Amherst College',
  'Hampshire College',
  'Mount Holyoke College',
  'Smith College',
];

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFFAF5' }}>
      {/* ── Navbar ──────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, md: 6 },
          py: 2,
          backgroundColor: 'rgba(255,250,245,0.9)',
          backdropFilter: 'blur(8px)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 2,
              background: 'linear-gradient(135deg, #B53324, #E5A657)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <VolunteerActivism sx={{ color: '#F5E2CE', fontSize: 20 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#B53324', letterSpacing: '-0.5px' }}
          >
            ShareLine
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            component={Link}
            to="/login"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#B53324',
              '&:hover': { backgroundColor: '#F5E2CE' },
            }}
          >
            Sign In
          </Button>
        </Box>
      </Box>

      {/* ── Hero ────────────────────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(160deg, #F5E2CE 0%, #DFBC94 40%, #E5A657 100%)',
          py: { xs: 10, md: 14 },
          px: 3,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <Box
          sx={{
            position: 'absolute',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(181, 51, 36, 0.06)',
            top: -80,
            right: -60,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'rgba(181, 51, 36, 0.04)',
            bottom: -40,
            left: -40,
          }}
        />

        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              color: '#B53324',
              mb: 2.5,
              fontSize: { xs: '2.2rem', md: '3.2rem' },
              lineHeight: 1.15,
              letterSpacing: '-1px',
            }}
          >
            Share what you have.
            <br />
            Find what you need.
          </Typography>
          <Typography
            sx={{
              color: '#6b4a2e',
              fontSize: { xs: '1.05rem', md: '1.2rem' },
              maxWidth: 560,
              mx: 'auto',
              mb: 4,
              lineHeight: 1.7,
            }}
          >
            ShareLine connects students across the Five College Consortium to
            donate and request essential items like textbooks, clothing, dorm
            supplies, and more. All in one place.
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              component={Link}
              to="/register"
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                background: '#B53324',
                boxShadow: 'none',
                '&:hover': {
                  background: '#922a1d',
                  boxShadow: 'none',
                },
              }}
            >
              Join ShareLine
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ── Campuses ribbon ─────────────────────────── */}
      <Box
        sx={{
          backgroundColor: '#B53324',
          py: 2.5,
          px: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: { xs: 2, md: 4 },
        }}
      >
        {campuses.map((name) => (
          <Typography
            key={name}
            variant="body2"
            sx={{
              color: '#F5E2CE',
              fontWeight: 600,
              letterSpacing: '0.5px',
              fontSize: '0.8rem',
              textTransform: 'uppercase',
            }}
          >
            {name}
          </Typography>
        ))}
      </Box>

      {/* ── Features ────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#B53324',
            textAlign: 'center',
            mb: 1.5,
            letterSpacing: '-0.5px',
          }}
        >
          How it works
        </Typography>
        <Typography
          sx={{
            color: '#8a6d4b',
            textAlign: 'center',
            maxWidth: 480,
            mx: 'auto',
            mb: 6,
            fontSize: '1.05rem',
          }}
        >
          A simple workflow that gets items from people who have them to people
          who need them.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
            gap: 3,
          }}
        >
          {features.map((f, i) => (
            <Box
              key={i}
              sx={{
                p: 3.5,
                borderRadius: 3,
                backgroundColor: '#fff',
                border: '1px solid #f0e0cc',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(181,51,36,0.08)',
                },
              }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  backgroundColor: '#FFF3E0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2.5,
                }}
              >
                {f.icon}
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#3d2c1e', mb: 1, fontSize: '1.05rem' }}>
                {f.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8a6d4b', lineHeight: 1.7 }}>
                {f.desc}
              </Typography>
            </Box>
          ))}
        </Box>
      </Container>

      {/* ── Kawaii Pixel Items ──────────────────────── */}
      <Box
        sx={{
          background: 'linear-gradient(180deg, #B53324 0%, #c44a2a 30%, #E5A657 70%, #F5E2CE 100%)',
          py: { xs: 8, md: 10 },
          px: 3,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 400,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            color: '#fff',
            mb: 1,
            position: 'relative',
            zIndex: 2,
          }}
        >
          Items looking for a new home
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: '#F5E2CE',
            position: 'relative',
            zIndex: 2,
          }}
        >
          Hoodies, laptops, textbooks, and more. Floating through the Five College community.
        </Typography>

        {/* Sparkle stars scattered around */}
        {[
          { top: '8%', left: '20%', size: 3 },
          { top: '15%', left: '60%', size: 2 },
          { top: '30%', left: '90%', size: 3 },
          { top: '50%', left: '5%', size: 2 },
          { top: '70%', left: '50%', size: 2 },
          { top: '25%', left: '35%', size: 3 },
          { top: '80%', left: '75%', size: 2 },
          { top: '45%', left: '18%', size: 2 },
          { top: '60%', left: '88%', size: 3 },
          { top: '35%', left: '70%', size: 2 },
        ].map((s, i) => (
          <Box
            key={`sparkle-${i}`}
            sx={{
              position: 'absolute',
              top: s.top,
              left: s.left,
              width: s.size * 4,
              height: s.size * 4,
              zIndex: 1,
              animation: `sparkle ${2 + i * 0.3}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
              '@keyframes sparkle': {
                '0%, 100%': { opacity: 0.3, transform: 'scale(1)' },
                '50%': { opacity: 1, transform: 'scale(1.3)' },
              },
            }}
          >
            <svg width="100%" height="100%" viewBox="0 0 12 12" shapeRendering="crispEdges">
              <rect x="5" y="0" width="2" height="12" fill="#fff"/>
              <rect x="0" y="5" width="12" height="2" fill="#fff"/>
              <rect x="3" y="3" width="2" height="2" fill="#fff" opacity="0.6"/>
              <rect x="7" y="3" width="2" height="2" fill="#fff" opacity="0.6"/>
              <rect x="3" y="7" width="2" height="2" fill="#fff" opacity="0.6"/>
              <rect x="7" y="7" width="2" height="2" fill="#fff" opacity="0.6"/>
            </svg>
          </Box>
        ))}

        {/* Pixel heart decorations */}
        {[
          { top: '12%', left: '45%' },
          { top: '65%', left: '25%' },
          { top: '40%', left: '82%' },
          { top: '75%', left: '60%' },
        ].map((h, i) => (
          <Box
            key={`heart-${i}`}
            sx={{
              position: 'absolute',
              top: h.top,
              left: h.left,
              zIndex: 1,
              animation: `heartBob ${3 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
              '@keyframes heartBob': {
                '0%, 100%': { transform: 'translateY(0) scale(1)', opacity: 0.5 },
                '50%': { transform: 'translateY(-6px) scale(1.1)', opacity: 0.8 },
              },
            }}
          >
            <svg width="16" height="14" viewBox="0 0 16 14" shapeRendering="crispEdges">
              <rect x="2" y="0" width="4" height="2" fill="#F5E2CE"/>
              <rect x="10" y="0" width="4" height="2" fill="#F5E2CE"/>
              <rect x="0" y="2" width="8" height="2" fill="#F5E2CE"/>
              <rect x="8" y="2" width="8" height="2" fill="#F5E2CE"/>
              <rect x="0" y="4" width="16" height="2" fill="#F5E2CE"/>
              <rect x="2" y="6" width="12" height="2" fill="#F5E2CE"/>
              <rect x="4" y="8" width="8" height="2" fill="#F5E2CE"/>
              <rect x="6" y="10" width="4" height="2" fill="#F5E2CE"/>
            </svg>
          </Box>
        ))}

        {/* Kawaii pixel items */}
        {[
          {
            // Hoodie - chunky pixel art
            svg: (
              <svg width="64" height="64" viewBox="0 0 32 32" shapeRendering="crispEdges">
                <rect x="8" y="4" width="16" height="4" fill="#E5A657"/>
                <rect x="12" y="2" width="8" height="4" fill="#E5A657"/>
                <rect x="14" y="2" width="4" height="2" fill="#c48d45"/>
                <rect x="6" y="8" width="20" height="4" fill="#E5A657"/>
                <rect x="4" y="8" width="4" height="10" fill="#c48d45"/>
                <rect x="24" y="8" width="4" height="10" fill="#c48d45"/>
                <rect x="8" y="12" width="16" height="14" fill="#E5A657"/>
                <rect x="8" y="24" width="16" height="4" fill="#c48d45"/>
                <rect x="10" y="14" width="12" height="6" fill="#DFBC94"/>
                <rect x="12" y="16" width="2" height="2" fill="#3d2c1e"/>
                <rect x="18" y="16" width="2" height="2" fill="#3d2c1e"/>
                <rect x="14" y="20" width="4" height="2" fill="#B53324"/>
                <rect x="10" y="18" width="2" height="2" fill="#F5E2CE" opacity="0.5"/>
                <rect x="20" y="18" width="2" height="2" fill="#F5E2CE" opacity="0.5"/>
              </svg>
            ),
            top: '18%', left: '4%', delay: '0s', duration: '6s',
          },
          {
            // Laptop - chunky pixel art
            svg: (
              <svg width="68" height="52" viewBox="0 0 34 26" shapeRendering="crispEdges">
                <rect x="4" y="2" width="26" height="16" fill="#8a8a8a"/>
                <rect x="6" y="4" width="22" height="12" fill="#4a6fa5"/>
                <rect x="6" y="4" width="22" height="2" fill="#5a8abf"/>
                <rect x="12" y="8" width="2" height="2" fill="#fff"/>
                <rect x="20" y="8" width="2" height="2" fill="#fff"/>
                <rect x="14" y="12" width="6" height="2" fill="#F5E2CE"/>
                <rect x="2" y="18" width="30" height="4" fill="#a0a0a0"/>
                <rect x="2" y="18" width="30" height="2" fill="#b8b8b8"/>
                <rect x="12" y="20" width="10" height="2" fill="#8a8a8a"/>
                <rect x="10" y="10" width="2" height="2" fill="#F5E2CE" opacity="0.4"/>
                <rect x="22" y="10" width="2" height="2" fill="#F5E2CE" opacity="0.4"/>
              </svg>
            ),
            top: '55%', left: '8%', delay: '1.5s', duration: '7s',
          },
          {
            // Textbook - chunky pixel art
            svg: (
              <svg width="56" height="64" viewBox="0 0 28 32" shapeRendering="crispEdges">
                <rect x="4" y="2" width="20" height="28" fill="#F5E2CE"/>
                <rect x="4" y="2" width="4" height="28" fill="#B53324"/>
                <rect x="4" y="2" width="20" height="4" fill="#922a1d"/>
                <rect x="10" y="8" width="12" height="2" fill="#DFBC94"/>
                <rect x="10" y="12" width="8" height="2" fill="#DFBC94"/>
                <rect x="10" y="16" width="10" height="2" fill="#DFBC94"/>
                <rect x="12" y="22" width="2" height="2" fill="#3d2c1e"/>
                <rect x="18" y="22" width="2" height="2" fill="#3d2c1e"/>
                <rect x="14" y="26" width="4" height="2" fill="#B53324"/>
                <rect x="10" y="24" width="2" height="2" fill="#E5A657" opacity="0.5"/>
                <rect x="20" y="24" width="2" height="2" fill="#E5A657" opacity="0.5"/>
              </svg>
            ),
            top: '10%', left: '28%', delay: '0.8s', duration: '6.5s',
          },
          {
            // Mug with steam - chunky pixel art
            svg: (
              <svg width="52" height="60" viewBox="0 0 26 30" shapeRendering="crispEdges">
                <rect x="6" y="0" width="2" height="4" fill="#fff" opacity="0.5"/>
                <rect x="10" y="2" width="2" height="4" fill="#fff" opacity="0.4"/>
                <rect x="14" y="0" width="2" height="4" fill="#fff" opacity="0.5"/>
                <rect x="2" y="8" width="18" height="18" fill="#F5E2CE"/>
                <rect x="2" y="8" width="18" height="4" fill="#DFBC94"/>
                <rect x="20" y="12" width="4" height="4" fill="#F5E2CE"/>
                <rect x="20" y="16" width="4" height="4" fill="#F5E2CE"/>
                <rect x="22" y="12" width="2" height="8" fill="#DFBC94"/>
                <rect x="8" y="16" width="2" height="2" fill="#3d2c1e"/>
                <rect x="14" y="16" width="2" height="2" fill="#3d2c1e"/>
                <rect x="10" y="20" width="4" height="2" fill="#B53324"/>
                <rect x="6" y="18" width="2" height="2" fill="#E5A657" opacity="0.4"/>
                <rect x="16" y="18" width="2" height="2" fill="#E5A657" opacity="0.4"/>
              </svg>
            ),
            top: '22%', left: '68%', delay: '0.3s', duration: '5.8s',
          },
          {
            // Blanket/pillow - chunky pixel art
            svg: (
              <svg width="60" height="52" viewBox="0 0 30 26" shapeRendering="crispEdges">
                <rect x="2" y="4" width="26" height="18" fill="#E5A657"/>
                <rect x="2" y="4" width="26" height="4" fill="#DFBC94"/>
                <rect x="4" y="8" width="22" height="2" fill="#c48d45"/>
                <rect x="4" y="14" width="22" height="2" fill="#c48d45"/>
                <rect x="2" y="20" width="26" height="4" fill="#c48d45"/>
                <rect x="10" y="10" width="2" height="2" fill="#3d2c1e"/>
                <rect x="18" y="10" width="2" height="2" fill="#3d2c1e"/>
                <rect x="12" y="14" width="6" height="2" fill="#B53324"/>
                <rect x="8" y="12" width="2" height="2" fill="#F5E2CE" opacity="0.4"/>
                <rect x="20" y="12" width="2" height="2" fill="#F5E2CE" opacity="0.4"/>
              </svg>
            ),
            top: '42%', left: '42%', delay: '2s', duration: '7.2s',
          },
          {
            // Desk lamp - chunky pixel art
            svg: (
              <svg width="48" height="60" viewBox="0 0 24 30" shapeRendering="crispEdges">
                <rect x="6" y="2" width="12" height="4" fill="#E5A657"/>
                <rect x="4" y="4" width="16" height="8" fill="#E5A657"/>
                <rect x="6" y="4" width="12" height="2" fill="#F5E2CE"/>
                <rect x="10" y="12" width="4" height="2" fill="#DFBC94"/>
                <rect x="10" y="14" width="4" height="10" fill="#8a6d4b"/>
                <rect x="6" y="24" width="12" height="4" fill="#6b4a2e"/>
                <rect x="8" y="6" width="2" height="2" fill="#3d2c1e"/>
                <rect x="14" y="6" width="2" height="2" fill="#3d2c1e"/>
                <rect x="10" y="10" width="4" height="2" fill="#B53324"/>
                <rect x="6" y="8" width="2" height="2" fill="#F5E2CE" opacity="0.4"/>
                <rect x="16" y="8" width="2" height="2" fill="#F5E2CE" opacity="0.4"/>
              </svg>
            ),
            top: '60%', left: '75%', delay: '1s', duration: '6.2s',
          },
          {
            // Water bottle - chunky pixel art
            svg: (
              <svg width="36" height="64" viewBox="0 0 18 32" shapeRendering="crispEdges">
                <rect x="6" y="0" width="6" height="4" fill="#a0a0a0"/>
                <rect x="4" y="4" width="10" height="4" fill="#4a6fa5"/>
                <rect x="4" y="8" width="10" height="16" fill="#5a8abf"/>
                <rect x="4" y="8" width="10" height="4" fill="#7ab0d4"/>
                <rect x="4" y="24" width="10" height="4" fill="#4a6fa5"/>
                <rect x="6" y="14" width="2" height="2" fill="#fff" opacity="0.6"/>
                <rect x="10" y="14" width="2" height="2" fill="#fff" opacity="0.6"/>
                <rect x="8" y="18" width="2" height="2" fill="#F5E2CE"/>
                <rect x="6" y="16" width="2" height="2" fill="#7ab0d4" opacity="0.5"/>
                <rect x="10" y="16" width="2" height="2" fill="#7ab0d4" opacity="0.5"/>
              </svg>
            ),
            top: '70%', left: '35%', delay: '2.5s', duration: '5.5s',
          },
          {
            // Backpack - chunky pixel art
            svg: (
              <svg width="56" height="64" viewBox="0 0 28 32" shapeRendering="crispEdges">
                <rect x="8" y="2" width="12" height="4" fill="#922a1d"/>
                <rect x="4" y="6" width="20" height="20" fill="#B53324"/>
                <rect x="8" y="10" width="12" height="8" fill="#F5E2CE"/>
                <rect x="10" y="12" width="8" height="4" fill="#DFBC94"/>
                <rect x="4" y="24" width="20" height="4" fill="#922a1d"/>
                <rect x="2" y="10" width="2" height="12" fill="#8a6d4b"/>
                <rect x="24" y="10" width="2" height="12" fill="#8a6d4b"/>
                <rect x="10" y="10" width="2" height="2" fill="#3d2c1e"/>
                <rect x="16" y="10" width="2" height="2" fill="#3d2c1e"/>
                <rect x="12" y="14" width="4" height="2" fill="#E5A657"/>
              </svg>
            ),
            top: '8%', left: '52%', delay: '0.6s', duration: '6.8s',
          },
        ].map((item, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              top: item.top,
              left: item.left,
              zIndex: 1,
              animation: `kawaiiBob ${item.duration} ease-in-out infinite`,
              animationDelay: item.delay,
              '@keyframes kawaiiBob': {
                '0%': { transform: 'translateY(0px) rotate(0deg)' },
                '25%': { transform: 'translateY(-10px) rotate(3deg)' },
                '50%': { transform: 'translateY(-3px) rotate(-2deg)' },
                '75%': { transform: 'translateY(-12px) rotate(2deg)' },
                '100%': { transform: 'translateY(0px) rotate(0deg)' },
              },
            }}
          >
            {item.svg}
          </Box>
        ))}
      </Box>

      {/* ── Footer ──────────────────────────────────── */}
      <Box
        sx={{
          backgroundColor: '#3d2c1e',
          py: 4,
          px: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" sx={{ color: '#DFBC94' }}>
          ShareLine · Built for the Five College Community
        </Typography>
        <Typography variant="caption" sx={{ color: '#8a6d4b', mt: 0.5, display: 'block' }}>
          UMass Amherst · Amherst College · Hampshire College · Mount Holyoke
          College · Smith College
        </Typography>
      </Box>
    </Box>
  );
}