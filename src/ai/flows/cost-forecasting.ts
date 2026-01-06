// CostForecasting Story: As a finance manager, I want the system to forecast future costs using AI algorithms based on historical data, so I can anticipate potential budget overruns and make informed decisions.

'use server';
/**
 * @fileOverview A cost forecasting AI agent.
 *
 * - forecastCosts - A function that handles the cost forecasting process.
 * - CostForecastingInput - The input type for the forecastCosts function.
 * - CostForecastingOutput - The return type for the forecastCosts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CostForecastingInputSchema = z.object({
  costData: z
    .string()
    .describe(
      'Historical cost data in CSV format, including dates, cost types, and amounts.'
    ),
  forecastingHorizon: z
    .string()
    .describe('The period for forecasting costs in months, e.g., 6 months, 12 months.'),
});
export type CostForecastingInput = z.infer<typeof CostForecastingInputSchema>;

const CostForecastingOutputSchema = z.object({
  forecastedCosts: z
    .string()
    .describe(
      `Forecasted costs in CSV format with date and forecasted amount columns.\nEnsure the output is parsable as CSV by enclosing all values in double quotes and escaping inner double quotes.`
    ),
  analysisSummary: z
    .string()
    .describe(
      'A summary of the cost forecasting analysis, including key trends, potential budget overruns, and recommendations.'
    ),
  overrunWarning: z.string().describe('A warning message if a budget overrun is detected.'),
});
export type CostForecastingOutput = z.infer<typeof CostForecastingOutputSchema>;

export async function forecastCosts(input: CostForecastingInput): Promise<CostForecastingOutput> {
  return costForecastingFlow(input);
}

const costForecastingPrompt = ai.definePrompt({
  name: 'costForecastingPrompt',
  input: {schema: CostForecastingInputSchema},
  output: {schema: CostForecastingOutputSchema},
  prompt: `You are a financial analyst expert in cost forecasting.

  Analyze the provided historical cost data to forecast future costs and identify potential budget overruns.
  Provide the forecasted costs in CSV format and a summary of your analysis, including key trends, and recommendations.

  Input Cost Data (CSV):
  {{costData}}

  Forecasting Horizon: {{forecastingHorizon}}

  Output Format Instructions:
  - Ensure that the forecastedCosts CSV data is properly formatted and enclosed in double quotes. All inner double quotes MUST be escaped with another double quote.
  - Ensure all values are enclosed in double quotes. 
  - Ensure the date column is named \"Date\" and the forecasted cost column is named \"Forecasted Cost\".
  - Include an analysis summary highlighting key trends, potential budget overruns, and actionable recommendations for cost management.
  - Provide an overrunWarning message if a budget overrun is detected based on the forecast.

  Example Output:
  \`\`\`json
  {
    \"forecastedCosts\": \"\"Date\",\"Forecasted Cost\"\n\"2024-07-01\",\"120000\"\n\"2024-08-01\",\"125000\"\"\,
    \"analysisSummary\": \"The cost forecasting analysis indicates a rising trend in costs over the next few months. Key drivers include increased raw material prices and higher labor costs. To mitigate potential budget overruns, it is recommended to implement cost-saving measures, such as renegotiating supplier contracts and optimizing production processes.\",
    \"overrunWarning\": \"A budget overrun is detected for the month of August. Implement cost-saving measures to address the issue.\"}
  \`\`\`\``,
});

const costForecastingFlow = ai.defineFlow(
  {
    name: 'costForecastingFlow',
    inputSchema: CostForecastingInputSchema,
    outputSchema: CostForecastingOutputSchema,
  },
  async input => {
    const {output} = await costForecastingPrompt(input);
    return output!;
  }
);

