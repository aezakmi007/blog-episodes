import Link from 'next/link';
import MuiBreadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';

export interface Crumb {
  label: string;
  href?: string;
}

export default function AppBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <MuiBreadcrumbs aria-label="Breadcrumb" sx={{ mb: 2, fontSize: '0.875rem' }}>
      {items.map((item, index) =>
        item.href && index < items.length - 1 ? (
          <Typography
            key={item.label}
            component={Link}
            href={item.href}
            variant="body2"
            color="text.secondary"
            sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
          >
            {item.label}
          </Typography>
        ) : (
          <Typography key={item.label} variant="body2" color="text.primary" aria-current="page">
            {item.label}
          </Typography>
        ),
      )}
    </MuiBreadcrumbs>
  );
}
