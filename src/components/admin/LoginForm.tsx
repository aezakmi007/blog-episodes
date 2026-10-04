'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import { loginAction, type LoginFormState } from '@/features/auth/actions';

const initialState: LoginFormState = {};

/**
 * Two fields, one server-validated submit — simple enough that a native
 * form bound to a Server Action via `useActionState` is clearer than
 * wiring React Hook Form around it. RHF is reserved for the episode block
 * editor (Phase 4), which has genuinely complex, dynamic field arrays.
 */
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="contained" size="large" fullWidth disabled={pending}>
      {pending ? 'Signing in…' : 'Sign in'}
    </Button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <Box component="form" action={formAction} noValidate sx={{ width: '100%', maxWidth: 400 }}>
      {next && <input type="hidden" name="next" value={next} />}

      <Stack spacing={2.5}>
        {state.error && (
          <Alert severity="error" role="alert">
            {state.error}
          </Alert>
        )}

        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          required
          fullWidth
          error={Boolean(state.fieldErrors?.email)}
          helperText={state.fieldErrors?.email}
          slotProps={{ htmlInput: { 'aria-describedby': 'login-email-helper' } }}
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          fullWidth
          error={Boolean(state.fieldErrors?.password)}
          helperText={state.fieldErrors?.password}
        />

        <SubmitButton />
      </Stack>
    </Box>
  );
}
