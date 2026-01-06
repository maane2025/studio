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
                <CardTitle>Historical Cost Report</CardTitle>
                <CardDescription>
                    A detailed view of all historical cost data loaded into the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {historicalCosts.length > 0 ? (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total Cost</TableHead>
                                <TableHead className="text-right">Unit Cost</TableHead>
                                <TableHead className="text-right">Volume</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...historicalCosts].reverse().map((cost) => (
                                <TableRow key={cost.date}>
                                    <TableCell>{new Date(cost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(cost.totalCost)}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(cost.unitCost)}</TableCell>
                                    <TableCell className="text-right">{formatNumber(cost.volume)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10">
                        <p>No data available. Please import data on the Dashboard page.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
