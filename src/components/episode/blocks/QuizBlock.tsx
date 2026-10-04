'use client';

import * as React from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { PublicQuizBlock } from '@/models/content-block.model';
import { checkQuizAnswersAction } from '@/features/quiz/actions';
import { recordQuizScore } from '@/lib/utilities/quiz-score-client';

type Response = string | boolean;

export default function QuizBlock({ block, episodeSlug }: { block: PublicQuizBlock; episodeSlug: string }) {
  const [responses, setResponses] = React.useState<Record<string, Response>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<Awaited<ReturnType<typeof checkQuizAnswersAction>> | null>(null);

  const allAnswered = block.questions.every((q) => responses[q.id] !== undefined && responses[q.id] !== '');

  async function handleSubmit() {
    setSubmitting(true);
    const outcome = await checkQuizAnswersAction(episodeSlug, block.id, responses);
    setSubmitting(false);
    setResult(outcome);
    if (outcome.ok) {
      recordQuizScore({
        episodeSlug,
        blockId: block.id,
        score: outcome.data.score,
        total: outcome.data.total,
        completedAt: new Date().toISOString(),
      });
    }
  }

  const resultByQuestionId = new Map(
    result?.ok ? result.data.results.map((r) => [r.questionId, r] as const) : [],
  );

  return (
    <Paper
      id={block.id}
      variant="outlined"
      sx={{ my: 3, p: { xs: 2.5, md: 3 }, scrollMarginTop: '96px' }}
      component="section"
      aria-label={block.title}
    >
      <Typography variant="h6" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
        {block.title}
      </Typography>

      <Stack spacing={3}>
        {block.questions.map((question, index) => {
          const questionResult = resultByQuestionId.get(question.id);
          return (
            <Stack key={question.id} spacing={1}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {index + 1}. {question.prompt}
              </Typography>

              {question.questionType === 'multiple-choice' && (
                <RadioGroup
                  value={responses[question.id] ?? ''}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
                >
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option.id}
                      value={option.id}
                      control={<Radio disabled={!!result} />}
                      label={option.text}
                    />
                  ))}
                </RadioGroup>
              )}

              {question.questionType === 'true-false' && (
                <RadioGroup
                  row
                  value={responses[question.id] === undefined ? '' : String(responses[question.id])}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [question.id]: e.target.value === 'true' }))}
                >
                  <FormControlLabel value="true" control={<Radio disabled={!!result} />} label="True" />
                  <FormControlLabel value="false" control={<Radio disabled={!!result} />} label="False" />
                </RadioGroup>
              )}

              {question.questionType === 'short-answer' && (
                <TextField
                  size="small"
                  disabled={!!result}
                  value={(responses[question.id] as string) ?? ''}
                  onChange={(e) => setResponses((prev) => ({ ...prev, [question.id]: e.target.value }))}
                  sx={{ maxWidth: 360 }}
                />
              )}

              {questionResult && (
                <Alert
                  severity={questionResult.correct ? 'success' : 'error'}
                  icon={questionResult.correct ? <CheckCircleIcon fontSize="inherit" /> : <CancelIcon fontSize="inherit" />}
                >
                  {questionResult.correct ? 'Correct! ' : `Not quite — the answer is "${questionResult.correctAnswerLabel}". `}
                  {questionResult.explanation}
                </Alert>
              )}
            </Stack>
          );
        })}
      </Stack>

      {!result && (
        <Button
          variant="contained"
          sx={{ mt: 3 }}
          disabled={!allAnswered || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Checking…' : 'Submit answers'}
        </Button>
      )}

      {result?.ok && (
        <Alert severity="info" sx={{ mt: 3 }}>
          You scored {result.data.score} / {result.data.total}.
        </Alert>
      )}
      {result && !result.ok && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {result.error}
        </Alert>
      )}
    </Paper>
  );
}
