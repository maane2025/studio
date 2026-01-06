"use server";

import { forecastCosts } from "@/ai/flows/cost-forecasting";
import { detectAnomalies } from "@/ai/flows/anomaly-detection";
import type { Cost } from "@/lib/data";

function arrayToCsv(data: Cost[]): string {
  const header = "Date,Total Cost,Unit Cost,Volume";
  const rows = data.map(row => `${row.date},${row.totalCost},${row.unitCost},${row.volume}`);
  return [header, ...rows].join('\n');
}

function parseCsv(csv: string): any[] {
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const header = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        const obj: { [key: string]: string | number } = {};
        header.forEach((key, i) => {
            const value = values[i] ? values[i].replace(/"/g, '').trim() : '';
            obj[key] = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
        });
        return obj;
    });
}

export async function runForecast(historicalData: Cost[]) {
  try {
    const csvData = arrayToCsv(historicalData);
    const result = await forecastCosts({
      costData: csvData,
      forecastingHorizon: "6 months",
    });

    const forecast = parseCsv(result.forecastedCosts);

    return {
      forecast: forecast,
      summary: result.analysisSummary,
      warning: result.overrunWarning,
    };
  } catch (error) {
    console.error("Error in runForecast:", error);
    return { error: "Failed to generate forecast." };
  }
}

export async function runAnomalyDetection(historicalData: Cost[]) {
    try {
        const csvData = arrayToCsv(historicalData);
        const result = await detectAnomalies({
            costData: csvData,
            description: "Monthly organizational costs including total cost, unit cost, and production volume."
        });
        return { report: result.anomalyReport };
    } catch (error) {
        console.error("Error in runAnomalyDetection:", error);
        return { error: "Failed to run anomaly detection." };
    }
}
