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
  Cell,
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
  const isDark = theme.palette.mode === 'dark';

  // Flatten data points into a Recharts-friendly array.
  // Each point: { name, [xKey], [yKey], ...values }
  const dataKeys = Object.keys(block.dataPoints[0]?.values ?? {});
  const xKey: string = dataKeys[0] ?? 'x';
  const yKey: string = dataKeys[1] ?? 'y';

  // For bar charts, the value key is often single-keyed (e.g. { weight: 4.0 })
  const barValueKey: string =
    block.chartType === 'bar'
      ? (dataKeys.length === 1 ? (dataKeys[0] ?? 'value') : (dataKeys[1] ?? dataKeys[0] ?? 'value'))
      : yKey;

  interface ChartDataItem {
    name: string;
    [key: string]: string | number | undefined;
  }

  const data: ChartDataItem[] = block.dataPoints.map((dp) => {
    const rawValues = dp.values ?? {};
    const firstVal = Object.values(rawValues)[0] ?? 0;
    return {
      name: dp.label,
      ...rawValues,
      [xKey]: rawValues[xKey] ?? firstVal,
      [yKey]: rawValues[yKey] ?? firstVal,
      [barValueKey]: rawValues[barValueKey] ?? firstVal,
    };
  });

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
                color: theme.palette.text.primary,
              }}
              labelStyle={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 4,
              }}
              itemStyle={{
                color: theme.palette.text.primary,
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
                color: theme.palette.text.primary,
              }}
              labelStyle={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 4,
              }}
              itemStyle={{
                color: theme.palette.text.primary,
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
            <YAxis tick={{ fill: textColor, fontSize: 12 }} domain={['auto', 'auto']}>
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
              cursor={{
                fill: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
              }}
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${gridColor}`,
                borderRadius: 8,
                fontSize: 13,
                color: theme.palette.text.primary,
              }}
              labelStyle={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                marginBottom: 4,
              }}
              itemStyle={{
                color: theme.palette.text.primary,
              }}
            />
            <ReferenceLine y={0} stroke={textColor} strokeWidth={1.5} />
            <Bar dataKey={barValueKey} radius={[4, 4, 4, 4]}>
              {data.map((entry, index) => {
                const val = Number(entry[barValueKey]);
                const fillColor = val >= 0 ? primaryColor : theme.palette.error.main;
                return <Cell key={`cell-${index}`} fill={fillColor} />;
              })}
            </Bar>
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

