/*"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line
} from "recharts";

export function PlacedVsUnplacedChart({ data }: { data: { bucket: string; placedPct: number; unplacedPct: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
        <Tooltip formatter={(v: number) => `${v}%`} />
        <Legend />
        <Bar dataKey="placedPct" fill="#2F7D5D" name="Placed" radius={[3, 3, 0, 0]} />
        <Bar dataKey="unplacedPct" fill="#B3462C" name="Unplaced" radius={[3, 3, 0, 0]} />
        <Line type="monotone" dataKey="placedPct" stroke="#663366" strokeWidth={2.5} dot={{ r: 3 }} name="Placed % trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PlacementRateBarChart({ data, barColor = "#663366" }: { data: { label: string; placed: number; total: number; rate: number }[]; barColor?: string }) {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
        <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number, name: string, props: any) => [`${v}% (${props.payload.placed}/${props.payload.total})`, "Placement rate"]} />
        <Bar dataKey="rate" fill={barColor} radius={[0, 4, 4, 0]} name="Placement rate" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopJobTitlesChart({ data }: { data: { title: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="title" width={180} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#00A8A8" radius={[0, 4, 4, 0]} name="Placements" />
      </BarChart>
    </ResponsiveContainer>
  );
}*/

"use client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line
} from "recharts";

function PlacedVsUnplacedTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #E4E1D8", borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: "#663366" }}>{label}</p>
      <p style={{ color: "#2F7D5D", margin: 0 }}>Placed: {d.placedCount} ({d.placedPct}%)</p>
      <p style={{ color: "#B3462C", margin: 0 }}>Unplaced: {d.unplacedCount} ({100 - d.placedPct}%)</p>
    </div>
  );
}

export function PlacedVsUnplacedChart({ data }: { data: { bucket: string; placedPct: number; placedCount: number; unplacedCount: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
        <YAxis yAxisId="left" tick={{ fontSize: 12 }} allowDecimals={false} label={{ value: "Students", angle: -90, position: "insideLeft", fontSize: 11, fill: "#8A8A8A" }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
        <Tooltip content={<PlacedVsUnplacedTooltip />} />
        <Legend />
        <Bar yAxisId="left" dataKey="placedCount" fill="#2F7D5D" name="Placed (cumulative)" radius={[3, 3, 0, 0]} />
        <Bar yAxisId="left" dataKey="unplacedCount" fill="#B3462C" name="Unplaced (cumulative)" radius={[3, 3, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="placedPct" stroke="#663366" strokeWidth={2.5} dot={{ r: 3 }} name="Placed % trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PlacementRateBarChart({ data, barColor = "#663366" }: { data: { label: string; placed: number; total: number; rate: number }[]; barColor?: string }) {
  const sorted = [...data].sort((a, b) => b.rate - a.rate);
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
        <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number, name: string, props: any) => [`${v}% (${props.payload.placed}/${props.payload.total})`, "Placement rate"]} />
        <Bar dataKey="rate" fill={barColor} radius={[0, 4, 4, 0]} name="Placement rate" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopJobTitlesChart({ data }: { data: { title: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E4E1D8" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
        <YAxis type="category" dataKey="title" width={180} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey="count" fill="#00A8A8" radius={[0, 4, 4, 0]} name="Placements" />
      </BarChart>
    </ResponsiveContainer>
  );
}
