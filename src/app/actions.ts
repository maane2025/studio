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
    if (!csv || typeof csv !== 'string') {
        console.error("Invalid CSV input to parseCsv:", csv);
        return [];
    }
    const lines = csv.trim().split('\n');
    if (lines.length < 2) return [];

    const headerLine = lines.shift() as string;
    const header = headerLine.split(',').map(h => h.replace(/"/g, '').trim());
    
    return lines.map(line => {
        // More robust CSV parsing to handle quotes
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const obj: { [key: string]: string | number } = {};
        
        header.forEach((key, i) => {
            if (!key) return; // Skip empty header columns
            const rawValue = values[i] || '';
            const value = rawValue.replace(/^"|"$/g, '').replace(/""/g, '"').trim();
            obj[key] = !isNaN(Number(value)) && value !== '' ? Number(value) : value;
        });
        return obj;
    }).filter(obj => Object.keys(obj).length > 0);
}


export async function runForecast(historicalData: Cost[]) {
  try {
    const csvData = arrayToCsv(historicalData);
    const result = await forecastCosts({
      costData: csvData,
      forecastingHorizon: "6 months",
    });

    const forecast = parseCsv(result.forecastedCosts);

    // Add a check to ensure forecast is not empty
    if (!forecast || forecast.length === 0) {
      console.error("CSV parsing resulted in empty forecast data.", { rawCsv: result.forecastedCosts });
      return { error: "Failed to parse forecast data from AI response." };
    }

    return {
      forecast: forecast,
      summary: result.analysisSummary,
      warning: result.overrunWarning,
    };
  } catch (error) {
    console.error("Error in runForecast:", error);
    let errorMessage = "Failed to generate forecast.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { error: errorMessage };
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
        let errorMessage = "Failed to run anomaly detection.";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        return { error: errorMessage };
    }
}
