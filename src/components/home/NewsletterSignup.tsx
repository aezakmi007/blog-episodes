'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';

/**
 * Newsletter-ready placeholder, per the brief: present in the UI, but with
 * no real email-provider integration in the MVP. Submitting shows a soft
 * "coming soon" confirmation rather than silently doing nothing or
 * throwing — honest about the current capability without blocking the
 * section from existing.
 */
export default function NewsletterSignup() {
  const [submitted, setSubmitted] = React.useState(false);

  return (
    <Paper
      variant="outlined"
      sx={{ p: { xs: 3, md: 4 }, bgcolor: 'background.paper' }}
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <Stack spacing={1.5} alignItems="flex-start">
        <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
          Get the next Sunday in your inbox
        </Typography>
        <Typography variant="body2" color="text.secondary">
          A short note whenever a new episode goes live. No spam, no sales pitches.
        </Typography>
        {submitted ? (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'secondary.main' }}>
            Thanks! Email delivery is coming soon — we&apos;ll notify you the day it&apos;s live.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', gap: 1.5, width: '100%', maxWidth: 420, flexWrap: 'wrap' }}>
            <TextField
              type="email"
              required
              placeholder="you@example.com"
              size="small"
              sx={{ flex: 1, minWidth: 200 }}
              aria-label="Email address"
            />
            <Button type="submit" variant="contained">
              Notify me
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
