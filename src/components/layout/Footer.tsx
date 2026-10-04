import Link from 'next/link';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid2';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

const FOOTER_COLUMNS = [
  {
    heading: 'Learn',
    links: [
      { href: '/series', label: 'All series' },
      { href: '/topics', label: 'Topics' },
      { href: '/search', label: 'Search' },
    ],
  },
  {
    heading: 'Story',
    links: [
      { href: '/characters', label: 'Shyam & Salim' },
      { href: '/about', label: 'About the project' },
      { href: '/bookmarks', label: 'Your bookmarks' },
    ],
  },
] as const;

/**
 * Public footer. Server Component — purely static markup, no client JS.
 * Social links are placeholders (href="#") until real accounts exist;
 * they are still real <a> elements with accessible labels, not fake
 * buttons, so they remain keyboard- and screen-reader-navigable.
 */
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        mt: { xs: 8, md: 12 },
        py: { xs: 6, md: 8 },
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1 }}>
              Shyam &amp; Salim Learn ML
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85, maxWidth: 360 }}>
              Do dost. Ek chai. Aur Machine Learning. A Sunday study session, turned into a learning
              series.
            </Typography>
          </Grid>

          {FOOTER_COLUMNS.map((col) => (
            <Grid size={{ xs: 6, md: 2 }} key={col.heading}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, opacity: 0.9 }}>
                {col.heading}
              </Typography>
              <Stack spacing={1} component="nav" aria-label={col.heading}>
                {col.links.map((link) => (
                  <Typography
                    key={link.href}
                    component={Link}
                    href={link.href}
                    variant="body2"
                    sx={{ color: 'inherit', textDecoration: 'none', opacity: 0.85, '&:hover': { opacity: 1, textDecoration: 'underline' } }}
                  >
                    {link.label}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          ))}

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, opacity: 0.9 }}>
              Follow along
            </Typography>
            <Stack direction="row" spacing={2} component="nav" aria-label="Social">
              {['YouTube', 'Instagram', 'X'].map((platform) => (
                <Typography
                  key={platform}
                  component="a"
                  href="#"
                  variant="body2"
                  sx={{ color: 'inherit', textDecoration: 'underline', opacity: 0.85 }}
                >
                  {platform}
                </Typography>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255,255,255,0.2)' }} />

        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          © {new Date().getFullYear()} Shyam &amp; Salim Learn ML. Made with chai, pakode and a lot of
          debugging.
        </Typography>
      </Container>
    </Box>
  );
}
