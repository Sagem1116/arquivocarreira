import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { useArchive } from "@/lib/store";
import { PageHeader, EmptyState } from "@/components/PageHeader";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/stats")({
  component: Stats,
  head: () => ({ meta: [{ title: "Estatísticas — FM Career Archive" }] }),
});

function Stats() {
  const data = useArchive((s) => s.data);
  const { seasons, trophies, clubs } = data;

  const trophiesByYear = useMemo(() => {
    const map = new Map<string, number>();
    trophies.forEach((t) => map.set(t.year, (map.get(t.year) || 0) + 1));
    return Array.from(map.entries()).sort().map(([year, total]) => ({ year, total }));
  }, [trophies]);

  const trophiesByClub = useMemo(() => {
    const map = new Map<string, number>();
    trophies.forEach((t) => map.set(t.clubId, (map.get(t.clubId) || 0) + 1));
    return Array.from(map.entries()).map(([id, total]) => ({
      name: clubs.find((c) => c.id === id)?.name || "—",
      color: clubs.find((c) => c.id === id)?.color || "#FF7A1A",
      total,
    }));
  }, [trophies, clubs]);

  const evolution = useMemo(() =>
    [...seasons].sort((a, b) => (a.year > b.year ? 1 : -1)).map((s) => ({
      year: s.year,
      vit: s.matches ? Math.round(((s.wins || 0) / s.matches) * 100) : 0,
      golos: s.goalsFor || 0,
      sofridos: s.goalsAgainst || 0,
    })), [seasons]);

  const totalsPie = useMemo(() => {
    const w = seasons.reduce((a, s) => a + (s.wins || 0), 0);
    const d = seasons.reduce((a, s) => a + (s.draws || 0), 0);
    const l = seasons.reduce((a, s) => a + (s.losses || 0), 0);
    return [
      { name: "Vitórias", value: w, color: "var(--primary)" },
      { name: "Empates", value: d, color: "#888" },
      { name: "Derrotas", value: l, color: "#a13b1f" },
    ];
  }, [seasons]);

  if (seasons.length === 0) {
    return (
      <div className="max-w-5xl mx-auto">
        <PageHeader title="Estatísticas" icon={<BarChart3 className="h-5 w-5" />} />
        <EmptyState icon={<BarChart3 className="h-6 w-6" />} title="Sem dados"
          description="Adiciona temporadas para veres gráficos." />
      </div>
    );
  }

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader title="Estatísticas" subtitle="Visão analítica da carreira"
        icon={<BarChart3 className="h-5 w-5" />} />

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title="Troféus por época">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trophiesByYear}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle as any} />
              <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Troféus por clube">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={trophiesByClub} layout="vertical">
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
              <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={11} width={100} />
              <Tooltip contentStyle={tooltipStyle as any} />
              <Bar dataKey="total" radius={[0, 6, 6, 0]}>
                {trophiesByClub.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Evolução % vitórias">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={evolution}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={tooltipStyle as any} />
              <Line type="monotone" dataKey="vit" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Resultados totais">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={totalsPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90}>
                {totalsPie.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Legend />
              <Tooltip contentStyle={tooltipStyle as any} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Golos marcados vs sofridos" wide>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={evolution}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="year" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle as any} />
              <Legend />
              <Bar dataKey="golos" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Marcados" />
              <Bar dataKey="sofridos" fill="#a13b1f" radius={[4, 4, 0, 0]} name="Sofridos" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={`card-elevated rounded-2xl p-5 ${wide ? "lg:col-span-2" : ""}`}>
      <h3 className="font-semibold mb-4 text-sm uppercase tracking-widest text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}
