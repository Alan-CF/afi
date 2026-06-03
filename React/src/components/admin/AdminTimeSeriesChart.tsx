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
  valueLabel?: string;
};

const AXIS_COLOR = '#64748B';
const GRID_COLOR = '#E2E8F0';

const TOOLTIP_CONTENT_STYLE = {
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  fontFamily: 'Lato, sans-serif',
  fontSize: 12,
};

const TOOLTIP_LABEL_STYLE = {
  color: '#1D428A',
  fontWeight: 700,
};

export default function AdminTimeSeriesChart({
  data,
  variant = 'line',
  color = '#1D428A',
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
    tickLine: false,
  };

  return (
    <div className="h-[240px] w-full md:h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        {variant === 'bar' ? (
          <BarChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            <XAxis dataKey="label" interval="preserveStartEnd" {...axisProps} />
            <YAxis allowDecimals={false} width={36} {...axisProps} />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              cursor={{ fill: 'rgba(29, 66, 138, 0.06)' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            <XAxis dataKey="label" interval="preserveStartEnd" {...axisProps} />
            <YAxis allowDecimals={false} width={36} {...axisProps} />
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              cursor={{ stroke: '#1D428A', strokeOpacity: 0.2 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
