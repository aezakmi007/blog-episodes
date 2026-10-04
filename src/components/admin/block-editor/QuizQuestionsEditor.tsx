'use client';

import { nanoid } from 'nanoid';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Radio from '@mui/material/Radio';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import type { QuizQuestion } from '@/models/content-block.model';

type AnyQuestion = QuizQuestion;

function blankQuestion(questionType: QuizQuestion['questionType']): QuizQuestion {
  const base = { id: `q-${nanoid(6)}`, prompt: '', explanation: '' };
  if (questionType === 'multiple-choice') {
    return {
      ...base,
      questionType,
      options: [
        { id: 'a', text: '' },
        { id: 'b', text: '' },
      ],
      correctOptionId: 'a',
    };
  }
  if (questionType === 'true-false') {
    return { ...base, questionType, correctAnswer: true };
  }
  return { ...base, questionType: 'short-answer', acceptableAnswers: [''] };
}

export default function QuizQuestionsEditor({
  questions,
  onChange,
}: {
  questions: AnyQuestion[];
  onChange: (next: AnyQuestion[]) => void;
}) {
  function updateQuestion(index: number, next: AnyQuestion) {
    onChange(questions.map((q, i) => (i === index ? next : q)));
  }

  function removeQuestion(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <Stack spacing={2}>
      {questions.map((question, index) => (
        <Box key={question.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ mb: 1.5 }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel id={`qtype-${question.id}`}>Question type</InputLabel>
              <Select
                labelId={`qtype-${question.id}`}
                label="Question type"
                value={question.questionType}
                onChange={(e) =>
                  updateQuestion(index, blankQuestion(e.target.value as QuizQuestion['questionType']))
                }
              >
                <MenuItem value="multiple-choice">Multiple choice</MenuItem>
                <MenuItem value="true-false">True / False</MenuItem>
                <MenuItem value="short-answer">Short answer</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              aria-label="Remove question"
              onClick={() => removeQuestion(index)}
              disabled={questions.length <= 1}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>

          <TextField
            label="Question prompt"
            fullWidth
            sx={{ mb: 1.5 }}
            value={question.prompt}
            onChange={(e) => updateQuestion(index, { ...question, prompt: e.target.value })}
          />

          {question.questionType === 'multiple-choice' && (
            <Stack spacing={1} sx={{ mb: 1.5 }}>
              {question.options.map((option, optIndex) => (
                <Stack key={option.id} direction="row" spacing={1} alignItems="center">
                  <Radio
                    checked={question.correctOptionId === option.id}
                    onChange={() => updateQuestion(index, { ...question, correctOptionId: option.id })}
                    inputProps={{ 'aria-label': `Mark option ${optIndex + 1} correct` }}
                  />
                  <TextField
                    size="small"
                    fullWidth
                    label={`Option ${optIndex + 1}`}
                    value={option.text}
                    onChange={(e) =>
                      updateQuestion(index, {
                        ...question,
                        options: question.options.map((o, i) =>
                          i === optIndex ? { ...o, text: e.target.value } : o,
                        ),
                      })
                    }
                  />
                  <IconButton
                    size="small"
                    aria-label="Remove option"
                    disabled={question.options.length <= 2}
                    onClick={() =>
                      updateQuestion(index, {
                        ...question,
                        options: question.options.filter((_, i) => i !== optIndex),
                        correctOptionId:
                          question.correctOptionId === option.id
                            ? (question.options.find((o) => o.id !== option.id)?.id ?? option.id)
                            : question.correctOptionId,
                      })
                    }
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ))}
              <Button
                size="small"
                startIcon={<AddIcon />}
                sx={{ alignSelf: 'flex-start' }}
                disabled={question.options.length >= 6}
                onClick={() =>
                  updateQuestion(index, {
                    ...question,
                    options: [...question.options, { id: nanoid(4), text: '' }],
                  })
                }
              >
                Add option
              </Button>
            </Stack>
          )}

          {question.questionType === 'true-false' && (
            <FormControl size="small" sx={{ mb: 1.5, minWidth: 160 }}>
              <InputLabel id={`tf-${question.id}`}>Correct answer</InputLabel>
              <Select
                labelId={`tf-${question.id}`}
                label="Correct answer"
                value={question.correctAnswer ? 'true' : 'false'}
                onChange={(e) =>
                  updateQuestion(index, { ...question, correctAnswer: e.target.value === 'true' })
                }
              >
                <MenuItem value="true">True</MenuItem>
                <MenuItem value="false">False</MenuItem>
              </Select>
            </FormControl>
          )}

          {question.questionType === 'short-answer' && (
            <TextField
              label="Acceptable answers (one per line)"
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 1.5 }}
              value={question.acceptableAnswers.join('\n')}
              onChange={(e) =>
                updateQuestion(index, {
                  ...question,
                  // Not filtered on every keystroke (a trailing blank line
                  // while typing a new answer would otherwise vanish
                  // immediately) — blanks are stripped on save by the Zod
                  // schema's validation pass instead.
                  acceptableAnswers: e.target.value.split('\n'),
                })
              }
            />
          )}

          <TextField
            label="Explanation (shown after the quiz is submitted)"
            fullWidth
            multiline
            minRows={2}
            value={question.explanation}
            onChange={(e) => updateQuestion(index, { ...question, explanation: e.target.value })}
          />
        </Box>
      ))}

      <Divider />
      <Button
        startIcon={<AddIcon />}
        sx={{ alignSelf: 'flex-start' }}
        disabled={questions.length >= 10}
        onClick={() => onChange([...questions, blankQuestion('multiple-choice')])}
      >
        Add question
      </Button>
    </Stack>
  );
}
