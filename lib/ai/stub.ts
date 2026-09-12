// Future AI-analysis seam. The UI renders a disabled placeholder until a
// real provider is wired in — never synthetic "analysis".

export interface EraComparison {
  fromYear: number;
  toYear: number;
  summary: string;
  provider: string;
}

export interface AiArchaeologist {
  /** Returns null when no provider is configured (current state). */
  compareEras(input: {
    fromYear: number;
    toYear: number;
  }): Promise<EraComparison | null>;
}

export const aiArchaeologist: AiArchaeologist = {
  async compareEras() {
    return null;
  },
};
