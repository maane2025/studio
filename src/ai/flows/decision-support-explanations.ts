'use server';

/**
 * @fileOverview Provides AI-generated explanations for cost trends and potential budget overruns to aid managerial decision-making.
 *
 * - getDecisionSupportExplanation - A function that generates explanations for cost trends and budget overruns.
 * - GetDecisionSupportExplanationInput - The input type for the getDecisionSupportExplanation function.
 * - GetDecisionSupportExplanationOutput - The return type for the getDecisionSupportExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetDecisionSupportExplanationInputSchema = z.object({
  costTrends: z.string().describe('Description of cost trends.'),
  budgetVariance: z.string().describe('Description of budget variance.'),
});
export type GetDecisionSupportExplanationInput = z.infer<
  typeof GetDecisionSupportExplanationInputSchema
>;

const GetDecisionSupportExplanationOutputSchema = z.object({
  explanation: z.string().describe('AI-generated explanation for cost trends and budget overruns.'),
});
export type GetDecisionSupportExplanationOutput = z.infer<
  typeof GetDecisionSupportExplanationOutputSchema
>;

export async function getDecisionSupportExplanation(
  input: GetDecisionSupportExplanationInput
): Promise<GetDecisionSupportExplanationOutput> {
  return getDecisionSupportExplanationFlow(input);
}

const decisionSupportExplanationPrompt = ai.definePrompt({
  name: 'decisionSupportExplanationPrompt',
  input: {schema: GetDecisionSupportExplanationInputSchema},
  output: {schema: GetDecisionSupportExplanationOutputSchema},
  prompt: `You are an AI assistant helping managers understand cost trends and budget overruns.
  Provide a clear and concise explanation based on the following information:

  Cost Trends: {{{costTrends}}}
  Budget Variance: {{{budgetVariance}}}

  Explanation:`,
});

const getDecisionSupportExplanationFlow = ai.defineFlow(
  {
    name: 'getDecisionSupportExplanationFlow',
    inputSchema: GetDecisionSupportExplanationInputSchema,
    outputSchema: GetDecisionSupportExplanationOutputSchema,
  },
  async input => {
    const {output} = await decisionSupportExplanationPrompt(input);
    return output!;
  }
);
