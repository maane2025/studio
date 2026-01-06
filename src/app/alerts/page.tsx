"use client";

import { useState } from "react";
import { ShieldAlert, Loader2 } from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toaster";
import { useDataContext } from "@/lib/data-provider";
import { runAnomalyDetection } from "@/app/actions";

export default function AlertsPage() {
    const { historicalCosts } = useDataContext();
    const [anomalyReport, setAnomalyReport] = useState('');
    const [isAnomalyAlertOpen, setIsAnomalyAlertOpen] = useState(false);
    const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);

    const handleAnomalyDetection = async () => {
        if(historicalCosts.length === 0) {
            toast({
                variant: "destructive",
                title: "No Data",
                description: "Cannot run anomaly detection without historical data. Please upload a file on the Dashboard.",
            });
            return;
        }
        setIsLoadingAnomaly(true);
        const result = await runAnomalyDetection(historicalCosts);
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Analysis Failed",
                description: result.error,
            });
        } else if (result.report) {
            setAnomalyReport(result.report);
            setIsAnomalyAlertOpen(true);
        }
        setIsLoadingAnomaly(false);
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Anomaly Detection</CardTitle>
                    <CardDescription>Identify unusual fluctuations in your cost data using AI.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-10">
                    <ShieldAlert className="w-16 h-16 text-primary" />
                    <p className="max-w-md text-muted-foreground">
                        Our AI will analyze the historical cost data to find any significant deviations, outliers, or unexpected trends that might require your attention.
                    </p>

                    <Button onClick={handleAnomalyDetection} disabled={isLoadingAnomaly}>
                        {isLoadingAnomaly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Run Anomaly Analysis
                    </Button>
                </CardContent>
            </Card>

            <AlertDialog open={isAnomalyAlertOpen} onOpenChange={setIsAnomalyAlertOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anomaly Detection Report</AlertDialogTitle>
                        <AlertDialogDescription>
                            The following anomalies were detected in the cost data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                        <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted p-4 rounded-md font-sans">
                            {anomalyReport}
                        </pre>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
