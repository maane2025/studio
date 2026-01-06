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
                title: "Aucune Donnée",
                description: "Impossible d'exécuter la détection d'anomalies sans données historiques. Veuillez télécharger un fichier sur le Tableau de Bord.",
            });
            return;
        }
        setIsLoadingAnomaly(true);
        const result = await runAnomalyDetection(historicalCosts);
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Échec de l'Analyse",
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
                    <CardTitle>Détection d'Anomalies</CardTitle>
                    <CardDescription>Identifiez les fluctuations inhabituelles dans vos données de coûts à l'aide de l'IA.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-10">
                    <ShieldAlert className="w-16 h-16 text-primary" />
                    <p className="max-w-md text-muted-foreground">
                        Notre IA analysera les données de coûts historiques pour trouver toute déviation significative, valeur aberrante ou tendance inattendue qui pourrait nécessiter votre attention.
                    </p>

                    <Button onClick={handleAnomalyDetection} disabled={isLoadingAnomaly}>
                        {isLoadingAnomaly && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Lancer l'Analyse d'Anomalies
                    </Button>
                </CardContent>
            </Card>

            <AlertDialog open={isAnomalyAlertOpen} onOpenChange={setIsAnomalyAlertOpen}>
                <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rapport de Détection d'Anomalies</AlertDialogTitle>
                        <AlertDialogDescription>
                            Les anomalies suivantes ont été détectées dans les données de coûts.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="max-h-[60vh] overflow-y-auto pr-4">
                        <pre className="whitespace-pre-wrap text-sm text-foreground bg-muted p-4 rounded-md font-sans">
                            {anomalyReport}
                        </pre>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogAction>Fermer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
