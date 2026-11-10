'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceDot,
  Label,
} from 'recharts';
import type { ContentBlock } from '@/models/content-block.model';

type ChartBlockData = Extract<ContentBlock, { type: 'chart' }>;

/**
 * Inline scatter / line / bar chart rendered with Recharts.
 * Supports an optional best-fit `trendLine` (rendered as a
 * ReferenceLine) and annotation dots with labels.
 */
export default function ChartBlock({ block }: { block: ChartBlockData }) {
  const theme = useTheme();

  const primaryColor = theme.palette.secondary.main;
  const gridColor = theme.palette.divider;
  const textColor = theme.palette.text.secondary;
  const trendColor = theme.palette.error.main;

  // Flatten data points into a Recharts-friendly array.
  // Each point: { label, x, y, ...otherValues }
  const dataKeys = Object.keys(block.dataPoints[0]?.values ?? {});
  const xKey = dataKeys[0] ?? 'x';
  const yKey = dataKeys[1] ?? 'y';

  const data = block.dataPoints.map((dp) => ({
    name: dp.label,
    [xKey]: dp.values[xKey],
    [yKey]: dp.values[yKey],
    ...dp.values,
  }));

  // Generate trend line points for the visible x-range
  const trendPoints = React.useMemo(() => {
    if (!block.trendLine) return [];
    const xValues = data.map((d) => Number(d[xKey])).filter((v) => !isNaN(v));
    const xMin = Math.min(...xValues);
    const xMax = Math.max(...xValues);
    const { slope, intercept } = block.trendLine;
    const steps = 50;
    const step = (xMax - xMin) / steps;
    return Array.from({ length: steps + 1 }, (_, i) => {
      const x = xMin + i * step;
      return { [xKey]: x, trend: slope * x + intercept };
    });
  }, [block.trendLine, data, xKey]);

  const chartHeight = block.height ?? 320;

  const renderChart = () => {
    switch (block.chartType) {
      case 'scatter': {
        return (
          <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              type="number"
              dataKey={xKey}
              name={block.xAxisLabel ?? xKey}
              domain={['auto', 'auto']}
              tick={{ fill: textColor, fontSize: 12 }}
            >
              {block.xAxisLabel && (
                <Label value={block.xAxisLabel} position="bottom" offset={20} fill={textColor} fontSize={13} />
              )}
            </XAxis>
            <YAxis
              type="number"
              dataKey={yKey}
              name={block.yAxisLabel ?? yKey}
              domain={['auto', 'auto']}
              tick={{ fill: textColor, fontSize: 12 }}
            >
              {block.yAxisLabel && (
                <Label
                  value={block.yAxisLabel}
                  position="left"
                  angle={-90}
                  offset={0}
                  fill={textColor}
                  fontSize={13}
                  style={{ textAnchor: 'middle' }}
                />
              )}
            </YAxis>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Scatter data={data} fill={primaryColor} r={6} />
            {block.trendLine &&
              trendPoints.length > 1 &&
              (() => {
                const { slope, intercept, label } = block.trendLine;
                const xValues = data.map((d) => Number(d[xKey]));
                const xMin = Math.min(...xValues);
                const xMax = Math.max(...xValues);
                return (
                  <ReferenceLine
                    segment={[
                      { x: xMin, y: slope * xMin + intercept },
                      { x: xMax, y: slope * xMax + intercept },
                    ]}
                    stroke={trendColor}
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={
                      label
                        ? { value: label, fill: trendColor, fontSize: 12, position: 'insideTopRight' }
                        : undefined
                    }
                  />
                );
              })()}
            {(block.annotations ?? []).map((ann, i) => (
              <ReferenceDot
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                x={ann.x}
                y={ann.y}
                r={5}
                fill={trendColor}
                stroke="none"
                label={{ value: ann.label, fill: textColor, fontSize: 11, position: 'top' }}
              />
            ))}
          </ScatterChart>
        );
      }
      case 'line': {
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey={xKey} tick={{ fill: textColor, fontSize: 12 }}>
              {block.xAxisLabel && (
                <Label value={block.xAxisLabel} position="bottom" offset={20} fill={textColor} fontSize={13} />
              )}
            </XAxis>
            <YAxis tick={{ fill: textColor, fontSize: 12 }}>
              {block.yAxisLabel && (
                <Label
                  value={block.yAxisLabel}
                  position="left"
                  angle={-90}
                  offset={0}
                  fill={textColor}
                  fontSize={13}
                  style={{ textAnchor: 'middle' }}
                />
              )}
            </YAxis>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <Line type="monotone" dataKey={yKey} stroke={primaryColor} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        );
      }
      case 'bar': {
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 40, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 12 }}>
              {block.xAxisLabel && (
                <Label value={block.xAxisLabel} position="bottom" offset={20} fill={textColor} fontSize={13} />
              )}
            </XAxis>
            <YAxis tick={{ fill: textColor, fontSize: 12 }}>
              {block.yAxisLabel && (
                <Label
                  value={block.yAxisLabel}
                  position="left"
                  angle={-90}
                  offset={0}
                  fill={textColor}
                  fontSize={13}
                  style={{ textAnchor: 'middle' }}
                />
              )}
            </YAxis>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
              }}
            />
            <ReferenceLine y={0} stroke={gridColor} />
            <Bar dataKey={yKey} fill={primaryColor} radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      }
    }
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        my: 3,
        p: { xs: 2, md: 3 },
        overflow: 'hidden',
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}
      >
        {block.title}
      </Typography>

      <Box sx={{ width: '100%', height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </Box>

      {block.caption && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5, textAlign: 'center' }}>
          {block.caption}
        </Typography>
      )}
    </Paper>
  );
}

