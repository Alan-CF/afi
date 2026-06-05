import {
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatNumber, type TimePoint } from '../../lib/adminDashboardApi';
import AdminChartFrame from './AdminChartFrame';

type AdminTimeSeriesChartProps = {
  data: TimePoint[];
  variant?: 'line' | 'bar';
  color?: string;
  valueLabel?: string;
  xLabel?: string;
  yLabel?: string;
};

const AXIS_COLOR = '#64748B';
const GRID_COLOR = '#E2E8F0';
const LABEL_STYLE = {
  fontSize: 11,
  fontWeight: 700,
  fill: AXIS_COLOR,
};

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
  xLabel = 'Date',
  yLabel = 'Value',
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

  const margin = { top: 8, right: 12, bottom: 22, left: 8 };

  const xAxis = (
    <XAxis dataKey="label" interval="preserveStartEnd" height={36} {...axisProps}>
      <Label value={xLabel} position="insideBottom" offset={2} style={LABEL_STYLE} />
    </XAxis>
  );

  const yAxis = (
    <YAxis allowDecimals={false} width={48} {...axisProps}>
      <Label
        value={yLabel}
        angle={-90}
        position="insideLeft"
        style={{ ...LABEL_STYLE, textAnchor: 'middle' }}
      />
    </YAxis>
  );

  return (
    <AdminChartFrame>
      {({ width, height }) =>
        variant === 'bar' ? (
          <BarChart width={width} height={height} data={data} margin={margin}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            {xAxis}
            {yAxis}
            <Tooltip
              formatter={tooltipFormatter}
              contentStyle={TOOLTIP_CONTENT_STYLE}
              labelStyle={TOOLTIP_LABEL_STYLE}
              cursor={{ fill: 'rgba(29, 66, 138, 0.06)' }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart width={width} height={height} data={data} margin={margin}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={GRID_COLOR}
              vertical={false}
            />
            {xAxis}
            {yAxis}
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
        )
      }
    </AdminChartFrame>
  );
}
