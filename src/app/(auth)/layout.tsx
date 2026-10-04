import Box from '@mui/material/Box';

/**
 * Shell for authentication-only routes (currently just /admin/login).
 * Deliberately has no public nav and no admin nav — a visitor here is, by
 * definition, not yet authenticated.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      {children}
    </Box>
  );
}
