export type CoachAdvice = {
  summary: string;
  tips: string[];
};

export type CoachResult =
  | { ok: true; advice: CoachAdvice }
  | { ok: false; message: string };
