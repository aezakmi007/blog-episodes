'use client';

import * as React from 'react';
import TextField from '@mui/material/TextField';

/**
 * Edits a `string[]` field as one item per line — a deliberately simple,
 * fully keyboard- and screen-reader-accessible control for list-shaped
 * content (related terms, homework tasks, summary points, step-by-step
 * explanations) without building a bespoke chip/tag input for each one.
 *
 * Keeps its own local text buffer rather than deriving the textarea's
 * displayed value from `value.join('\n')` on every keystroke — otherwise
 * stripping a blank line the moment it's typed (so the parent's array
 * never holds empty items) would make pressing Enter to start a new item
 * visually "snap back". Blank lines are filtered out only when emitting
 * `onChange` to the parent and once more on blur.
 */
export default function StringListField({
  label,
  value,
  onChange,
  helperText,
  minRows = 3,
}: {
  label: string;
  value: string[];
  onChange: (next: string[]) => void;
  helperText?: string;
  minRows?: number;
}) {
  const [rawText, setRawText] = React.useState(() => value.join('\n'));

  return (
    <TextField
      label={label}
      helperText={helperText ?? 'One per line'}
      multiline
      minRows={minRows}
      fullWidth
      value={rawText}
      onChange={(event) => {
        setRawText(event.target.value);
        onChange(
          event.target.value
            .split('\n')
            .map((line) => line.trimEnd())
            .filter((line) => line.length > 0),
        );
      }}
      onBlur={() => setRawText(value.join('\n'))}
    />
  );
}
