import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, type TimePoint } from '../../lib/adminDashboardApi';

type AdminTimeSeriesChartProps = {
  data: TimePoint[];
  variant?: 'line' | 'bar';
  color?: string;
  height?: number;
  valueLabel?: string;
};

const AXIS_COLOR = '#334155';
const GRID_COLOR = '#E2E8F0';

export default function AdminTimeSeriesChart({
  data,
  variant = 'line',
  color = '#1D428A',
  height = 260,
  valueLabel = 'Value',
}: AdminTimeSeriesChartProps) {
  const tooltipFormatter = (
    value: number | string | ReadonlyArray<number | string> | undefined
  ): [string, string] => {
    const numeric = Array.isArray(value)
      ? Number(value[0])
      : Number(value ?? 0);
    return [formatNumber(numeric), valueLabel];
  };

  const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fontSize: 11, fill: AXIS_COLOR },
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      {variant === 'bar' ? (
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
          <XAxis dataKey="label" interval="preserveStartEnd" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip formatter={tooltipFormatter} />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      ) : (
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke={GRID_COLOR}
            vertical={false}
          />
          <XAxis dataKey="label" interval="preserveStartEnd" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip formatter={tooltipFormatter} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      )}
    </ResponsiveContainer>
  );
}
