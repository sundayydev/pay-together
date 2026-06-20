import { Context } from "hono";
import { VietQRService } from "../../infrastructure/services/vietqr.service";
import { AppResponse, AppResponseWithData } from "../../utils/response";

export class BanksController {
  constructor(private vietQRService: VietQRService) {}

  async getBanks(c: Context) {
    try {
      const result = await this.vietQRService.fetchBanks();
      const banks = result.map((item) => ({
        id: item.id,
        bin: item.bin,
        code: item.code,
        name: item.name,
        shortName: item.shortName || item.short_name,
        logoUrl: item.logo || null,
        appCode: null,
        isActive: true,
      }));
      return c.json(AppResponseWithData.successWithData(banks), 200);
    } catch (error: any) {
      return c.json(AppResponse.fail(error.message, error, 500), 500);
    }
  }
}
