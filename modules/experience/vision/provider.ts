export type VisionSearchRequest = { imageRef: string; query?: string };
export type VisionCandidate = { title: string; similarity: number; reason: string };
export type VisionSearchResult = {
  status: 'PROVIDER_REQUIRED' | 'READY';
  provider?: string;
  candidates: VisionCandidate[];
  message: string;
};

export interface VisionProvider {
  name: string;
  search(input: VisionSearchRequest): Promise<VisionSearchResult>;
}

export class UnconfiguredVisionProvider implements VisionProvider {
  name = 'unconfigured';
  async search(_input: VisionSearchRequest): Promise<VisionSearchResult> {
    return {
      status: 'PROVIDER_REQUIRED',
      candidates: [],
      message: 'البحث البصري جاهز للتوصيل، لكن لا يوجد Vision Provider مُكوّن في بيئة التشغيل الحالية.',
    };
  }
}

export function getVisionProvider(): VisionProvider {
  return new UnconfiguredVisionProvider();
}
