"use client";

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useDataContext } from '@/lib/data-provider';
import { formatCurrency, formatNumber } from '@/lib/data';
import type { Cost } from '@/lib/data';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function AnalyticsPage() {
    const { historicalCosts } = useDataContext();

    const analyticsData = useMemo(() => {
        if (historicalCosts.length === 0) {
            return {
                costComposition: [],
                costVsVolume: [],
                monthlyTrends: [],
                unitCostDistribution: [],
            };
        }

        // 1. Cost Composition (estimated for the last month)
        const lastMonth = historicalCosts[historicalCosts.length - 1];
        // Estimation based on initial data generation logic for demo purposes
        const estimatedFixedCost = 50000 + (Math.random() - 0.5) * 2000;
        const estimatedVariableCost = lastMonth.totalCost - estimatedFixedCost;
        const costComposition = [
            { name: 'Coûts Fixes', value: estimatedFixedCost },
            { name: 'Coûts Variables', value: estimatedVariableCost },
        ];

        // 2. Cost vs Volume
        const costVsVolume = historicalCosts.map(d => ({ volume: d.volume, cost: d.totalCost }));
        
        // 3. Monthly trends (last 12 months)
        const monthlyTrends = historicalCosts.slice(-12).map(d => ({
            name: new Date(d.date).toLocaleDateString('fr-FR', { month: 'short' }),
            'Coût Total': d.totalCost
        }));

        // 4. Unit Cost Distribution
        const unitCosts = historicalCosts.map(d => d.unitCost);
        const minUnitCost = Math.min(...unitCosts);
        const maxUnitCost = Math.max(...unitCosts);
        const range = maxUnitCost - minUnitCost;
        const binCount = 5;
        const binSize = range / binCount;
        
        const bins = Array.from({ length: binCount }, (_, i) => ({
            name: `${formatCurrency(minUnitCost + i * binSize)} - ${formatCurrency(minUnitCost + (i + 1) * binSize)}`,
            count: 0,
        }));

        unitCosts.forEach(cost => {
            let binIndex = Math.floor((cost - minUnitCost) / binSize);
            if (binIndex >= binCount) binIndex = binCount - 1;
            bins[binIndex].count++;
        });

        return {
            costComposition,
            costVsVolume,
            monthlyTrends,
            unitCostDistribution: bins,
        };

    }, [historicalCosts]);

    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
        const RADIAN = Math.PI / 180;
        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };


    if (historicalCosts.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle>Analytique</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Aucune donnée disponible. Veuillez importer des données sur la page Tableau de bord.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Composition des Coûts</CardTitle>
                    <CardDescription>Répartition estimée des coûts fixes et variables pour le dernier mois.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analyticsData.costComposition}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={120}
                                fill="hsl(var(--primary))"
                                dataKey="value"
                            >
                                {analyticsData.costComposition.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Coût vs. Volume de Production</CardTitle>
                    <CardDescription>Relation entre le volume de production et le coût total.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid />
                            <XAxis type="number" dataKey="volume" name="Volume" unit=" unités" tickFormatter={(val) => formatNumber(val)} />
                            <YAxis type="number" dataKey="cost" name="Coût" unit=" DH" tickFormatter={(val) => `${Number(val)/1000}k DH`}/>
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => name === 'Coût' ? formatCurrency(value as number) : formatNumber(value as number)} />
                            <Scatter name="Données de coût" data={analyticsData.costVsVolume} fill="hsl(var(--primary))" />
                        </ScatterChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Tendance Mensuelle des Coûts</CardTitle>
                    <CardDescription>Coût total au cours des 12 derniers mois.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.monthlyTrends}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => `${Number(val)/1000}k DH`}/>
                            <Tooltip formatter={(value) => formatCurrency(value as number)} />
                            <Legend />
                            <Bar dataKey="Coût Total" fill="hsl(var(--accent))" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Distribution du Coût Unitaire</CardTitle>
                    <CardDescription>Fréquence des différentes fourchettes de coûts unitaires.</CardDescription>
                </CardHeader>
                <CardContent>
                     <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analyticsData.unitCostDistribution}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Legend verticalAlign="top" payload={[{ value: 'Nombre d\'occurrences', type: 'line', color: 'hsl(var(--primary))' }]} />
                            <Bar dataKey="count" fill="hsl(var(--primary))" name="Occurrences" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
}
