"use client";
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  DollarSign,
  Loader2,
  Package,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Upload,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from "@/components/ui/toaster"
import { useDataContext } from '@/lib/data-provider';
import { formatCurrency, formatNumber } from '@/lib/data';
import type { Cost } from '@/lib/data';
import { runForecast } from './actions';

type ForecastData = {
  Date: string;
  'Forecasted Cost': number;
};
  
const KpiCard = ({ title, value, footer, icon: Icon }: { title: string; value: string; footer?: React.ReactNode; icon: React.ElementType }) => {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {footer}
            </CardContent>
        </Card>
    );
};

const ChangeFooter = ({ change, changeType, isIncreaseGood = false }: { change: string; changeType: 'increase' | 'decrease', isIncreaseGood?: boolean }) => {
    const isBadChange = (changeType === 'increase') !== isIncreaseGood;
    const colorClass = isBadChange ? 'text-destructive' : 'text-green-600 dark:text-green-500';

    return (
        <p className="text-xs text-muted-foreground flex items-center">
            <span className={`mr-1 flex items-center gap-1 ${colorClass}`}>
                {changeType === 'increase' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {change}
            </span>
            vs le mois dernier
        </p>
    );
};

function CsvUploader({ onDataUploaded }: { onDataUploaded: (data: Cost[]) => void }) {
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const processData = (data: any[]) => {
         try {
            if (data.length === 0) {
                 toast({
                    variant: "destructive",
                    title: "Fichier Vide",
                    description: "Le fichier téléchargé est vide ou n'a pas pu être lu.",
                });
                return;
            }
            const headerMap: {[key: string]: string[]} = {
                date: ['date', 'jour', 'temps', 'mois'],
                totalcost: ['totalcost', 'couttotal', 'coutstotaux', 'montant'],
                unitcost: ['unitcost', 'coutunitaire', 'prixunitaire', 'coutvariableunitaire'],
                volume: ['volume', 'quantite', 'production', 'volumeproduction']
            };

            const frenchMonths: {[key: string]: number} = {
                'janvier': 0, 'fevrier': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
                'juillet': 6, 'aout': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'decembre': 11
            };

            const actualHeaders = Object.keys(data[0]).map(h => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '').replace(/_/g, ''));
            
            const missingHeaders: string[] = [];
            const mappedHeaderKeys: {[key: string]: string} = {};

            for (const [required, variants] of Object.entries(headerMap)) {
                const foundHeader = Object.keys(data[0]).find(h => {
                    const normalized = h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s/g, '').replace(/_/g, '');
                    return variants.includes(normalized);
                });

                if (foundHeader) {
                    mappedHeaderKeys[required] = foundHeader;
                } else {
                    missingHeaders.push(required);
                }
            }

            if (missingHeaders.length > 0) {
                toast({
                    variant: "destructive",
                    title: "En-tête Invalide",
                    description: `Le fichier doit contenir des colonnes pour : ${Object.keys(headerMap).join(', ')}. Colonnes manquantes : ${missingHeaders.join(', ')}`,
                });
                return;
            }

            const parsedData = data.map((row: any) => {
                const getVal = (key: string) => row[mappedHeaderKeys[key]];
                
                // Handle Excel's date serial number format or French month names
                let dateValue = getVal('date');
                let date: any = "";
                
                if (typeof dateValue === 'number') {
                    date = new Date(Math.round((dateValue - 25569) * 864e5)).toISOString().split('T')[0];
                } else if (typeof dateValue === 'string') {
                    const normalizedMonth = dateValue.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
                    if (frenchMonths[normalizedMonth] !== undefined) {
                        const d = new Date();
                        d.setMonth(frenchMonths[normalizedMonth]);
                        d.setDate(1);
                        date = d.toISOString().split('T')[0];
                    } else {
                        const parsedDate = new Date(dateValue);
                        if (!isNaN(parsedDate.getTime())) {
                            date = parsedDate.toISOString().split('T')[0];
                        } else {
                            date = null;
                        }
                    }
                } else {
                     date = new Date(dateValue).toISOString().split('T')[0];
                }

                return {
                    date: date,
                    totalCost: parseFloat(getVal('totalcost')),
                    unitCost: parseFloat(getVal('unitcost')),
                    volume: parseInt(getVal('volume'), 10),
                };
            }).filter(d => d.date && !isNaN(d.totalCost) && !isNaN(d.unitCost) && !isNaN(d.volume));

            if(parsedData.length === 0){
                throw new Error("Aucune ligne de données valide trouvée dans le fichier. Vérifiez les formats de données et les en-têtes.");
            }
            
            onDataUploaded(parsedData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            toast({
                title: "Données Téléchargées",
                description: `${parsedData.length} enregistrements ont été chargés avec succès.`,
            });
        } catch (error) {
            console.error("Data processing error:", error);
            const errorMessage = error instanceof Error ? error.message : "Impossible de traiter le fichier.";
            toast({
                variant: "destructive",
                title: "Erreur de Traitement",
                description: errorMessage,
            });
        }
    }

    const handleUpload = () => {
        if (!file) {
            toast({
                variant: "destructive",
                title: "Aucun fichier sélectionné",
                description: "Veuillez sélectionner un fichier CSV ou Excel à télécharger.",
            });
            return;
        }

        const reader = new FileReader();

        if (file.name.endsWith('.csv')) {
            reader.onload = (e) => {
                const text = e.target?.result as string;
                try {
                    const lines = text.trim().split('\n');
                    const headerLine = lines.shift() as string;
                    const header = headerLine.split(',').map(h => h.trim());
                    const csvData = lines.map(line => {
                        const values = line.split(',');
                        const row: {[key: string]: string} = {};
                        header.forEach((h, i) => {
                           row[h] = values[i];
                        });
                        return row;
                    });
                    processData(csvData);
                } catch(error) {
                     toast({
                        variant: "destructive",
                        title: "Erreur d'Analyse",
                        description: "Impossible d'analyser le fichier CSV. Veuillez vérifier son format.",
                    });
                }
            };
            reader.readAsText(file);
        } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    processData(jsonData);
                } catch (error) {
                     toast({
                        variant: "destructive",
                        title: "Erreur d'Analyse Excel",
                        description: "Impossible d'analyser le fichier Excel.",
                    });
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
             toast({
                variant: "destructive",
                title: "Type de Fichier non Supporté",
                description: "Veuillez télécharger un fichier .csv ou .xlsx.",
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Importation de Données</CardTitle>
                <CardDescription>Téléchargez un fichier CSV ou Excel avec vos données de coûts. Le fichier doit contenir les colonnes : 'Date', 'TotalCost', 'UnitCost', et 'Volume'.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-10">
                 <Upload className="w-16 h-16 text-primary" />
                 <div className="flex w-full max-w-sm items-center gap-2">
                    <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                    <Button onClick={handleUpload} disabled={!file}>Télécharger</Button>
                </div>
                <p className="text-xs text-muted-foreground max-w-md">
                    Vos données existantes seront remplacées par les données du fichier téléchargé. L'application utilisera alors ce nouvel ensemble de données pour toutes les analyses et prévisions.
                </p>
            </CardContent>
        </Card>
    )
}

export default function DashboardClient() {
    const { historicalCosts, setHistoricalCosts } = useDataContext();

    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const [forecastData, setForecastData] = useState<ForecastData[]>([]);
    const [analysisSummary, setAnalysisSummary] = useState('');
    const [overrunWarning, setOverrunWarning] = useState('');
    
    const [isLoadingForecast, setIsLoadingForecast] = useState(false);
    
    const metrics = useMemo(() => {
        if (historicalCosts.length === 0) {
            return {
                totalCost: 0, costChange: '0.0%', costChangeType: 'increase' as const,
                avgUnitCost: 0, unitCostChange: '0.0%', unitCostChangeType: 'increase' as const,
                productionVolume: 0, volumeChange: '0.0%', volumeChangeType: 'increase' as const,
                nextMonthForecast: 0, totalForecastCost: 0,
            };
        }

        const currentMonth = historicalCosts[historicalCosts.length - 1];
        if (historicalCosts.length < 2) {
             return {
                totalCost: currentMonth.totalCost,
                costChange: '0.0%',
                costChangeType: 'increase' as const,
                avgUnitCost: currentMonth.unitCost,
                unitCostChange: '0.0%',
                unitCostChangeType: 'increase' as const,
                productionVolume: currentMonth.volume,
                volumeChange: '0.0%',
                volumeChangeType: 'increase' as const,
                nextMonthForecast: 0,
                totalForecastCost: 0,
            };
        }
        const prevMonth = historicalCosts[historicalCosts.length - 2];
        
        const costChangeNum = (((currentMonth.totalCost - prevMonth.totalCost) / prevMonth.totalCost) * 100);
        const volumeChangeNum = (((currentMonth.volume - prevMonth.volume) / prevMonth.volume) * 100);
        const unitCostChangeNum = (((currentMonth.unitCost - prevMonth.unitCost) / prevMonth.unitCost) * 100);

        const costChangeType: 'increase' | 'decrease' = costChangeNum >= 0 ? 'increase' : 'decrease';
        const volumeChangeType: 'increase' | 'decrease' = volumeChangeNum >= 0 ? 'increase' : 'decrease';
        const unitCostChangeType: 'increase' | 'decrease' = unitCostChangeNum >= 0 ? 'increase' : 'decrease';
        
        const lastForecastCost = forecastData.length > 0 ? forecastData[0]['Forecasted Cost'] : 0;
        const totalForecastCost = forecastData.reduce((acc, item) => acc + item['Forecasted Cost'], 0);
        
        return {
            totalCost: currentMonth.totalCost,
            costChange: `${Math.abs(costChangeNum).toFixed(1)}%`,
            costChangeType,
            
            avgUnitCost: currentMonth.unitCost,
            unitCostChange: `${Math.abs(unitCostChangeNum).toFixed(1)}%`,
            unitCostChangeType,

            productionVolume: currentMonth.volume,
            volumeChange: `${Math.abs(volumeChangeNum).toFixed(1)}%`,
            volumeChangeType,
            
            nextMonthForecast: lastForecastCost,
            totalForecastCost: totalForecastCost,
        };
    }, [historicalCosts, forecastData]);

    const chartData = useMemo(() => {
        const historical: any[] = historicalCosts.map(d => ({ date: d.date, 'Coût Actuel': d.totalCost }));
        if (forecastData.length === 0) return historical;

        const forecast = forecastData.map(d => ({ date: d.Date, 'Coût Prévu': d['Forecasted Cost'] }));
        
        const combined = [...historical];
        forecast.forEach(f => {
            const existing = combined.find(h => h.date === f.date);
            if (existing) {
                existing['Coût Prévu'] = f['Coût Prévu'];
            } else {
                combined.push(f as any);
            }
        });
        return combined.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [historicalCosts, forecastData]);

    const handleForecast = async () => {
        if(historicalCosts.length === 0) {
            toast({
                variant: "destructive",
                title: "Aucune Donnée",
                description: "Impossible d'exécuter la prévision sans données historiques. Veuillez télécharger un fichier.",
            });
            return;
        }
        setIsLoadingForecast(true);
        const result = await runForecast(historicalCosts);
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Échec de la Prévision",
                description: result.error,
            });
        } else if (result.forecast) {
            setForecastData(result.forecast);
            setAnalysisSummary(result.summary || '');
            setOverrunWarning(result.warning || '');
            toast({
                title: "Prévision Générée",
                description: "Les prévisions de coûts futurs sont maintenant disponibles.",
            });
        }
        setIsLoadingForecast(false);
    };
    
    const handleDataUploaded = (data: Cost[]) => {
        setHistoricalCosts(data);
        // Reset forecast and analysis when new data is uploaded
        setForecastData([]);
        setAnalysisSummary('');
        setOverrunWarning('');
    }

    if (!isClient) {
        return null;
    }

  return (
    <>
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="data-import">Importation de Données</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard 
                        title="Coût Total (Actuel)" 
                        value={formatCurrency(metrics.totalCost)} 
                        icon={DollarSign}
                        footer={<ChangeFooter change={metrics.costChange} changeType={metrics.costChangeType} />}
                    />
                    <KpiCard 
                        title="Coût Unitaire Moyen" 
                        value={formatCurrency(metrics.avgUnitCost)} 
                        icon={Package}
                        footer={<ChangeFooter change={metrics.unitCostChange} changeType={metrics.unitCostChangeType} />}
                    />
                    <KpiCard 
                        title="Volume de Production" 
                        value={formatNumber(metrics.productionVolume)}
                        icon={BarChart3} 
                        footer={<ChangeFooter change={metrics.volumeChange} changeType={metrics.volumeChangeType} isIncreaseGood={true} />}
                    />
                    <KpiCard 
                        title="Prévision de Coût" 
                        value={metrics.nextMonthForecast > 0 ? formatCurrency(metrics.nextMonthForecast) : "N/A"}
                        icon={TrendingUp} 
                        footer={
                            <p className="text-xs text-muted-foreground">
                                {metrics.nextMonthForecast > 0 
                                    ? <>Prochain mois / {formatCurrency(metrics.totalForecastCost)} total</>
                                    : "Lancer la prévision pour voir"}
                            </p>
                        }
                    />
                </div>
                <div className="grid gap-4 mt-4 grid-cols-1 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Analyse des Coûts</CardTitle>
                                <CardDescription>
                                    Coûts historiques et prévus au fil du temps.
                                </CardDescription>
                            </div>
                            <Button onClick={handleForecast} disabled={isLoadingForecast} size="sm" className="ml-auto gap-1">
                                {isLoadingForecast && <Loader2 className="h-4 w-4 animate-spin" />}
                                Prévoir les Coûts
                            </Button>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(str) => new Date(str).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `${Number(val)/1000}k DH`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)',
                                        }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric'})}
                                        formatter={(value) => formatCurrency(value as number)}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="Coût Actuel" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    {forecastData.length > 0 && <Line type="monotone" dataKey="Coût Prévu" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" />}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Aide à la Décision</CardTitle>
                            <CardDescription>
                                Informations et recommandations basées sur l'IA.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {historicalCosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                                    <p>Veuillez télécharger des données pour générer des informations.</p>
                                </div>
                            ) : !analysisSummary && !overrunWarning ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                                    <p>Lancez une prévision pour générer des informations.</p>
                                </div>
                            ) : null}
                            {overrunWarning && (
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>Alerte de Dépassement de Budget !</AlertTitle>
                                    <AlertDescription>
                                        {overrunWarning}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {analysisSummary && (
                                <Alert>
                                    <BarChart3 className="h-4 w-4" />
                                    <AlertTitle>Résumé de l'Analyse</AlertTitle>
                                    <AlertDescription>
                                        {analysisSummary}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </TabsContent>
            <TabsContent value="data-import">
                <CsvUploader onDataUploaded={handleDataUploaded} />
            </TabsContent>
        </Tabs>
    </>
  );
}
