import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ContentBlock } from '@/models/content-block.model';

type TableBlockData = Extract<ContentBlock, { type: 'table' }>;

export default function TableBlockRenderer({ block }: { block: TableBlockData }) {
  return (
    <figure style={{ margin: '24px 0' }}>
      {block.caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          {block.caption}
        </Typography>
      )}
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {block.columns.map((column) => (
                <TableCell key={column} sx={{ fontWeight: 700 }}>
                  {column}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {block.rows.map((row, rowIndex) => (
              // eslint-disable-next-line react/no-array-index-key
              <TableRow key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <TableCell key={cellIndex}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {block.note && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {block.note}
        </Typography>
      )}
    </figure>
  );
}
