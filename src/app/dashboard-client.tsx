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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Toaster, toast } from "@/components/ui/toaster"
import { historicalCosts as initialHistoricalCosts, formatCurrency, formatNumber } from '@/lib/data';
import type { Cost } from '@/lib/data';
import { runForecast, runAnomalyDetection } from './actions';

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
            vs last month
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
            const requiredHeaders = ['date', 'totalcost', 'unitcost', 'volume'];
            const header = Object.keys(data[0]).map(h => h.toLowerCase().replace(/\s/g, ''));
            const hasRequiredHeaders = requiredHeaders.every(h => header.includes(h));

            if (!hasRequiredHeaders) {
                toast({
                    variant: "destructive",
                    title: "Invalid Header",
                    description: `File must have columns: ${requiredHeaders.join(', ')}`,
                });
                return;
            }

            const mapHeader = (h: string) => h.toLowerCase().replace(/\s/g, '');

            const parsedData = data.map((row: any) => {
                const newRow: {[key: string]: any} = {};
                for (const key in row) {
                    newRow[mapHeader(key)] = row[key];
                }
                
                // Handle Excel's date serial number format
                let date = newRow.date;
                if (typeof date === 'number') {
                    date = new Date(Math.round((date - 25569) * 864e5)).toISOString().split('T')[0];
                } else {
                    date = new Date(date).toISOString().split('T')[0];
                }

                return {
                    date: date,
                    totalCost: parseFloat(newRow.totalcost),
                    unitCost: parseFloat(newRow.unitcost),
                    volume: parseInt(newRow.volume, 10),
                };
            }).filter(d => d.date && !isNaN(d.totalCost) && !isNaN(d.unitCost) && !isNaN(d.volume));

            if(parsedData.length === 0){
                throw new Error("No valid data rows found in the file.");
            }
            
            onDataUploaded(parsedData);
            toast({
                title: "Data Uploaded",
                description: `${parsedData.length} records have been successfully loaded.`,
            });
        } catch (error) {
            console.error("Data processing error:", error);
            const errorMessage = error instanceof Error ? error.message : "Could not process the file.";
            toast({
                variant: "destructive",
                title: "Processing Error",
                description: errorMessage,
            });
        }
    }

    const handleUpload = () => {
        if (!file) {
            toast({
                variant: "destructive",
                title: "No file selected",
                description: "Please select a CSV or Excel file to upload.",
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
                        title: "Parsing Error",
                        description: "Could not parse the CSV file. Please check its format.",
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
                        title: "Excel Parsing Error",
                        description: "Could not parse the Excel file.",
                    });
                }
            };
            reader.readAsArrayBuffer(file);
        } else {
             toast({
                variant: "destructive",
                title: "Unsupported File Type",
                description: "Please upload a .csv or .xlsx file.",
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Data Import</CardTitle>
                <CardDescription>Upload a CSV or Excel file with your cost data. The file must contain the columns: 'Date', 'TotalCost', 'UnitCost', and 'Volume'.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center text-center gap-4 p-10">
                 <Upload className="w-16 h-16 text-primary" />
                 <div className="flex w-full max-w-sm items-center gap-2">
                    <Input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleFileChange} />
                    <Button onClick={handleUpload} disabled={!file}>Upload</Button>
                </div>
                <p className="text-xs text-muted-foreground max-w-md">
                    Your existing data will be replaced by the data in the uploaded file. The app will then use this new dataset for all analyses and forecasts.
                </p>
            </CardContent>
        </Card>
    )
}

export default function DashboardClient() {
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
    }, []);

    const [historicalCosts, setHistoricalCosts] = useState<Cost[]>(initialHistoricalCosts);
    const [forecastData, setForecastData] = useState<ForecastData[]>([]);
    const [analysisSummary, setAnalysisSummary] = useState('');
    const [overrunWarning, setOverrunWarning] = useState('');
    const [anomalyReport, setAnomalyReport] = useState('');
    const [isAnomalyAlertOpen, setIsAnomalyAlertOpen] = useState(false);

    const [isLoadingForecast, setIsLoadingForecast] = useState(false);
    const [isLoadingAnomaly, setIsLoadingAnomaly] = useState(false);

    const metrics = useMemo(() => {
        if (historicalCosts.length === 0) {
            return {
                totalCost: 0, costChange: '0.0%', costChangeType: 'increase',
                avgUnitCost: 0, unitCostChange: '0.0%', unitCostChangeType: 'increase',
                productionVolume: 0, volumeChange: '0.0%', volumeChangeType: 'increase',
                nextMonthForecast: 0, totalForecastCost: 0,
            };
        }

        const currentMonth = historicalCosts[historicalCosts.length - 1];
        if (historicalCosts.length < 2) {
             return {
                totalCost: currentMonth.totalCost,
                costChange: '0.0%',
                costChangeType: 'increase',
                avgUnitCost: currentMonth.unitCost,
                unitCostChange: '0.0%',
                unitCostChangeType: 'increase',
                productionVolume: currentMonth.volume,
                volumeChange: '0.0%',
                volumeChangeType: 'increase',
                nextMonthForecast: 0,
                totalForecastCost: 0,
            };
        }
        const prevMonth = historicalCosts[historicalCosts.length - 2];
        
        const costChangeNum = (((currentMonth.totalCost - prevMonth.totalCost) / prevMonth.totalCost) * 100);
        const volumeChangeNum = (((currentMonth.volume - prevMonth.volume) / prevMonth.volume) * 100);
        const unitCostChangeNum = (((currentMonth.unitCost - prevMonth.unitCost) / prevMonth.unitCost) * 100);

        const lastForecastCost = forecastData.length > 0 ? forecastData[0]['Forecasted Cost'] : 0;
        const totalForecastCost = forecastData.reduce((acc, item) => acc + item['Forecasted Cost'], 0);
        
        return {
            totalCost: currentMonth.totalCost,
            costChange: `${Math.abs(costChangeNum).toFixed(1)}%`,
            costChangeType: costChangeNum >= 0 ? 'increase' : 'decrease',
            
            avgUnitCost: currentMonth.unitCost,
            unitCostChange: `${Math.abs(unitCostChangeNum).toFixed(1)}%`,
            unitCostChangeType: unitCostChangeNum >= 0 ? 'increase' : 'decrease',

            productionVolume: currentMonth.volume,
            volumeChange: `${Math.abs(volumeChangeNum).toFixed(1)}%`,
            volumeChangeType: volumeChangeNum >= 0 ? 'increase' : 'decrease',
            
            nextMonthForecast: lastForecastCost,
            totalForecastCost: totalForecastCost,
        };
    }, [historicalCosts, forecastData]);

    const chartData = useMemo(() => {
        const historical = historicalCosts.map(d => ({ date: d.date, 'Actual Cost': d.totalCost }));
        if (forecastData.length === 0) return historical;

        const forecast = forecastData.map(d => ({ date: d.Date, 'Forecasted Cost': d['Forecasted Cost'] }));
        
        const combined = [...historical];
        forecast.forEach(f => {
            const existing = combined.find(h => h.date === f.date);
            if (existing) {
                (existing as any)['Forecasted Cost'] = f['Forecasted Cost'];
            } else {
                combined.push(f);
            }
        });
        return combined.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [historicalCosts, forecastData]);

    const handleForecast = async () => {
        if(historicalCosts.length === 0) {
            toast({
                variant: "destructive",
                title: "No Data",
                description: "Cannot run forecast without historical data. Please upload a file.",
            });
            return;
        }
        setIsLoadingForecast(true);
        const result = await runForecast(historicalCosts);
        if (result.error) {
            toast({
                variant: "destructive",
                title: "Forecast Failed",
                description: result.error,
            });
        } else {
            setForecastData(result.forecast);
            setAnalysisSummary(result.summary);
            setOverrunWarning(result.warning);
            toast({
                title: "Forecast Generated",
                description: "Future cost predictions are now available.",
            });
        }
        setIsLoadingForecast(false);
    };

    const handleAnomalyDetection = async () => {
        if(historicalCosts.length === 0) {
            toast({
                variant: "destructive",
                title: "No Data",
                description: "Cannot run anomaly detection without historical data. Please upload a file.",
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
        } else {
            setAnomalyReport(result.report);
            setIsAnomalyAlertOpen(true);
        }
        setIsLoadingAnomaly(false);
    };
    
    const handleDataUploaded = (data: Cost[]) => {
        setHistoricalCosts(data);
        // Reset forecast and analysis when new data is uploaded
        setForecastData([]);
        setAnalysisSummary('');
        setOverrunWarning('');
        setAnomalyReport('');
    }

    if (!isClient) {
        return null;
    }

  return (
    <>
        <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="data-import">Data Import</TabsTrigger>
                <TabsTrigger value="anomaly-detection">Anomaly Detection</TabsTrigger>
                <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <KpiCard 
                        title="Total Cost (Current)" 
                        value={formatCurrency(metrics.totalCost)} 
                        icon={DollarSign}
                        footer={<ChangeFooter change={metrics.costChange} changeType={metrics.costChangeType} />}
                    />
                    <KpiCard 
                        title="Avg. Unit Cost" 
                        value={formatCurrency(metrics.avgUnitCost)} 
                        icon={Package}
                        footer={<ChangeFooter change={metrics.unitCostChange} changeType={metrics.unitCostChangeType} />}
                    />
                    <KpiCard 
                        title="Production Volume" 
                        value={formatNumber(metrics.productionVolume)}
                        icon={BarChart3} 
                        footer={<ChangeFooter change={metrics.volumeChange} changeType={metrics.volumeChangeType} isIncreaseGood={true} />}
                    />
                    <KpiCard 
                        title="Cost Forecast" 
                        value={metrics.nextMonthForecast > 0 ? formatCurrency(metrics.nextMonthForecast) : "N/A"}
                        icon={TrendingUp} 
                        footer={
                            <p className="text-xs text-muted-foreground">
                                {metrics.nextMonthForecast > 0 
                                    ? <>Next month / {formatCurrency(metrics.totalForecastCost)} total</>
                                    : "Run forecast to see"}
                            </p>
                        }
                    />
                </div>
                <div className="grid gap-4 mt-4 grid-cols-1 lg:grid-cols-7">
                    <Card className="lg:col-span-4">
                        <CardHeader className="flex flex-row items-center">
                            <div className="grid gap-2">
                                <CardTitle>Cost Analysis</CardTitle>
                                <CardDescription>
                                    Historical and forecasted costs over time.
                                </CardDescription>
                            </div>
                            <Button onClick={handleForecast} disabled={isLoadingForecast} size="sm" className="ml-auto gap-1">
                                {isLoadingForecast && <Loader2 className="h-4 w-4 animate-spin" />}
                                Forecast Costs
                            </Button>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <ResponsiveContainer width="100%" height={350}>
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })} />
                                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `$${Number(val)/1000}k`} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--background))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: 'var(--radius)',
                                        }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { month: 'long', year: 'numeric'})}
                                        formatter={(value) => formatCurrency(value as number)}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="Actual Cost" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    {forecastData.length > 0 && <Line type="monotone" dataKey="Forecasted Cost" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" />}
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                    <Card className="lg:col-span-3">
                        <CardHeader>
                            <CardTitle>Decision Support</CardTitle>
                            <CardDescription>
                                AI-powered insights and recommendations.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {historicalCosts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                                    <p>Please upload data to generate insights.</p>
                                </div>
                            ) : !analysisSummary && !overrunWarning ? (
                                <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-64">
                                    <p>Run a forecast to generate insights.</p>
                                </div>
                            ) : null}
                            {overrunWarning && (
                                <Alert variant="destructive">
                                    <ShieldAlert className="h-4 w-4" />
                                    <AlertTitle>Budget Overrun Warning!</AlertTitle>
                                    <AlertDescription>
                                        {overrunWarning}
                                    </AlertDescription>
                                </Alert>
                            )}
                            {analysisSummary && (
                                <Alert>
                                    <BarChart3 className="h-4 w-4" />
                                    <AlertTitle>Analysis Summary</AlertTitle>
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
            <TabsContent value="anomaly-detection">
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
            </TabsContent>
            <TabsContent value="raw-data">
               <Card>
                   <CardHeader>
                       <CardTitle>Historical Cost Data</CardTitle>
                       <CardDescription>The complete dataset used for analysis and forecasting.</CardDescription>
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
                                           <TableCell>{new Date(cost.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</TableCell>
                                           <TableCell className="text-right">{formatCurrency(cost.totalCost)}</TableCell>
                                           <TableCell className="text-right">{formatCurrency(cost.unitCost)}</TableCell>
                                           <TableCell className="text-right">{formatNumber(cost.volume)}</TableCell>
                                       </TableRow>
                                   ))}
                               </TableBody>
                           </Table>
                       ) : (
                           <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-10">
                                <p>No data loaded. Please upload a file in the "Data Import" tab.</p>
                           </div>
                       )}
                   </CardContent>
               </Card>
            </TabsContent>
        </Tabs>

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
