// anomaly-detection.ts
'use server';
/**
 * @fileOverview This file defines a Genkit flow for anomaly detection in cost data.
 *
 * The flow takes historical cost data as input and uses AI to identify unusual fluctuations.
 * It returns a report of detected anomalies with explanations.
 *
 * @interface AnomalyDetectionInput - Input schema for the anomaly detection flow.
 * @interface AnomalyDetectionOutput - Output schema for the anomaly detection flow, containing the anomaly report.
 * @function detectAnomalies - The main function to trigger the anomaly detection flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnomalyDetectionInputSchema = z.object({
  costData: z.string().describe('Historical cost data in CSV format.'),
  description: z.string().describe('Description of the cost data.'),
});

export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyDetectionOutputSchema = z.object({
  anomalyReport: z.string().describe('A report of detected anomalies, with explanations.'),
  decisionSupportMessage: z.string().describe('A message to help cost controllers make decisions about the anomalies.'),
});

export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `You are an AI assistant specialized in financial anomaly detection.
  Your task is to analyze the provided cost data and identify any unusual fluctuations or anomalies.
  Provide a report summarizing the detected anomalies, including potential reasons and severity.

  Description of the data: {{{description}}}
  Cost Data: {{{costData}}}
  
  Format the anomaly report to be easily understandable by a cost controller. 
  Include the list of anomalies, with a description, potential reasons, and the severity.
  Make sure that the anomaly report includes the description and cost data information.
  End the report with a summary of the findings and recommendations.

  Based on the anomaly report, provide a concise decision support message to help cost controllers make informed decisions about the anomalies. Suggest potential actions or investigations based on the detected anomalies.
  `,
});

const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async input => {
    const {output} = await anomalyDetectionPrompt(input);
    return output!;
  }
);
