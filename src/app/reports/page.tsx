"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useDataContext } from "@/lib/data-provider";
import { formatCurrency, formatNumber } from "@/lib/data";

export default function ReportsPage() {
    const { historicalCosts } = useDataContext();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Rapport des Coûts Historiques</CardTitle>
                <CardDescription>
                    Une vue détaillée de toutes les données de coûts historiques chargées dans le système.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {historicalCosts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Coût Total</TableHead>
                                <TableHead className="text-right">Coût Unitaire</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...historicalCosts].reverse().map((cost) => (
                                <TableRow key={cost.date}>
                                    <TableCell>{new Date(cost.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(cost.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(cost.unitCost)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(cost.volume)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10">
                        <p>Aucune donnée disponible. Veuillez importer des données sur la page Tableau de bord.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
