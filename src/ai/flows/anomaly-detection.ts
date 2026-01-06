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
  costData: z.string().describe('Données de coûts historiques au format CSV.'),
  description: z.string().describe('Description des données de coûts.'),
});

export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalyDetectionOutputSchema = z.object({
  anomalyReport: z.string().describe('Un rapport des anomalies détectées, avec des explications.'),
  decisionSupportMessage: z.string().describe('Un message pour aider les contrôleurs de coûts à prendre des décisions concernant les anomalies.'),
});

export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: {schema: AnomalyDetectionInputSchema},
  output: {schema: AnomalyDetectionOutputSchema},
  prompt: `Vous êtes un assistant IA spécialisé dans la détection d'anomalies financières au Maroc. La devise utilisée est le Dirham Marocain (DH).
  Votre tâche est d'analyser les données de coûts fournies et d'identifier toute fluctuation ou anomalie inhabituelle.
  Fournissez un rapport résumant les anomalies détectées, y compris les raisons potentielles et la gravité.

  Description des données : {{{description}}}
  Données de coûts : {{{costData}}}
  
  Formatez le rapport d'anomalie pour qu'il soit facilement compréhensible par un contrôleur de coûts.
  Incluez la liste des anomalies, avec une description, les raisons potentielles et la gravité.
  Assurez-vous que le rapport d'anomalie inclut la description et les informations sur les données de coûts.
  Terminez le rapport par un résumé des conclusions et des recommandations.

  Sur la base du rapport d'anomalie, fournissez un message concis d'aide à la décision pour aider les contrôleurs de coûts à prendre des décisions éclairées concernant les anomalies. Suggérez des actions ou des enquêtes potentielles basées sur les anomalies détectées.
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
