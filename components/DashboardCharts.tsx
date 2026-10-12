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
import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ComposedChart, Line
} from "recharts";

// Chart colours for light and dark mode. Charts are drawn as SVG by recharts,
// which can't use the Tailwind theme classes, so the palette is chosen here
// and swapped whenever the theme changes.
const LIGHT = {
  grid: "#E6E2EA", axis: "#6B6470", placed: "#2F7D5D", unplaced: "#B3462C", trend: "#663367",
  brand: "#663367", brandSoft: "#8C5B8C", accent: "#38BFC3", dotFill: "#FFFFFF",
  tooltipBg: "#FFFFFF", tooltipBorder: "#E6E2EA", tooltipText: "#221F1F", cursor: "rgba(102, 51, 103, 0.06)"
};
const DARK: typeof LIGHT = {
  grid: "#342E3C", axis: "#A69FAD", placed: "#4FB98B", unplaced: "#E07A60", trend: "#D6AAD7",
  brand: "#B47FB5", brandSoft: "#9B6E9C", accent: "#38BFC3", dotFill: "#1B1721",
  tooltipBg: "#1B1721", tooltipBorder: "#342E3C", tooltipText: "#ECE9F0", cursor: "rgba(255, 255, 255, 0.05)"
};
type Palette = typeof LIGHT;

function useChartPalette(): Palette {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? DARK : LIGHT;
}

function tooltipBox(p: Palette) {
  return { background: p.tooltipBg, border: `1px solid ${p.tooltipBorder}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, boxShadow: "0 4px 14px rgba(0, 0, 0, 0.12)" };
}

function PlacedVsUnplacedTooltip({ active, payload, label, palette }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0].payload;
  const p: Palette = palette ?? LIGHT;
  return (
    <div style={tooltipBox(p)}>
      <p style={{ fontWeight: 600, marginBottom: 4, color: p.tooltipText }}>{label}</p>
      <p style={{ color: p.placed, margin: 0 }}>Placed: {d.placedCount} ({d.placedPct}%)</p>
      <p style={{ color: p.unplaced, margin: 0 }}>Unplaced: {d.unplacedCount} ({100 - d.placedPct}%)</p>
    </div>
  );
}

export function PlacedVsUnplacedChart({ data }: { data: { bucket: string; placedPct: number; placedCount: number; unplacedCount: number }[] }) {
  const p = useChartPalette();
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} />
        <XAxis dataKey="bucket" tick={{ fontSize: 11, fill: p.axis }} stroke={p.grid} />
        <YAxis yAxisId="left" tick={{ fontSize: 12, fill: p.axis }} stroke={p.grid} allowDecimals={false} label={{ value: "Students", angle: -90, position: "insideLeft", fontSize: 11, fill: p.axis }} />
        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: p.axis }} stroke={p.grid} unit="%" domain={[0, 100]} />
        <Tooltip content={<PlacedVsUnplacedTooltip palette={p} />} cursor={{ fill: p.cursor }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar yAxisId="left" dataKey="placedCount" fill={p.placed} name="Placed (cumulative)" radius={[3, 3, 0, 0]} />
        <Bar yAxisId="left" dataKey="unplacedCount" fill={p.unplaced} name="Unplaced (cumulative)" radius={[3, 3, 0, 0]} />
        <Line yAxisId="right" type="monotone" dataKey="placedPct" stroke={p.trend} strokeWidth={2.5} dot={{ r: 3, fill: p.dotFill }} name="Placed % trend" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function PlacementRateBarChart({ data, tone = "brand" }: { data: { label: string; placed: number; total: number; rate: number }[]; tone?: "brand" | "brandSoft" }) {
  const p = useChartPalette();
  const sorted = [...data].sort((a, b) => b.rate - a.rate);
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, sorted.length * 40)}>
      <BarChart data={sorted} layout="vertical" margin={{ left: 120 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: p.axis }} stroke={p.grid} unit="%" />
        <YAxis type="category" dataKey="label" width={160} tick={{ fontSize: 12, fill: p.axis }} stroke={p.grid} />
        <Tooltip formatter={(v: number, name: string, props: any) => [`${v}% (${props.payload.placed}/${props.payload.total})`, "Placement rate"]}
          contentStyle={tooltipBox(p)} labelStyle={{ color: p.tooltipText, fontWeight: 600 }} cursor={{ fill: p.cursor }} />
        <Bar dataKey="rate" fill={p[tone]} radius={[0, 4, 4, 0]} name="Placement rate" />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TopJobTitlesChart({ data }: { data: { title: string; count: number }[] }) {
  const p = useChartPalette();
  return (
    <ResponsiveContainer width="100%" height={Math.max(300, data.length * 36)}>
      <BarChart data={data} layout="vertical" margin={{ left: 140 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={p.grid} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: p.axis }} stroke={p.grid} />
        <YAxis type="category" dataKey="title" width={180} tick={{ fontSize: 11, fill: p.axis }} stroke={p.grid} />
        <Tooltip contentStyle={tooltipBox(p)} labelStyle={{ color: p.tooltipText, fontWeight: 600 }} cursor={{ fill: p.cursor }} />
        <Bar dataKey="count" fill={p.accent} radius={[0, 4, 4, 0]} name="Placements" />
      </BarChart>
    </ResponsiveContainer>
  );
}
