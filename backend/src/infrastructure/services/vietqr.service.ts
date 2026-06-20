export interface VietQRBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
  transferSupported: number;
  lookupSupported: number;
  short_name: string;
  support: number;
  isTransfer: number;
  swift_code: string | null;
}

export class VietQRService {
  private apiUrl: string;

  constructor(apiUrl: string) {
    this.apiUrl = apiUrl;
  }

  async fetchBanks(): Promise<VietQRBank[]> {
    const res = await fetch(this.apiUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch banks from VietQR API: ${res.statusText}`);
    }
    const result = (await res.json()) as { code: string; desc: string; data: VietQRBank[] };
    if (result.code !== "00") {
      throw new Error(result.desc || "Failed to fetch banks from VietQR");
    }
    return result.data;
  }
}
