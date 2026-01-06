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
      'Données de coûts historiques au format CSV, incluant les dates, les types de coûts et les montants.'
    ),
  forecastingHorizon: z
    .string()
    .describe('La période de prévision des coûts en mois, ex: 6 mois, 12 mois.'),
});
export type CostForecastingInput = z.infer<typeof CostForecastingInputSchema>;

const CostForecastingOutputSchema = z.object({
  forecastedCosts: z
    .string()
    .describe(
      `Coûts prévus au format CSV avec les colonnes "Date" et "Forecasted Cost".\nAssurez-vous que la sortie est analysable en tant que CSV en entourant toutes les valeurs de guillemets doubles et en échappant les guillemets doubles internes avec un autre guillemet double.`
    ),
  analysisSummary: z
    .string()
    .describe(
      'Un résumé de l\'analyse des prévisions de coûts, incluant les tendances clés, les dépassements de budget potentiels et les recommandations.'
    ),
  overrunWarning: z.string().describe('Un message d\'avertissement si un dépassement de budget est détecté.'),
});
export type CostForecastingOutput = z.infer<typeof CostForecastingOutputSchema>;

export async function forecastCosts(input: CostForecastingInput): Promise<CostForecastingOutput> {
  return costForecastingFlow(input);
}

const costForecastingPrompt = ai.definePrompt({
  name: 'costForecastingPrompt',
  input: {schema: CostForecastingInputSchema},
  output: {schema: CostForecastingOutputSchema},
  prompt: `Vous êtes un analyste financier expert en prévision de coûts au Maroc. La devise utilisée est le Dirham Marocain (DH).

  Analysez les données de coûts historiques fournies pour prévoir les coûts futurs et identifier les dépassements budgétaires potentiels.
  Fournissez les coûts prévus au format CSV et un résumé de votre analyse, y compris les tendances clés et les recommandations.

  Données de coûts d'entrée (CSV) :
  {{costData}}

  Horizon de prévision : {{forecastingHorizon}}

  Instructions de format de sortie :
  - La sortie forecastedCosts DOIT être une chaîne CSV valide.
  - Le CSV DOIT avoir deux colonnes : "Date" et "Forecasted Cost".
  - Chaque valeur dans le CSV, y compris les en-têtes, DOIT être entourée de guillemets doubles.
  - Tout guillemet double à l'intérieur d'une valeur DOIT être échappé par un autre guillemet double.
  
  - Incluez un résumé d'analyse mettant en évidence les tendances clés, les dépassements budgétaires potentiels et des recommandations concrètes pour la gestion des coûts.
  - Fournissez un message overrunWarning si un dépassement de budget est détecté sur la base de la prévision.

  Exemple de sortie :
  \`\`\`json
  {
    "forecastedCosts": "\\"Date\\",\\"Forecasted Cost\\"\\n\\"2024-07-01\\",\\"120000\\"\\n\\"2024-08-01\\",\\"125000\\"",
    "analysisSummary": "L'analyse des prévisions de coûts indique une tendance à la hausse des coûts au cours des prochains mois. Les principaux moteurs sont l'augmentation des prix des matières premières et des coûts de main-d'œuvre plus élevés. Pour atténuer les dépassements budgétaires potentiels, il est recommandé de mettre en œuvre des mesures de réduction des coûts, telles que la renégociation des contrats avec les fournisseurs et l'optimisation des processus de production.",
    "overrunWarning": "Un dépassement de budget est détecté pour le mois d'août. Mettez en œuvre des mesures de réduction des coûts pour résoudre le problème."
  }
  \`\`\``,
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
