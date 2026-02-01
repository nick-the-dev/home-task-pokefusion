import { z } from "zod";

export const SignatureMoveSchema = z.object({
  name: z.string(),
  type: z.string(),
  power: z.number().min(0).max(200),
  description: z.string(),
});

export const GeneratedChildStatsSchema = z.object({
  hp: z.number().min(1).max(255),
  attack: z.number().min(1).max(255),
  defense: z.number().min(1).max(255),
  specialAttack: z.number().min(1).max(255),
  specialDefense: z.number().min(1).max(255),
  speed: z.number().min(1).max(255),
});

export const GeneratedChildSchema = z.object({
  name: z.string().min(1).max(50),
  types: z.array(z.string()).min(1).max(2),
  stats: GeneratedChildStatsSchema,
  abilities: z.array(z.string()).min(1).max(2),
  signatureMove: SignatureMoveSchema,
  description: z.string(),
});

export type SignatureMove = z.infer<typeof SignatureMoveSchema>;
export type GeneratedChildStats = z.infer<typeof GeneratedChildStatsSchema>;
export type GeneratedChild = z.infer<typeof GeneratedChildSchema>;
