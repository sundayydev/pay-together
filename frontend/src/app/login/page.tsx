"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, ArrowRight, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const POPULAR_BANKS = [
  { code: "MB", shortName: "MB", name: "Ngân hàng Quân Đội" },
  { code: "VCB", shortName: "Vietcombank", name: "Ngân hàng Ngoại thương Việt Nam" },
  { code: "TCB", shortName: "Techcombank", name: "Ngân hàng Kỹ thương Việt Nam" },
  { code: "CTG", shortName: "VietinBank", name: "Ngân hàng Công thương Việt Nam" },
  { code: "BIDV", shortName: "BIDV", name: "Ngân hàng Đầu tư và Phát triển Việt Nam" },
  { code: "ACB", shortName: "ACB", name: "Ngân hàng Á Châu" },
  { code: "VPB", shortName: "VPBank", name: "Ngân hàng Thịnh vượng và Phát triển" },
  { code: "STB", shortName: "Sacombank", name: "Ngân hàng Sài Gòn Thương Tín" },
  { code: "TPB", shortName: "TPBank", name: "Ngân hàng Tiên Phong" },
  { code: "VIB", shortName: "VIB", name: "Ngân hàng Quốc tế" },
  { code: "HDB", shortName: "HDBank", name: "Ngân hàng Phát triển TP.HCM" },
  { code: "SHB", shortName: "SHB", name: "Ngân hàng Sài Gòn - Hà Nội" },
];

interface BankLogoButtonProps {
  bank: { code: string; shortName: string; name: string; logoUrl?: string };
  isSelected: boolean;
  onClick: () => void;
}

const BankLogoButton = ({ bank, isSelected, onClick }: BankLogoButtonProps) => {
  const [imgError, setImgError] = React.useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 border rounded-xl text-center transition-all cursor-pointer h-[68px] ${
        isSelected
          ? "border-primary bg-primary/5 shadow-xs"
          : "border-border bg-background hover:border-muted-foreground/30"
      }`}
    >
      <div className={`w-10 h-6 flex items-center justify-center overflow-hidden mb-1 px-1 ${imgError ? 'bg-muted border border-border' : 'bg-white'}`}>
        {imgError ? (
          <span className="text-[9px] font-bold text-muted-foreground uppercase truncate">
            {bank.shortName}
          </span>
        ) : (
          <img
            src={bank.logoUrl || `https://api.vietqr.io/img/${bank.code}.png`}
            alt={bank.shortName}
            className="max-w-full max-h-full object-contain"
            onError={() => setImgError(true)}
          />
        )}
      </div>
      <span className="text-[9px] font-semibold text-muted-foreground truncate max-w-full">
        {bank.shortName}
      </span>
    </button>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  
  // Register States
  const [isRegister, setIsRegister] = React.useState(false);
  const [name, setName] = React.useState("");
  const [showBankInfo, setShowBankInfo] = React.useState(false);
  const [bankCode, setBankCode] = React.useState("");
  const [bankAccount, setBankAccount] = React.useState("");
  const [bankAccountName, setBankAccountName] = React.useState("");
  const [banksList, setBanksList] = React.useState(POPULAR_BANKS);
  const [bankSearch, setBankSearch] = React.useState("");

  React.useEffect(() => {
    const fetchBanks = async () => {
      try {
        const host = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
        const response = await fetch(`${host}/api/banks`);
        const data = await response.json();
        if (response.ok && data.result && Array.isArray(data.data)) {
          setBanksList(data.data);
        }
      } catch {
        // use fallback
      }
    };
    fetchBanks();
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    if (mounted) {
      const savedTheme = localStorage.getItem("theme") || "green";
      const root = document.documentElement;
      root.classList.remove("theme-green", "theme-blue", "theme-yellow", "theme-pink", "theme-dark", "dark");
      root.classList.add(`theme-${savedTheme}`);
      if (savedTheme === "dark") {
        root.classList.add("dark");
      }
    }
  }, [mounted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !password) {
      toast.error("Vui lòng nhập đầy đủ số điện thoại và mật khẩu.");
      return;
    }
    if (isRegister && !name.trim()) {
      toast.error("Vui lòng nhập họ và tên.");
      return;
    }

    setIsLoading(true);

    try {
      const host = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
      
      if (isRegister) {
        // Register API Call
        const registerResponse = await fetch(`${host}/api/auth/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
            password,
            name: name.trim(),
            bankCode: bankCode.trim() || null,
            bankAccount: bankAccount.trim() || null,
            bankAccountName: bankAccountName.trim() || null,
          }),
        });

        const registerData = await registerResponse.json();

        if (!registerResponse.ok || !registerData.result) {
          throw new Error(registerData.message || "Đăng ký thất bại.");
        }

        toast.success("Đăng ký tài khoản thành công! Đang tự động đăng nhập...");

        // Auto Login after Registration
        const loginResponse = await fetch(`${host}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber, password }),
        });

        const loginData = await loginResponse.json();
        if (!loginResponse.ok || !loginData.result) {
          throw new Error(loginData.message || "Tự động đăng nhập thất bại. Vui lòng đăng nhập thủ công.");
        }

        localStorage.setItem("token", loginData.data.token);
        localStorage.setItem("refresh_token", loginData.data.refresh_token);
        localStorage.setItem("user", JSON.stringify(loginData.data.user));

        setTimeout(() => {
          router.push("/");
        }, 1000);

      } else {
        // Login API Call
        const response = await fetch(`${host}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber, password }),
        });

        const data = await response.json();

        if (!response.ok || !data.result) {
          throw new Error(data.message || "Đăng nhập thất bại.");
        }

        localStorage.setItem("token", data.data.token);
        localStorage.setItem("refresh_token", data.data.refresh_token);
        localStorage.setItem("user", JSON.stringify(data.data.user));

        toast.success("Đăng nhập thành công!");
        setTimeout(() => {
          router.push("/");
        }, 1000);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Đã xảy ra lỗi.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background text-foreground flex font-sans">
      {/* Background Dot Grid */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.015]" 
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: "24px 24px"
        }}
      />

      {/* Decorative Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Asymmetric Desktop Layout (Left Panel) */}
      <div className="hidden lg:flex flex-col justify-between w-[55%] p-16 relative z-10 border-r border-border bg-card/40 backdrop-blur-xs select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary flex items-center justify-center font-bold text-primary-foreground text-xl rounded-full">
            P
          </div>
          <span className="text-xl font-semibold tracking-wider text-foreground">PayTogether</span>
        </div>

        {/* Large Typographic Visual */}
        <div className="relative my-auto py-12">
          <div className="absolute -top-16 left-0 text-[180px] font-black leading-none text-zinc-200 tracking-tighter opacity-20 pointer-events-none select-none">
            PAY
          </div>
          <div className="relative z-10">
            <h2 className="text-5xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Quản Lý Chi Tiêu <br />
              <span className="text-primary">Quyết Toán Tự Động.</span>
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
              Giải pháp tối ưu nhất cho quỹ nhóm, quyết toán công nợ tự động bằng mã VietQR, không lo thất thoát hay tính toán nhầm lẫn.
            </p>
          </div>
          <div className="absolute -bottom-16 right-0 text-[180px] font-black leading-none text-zinc-200 tracking-tighter opacity-20 pointer-events-none select-none">
            TOGETHER
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-muted-foreground/60">
          <span>© 2026 PayTogether. All rights reserved.</span>
          <span>Bảo mật • Tốc độ • Minh bạch</span>
        </div>
      </div>

      {/* Asymmetric Login Card Panel (Right Panel) */}
      <div className="flex flex-col justify-center items-center flex-1 p-6 md:p-12 relative z-10">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-primary flex items-center justify-center font-bold text-primary-foreground text-xl rounded-full">
            P
          </div>
          <span className="text-xl font-semibold tracking-wider text-foreground">PayTogether</span>
        </div>

        {/* Login Container */}
        <div className="w-full max-w-md bg-card border border-border p-8 shadow-2xl rounded-3xl relative">
          {/* Accent border stripe */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary rounded-t-3xl" />

          <div className="flex flex-col space-y-2 text-left mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {isRegister ? "Đăng ký tài khoản" : "Chào mừng quay trở lại"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRegister 
                ? "Tạo tài khoản mới để bắt đầu quản lý quỹ chi tiêu nhóm" 
                : "Nhập thông tin tài khoản của bạn để tiếp tục sử dụng hệ thống"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {isRegister && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Họ và Tên
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-11 rounded-full px-4"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Số Điện Thoại
              </Label>
              <div className="relative">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="09xx xxx xxx"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring h-11 rounded-full px-4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Mật Khẩu
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-1 focus:ring-ring pr-10 h-11 rounded-full px-4"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Optional Collapsible Bank Details for Register */}
            {isRegister && (
              <div className="space-y-4 pt-4 border-t border-border">
                <div 
                  className="flex justify-between items-center cursor-pointer select-none group" 
                  onClick={() => setShowBankInfo(!showBankInfo)}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                    Thông tin ngân hàng nhận tiền
                  </span>
                  <span className="text-xs font-semibold text-primary hover:text-primary/80">
                    {showBankInfo ? "Ẩn bớt" : "Thiết lập ngay"}
                  </span>
                </div>
                {showBankInfo && (
                  <div className="space-y-4 pt-2 animate-fade-in">
                    <div className="space-y-2">
                      <Label htmlFor="bankCode" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Chọn ngân hàng</Label>
                      <Input
                        type="text"
                        placeholder="Tìm kiếm ngân hàng..."
                        value={bankSearch}
                        onChange={(e) => setBankSearch(e.target.value)}
                        disabled={isLoading}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 h-9 text-xs mb-2 focus:border-ring focus:ring-1 focus:ring-ring rounded-full px-4"
                      />
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(85px,1fr))] gap-2 max-h-[140px] overflow-y-auto pr-1 border border-border p-2 bg-background/50 rounded-2xl">
                        {banksList
                          .filter(
                            (b) =>
                              b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
                              b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
                              b.code.toLowerCase().includes(bankSearch.toLowerCase())
                          )
                          .map((b) => (
                             <BankLogoButton
                               key={b.code}
                               bank={b}
                               isSelected={bankCode === b.code}
                               onClick={() => setBankCode(bankCode === b.code ? "" : b.code)}
                             />
                          ))}
                        {banksList.filter(
                          (b) =>
                            b.shortName.toLowerCase().includes(bankSearch.toLowerCase()) ||
                            b.name.toLowerCase().includes(bankSearch.toLowerCase()) ||
                            b.code.toLowerCase().includes(bankSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="col-span-3 py-4 text-center text-[10px] text-muted-foreground">
                            Không tìm thấy ngân hàng
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Số tài khoản ngân hàng</Label>
                      <Input
                        id="bankAccount"
                        type="text"
                        placeholder="Nhập số tài khoản ngân hàng"
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                        disabled={isLoading}
                        className="bg-background border-input text-foreground placeholder:text-muted-foreground/60 h-10 text-xs rounded-full px-4"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountName" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Họ tên chủ tài khoản (KHÔNG DẤU)</Label>
                      <Input
                        id="bankAccountName"
                        type="text"
                        placeholder="Ví dụ: NGUYEN VAN A"
                        value={bankAccountName}
                        onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                        disabled={isLoading}
                        className="bg-background border-input text-foreground uppercase placeholder:text-muted-foreground/60 h-10 text-xs rounded-full px-4"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick test credentials alert */}
            {!isRegister && (
              <div className="p-3 bg-secondary/80 border-l-2 border-primary text-[11px] text-muted-foreground flex items-start gap-2 rounded-r-xl">
                <ShieldAlert size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-foreground">Tài khoản chạy thử (nếu có):</span>
                  <br />
                  Sử dụng số điện thoại và mật khẩu đã đăng ký để kiểm thử.
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  {isRegister ? "Đăng Ký Tài Khoản" : "Đăng Nhập"}
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </form>

          {/* Quick Registration Link Toggle */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            {isRegister ? (
              <>
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(false)}
                  className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0 inline font-medium"
                >
                  Đăng nhập ngay
                </button>
              </>
            ) : (
              <>
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => setIsRegister(true)}
                  className="text-primary hover:underline cursor-pointer bg-transparent border-none p-0 inline font-medium"
                >
                  Đăng ký ngay
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {mounted && <Toaster theme="light" position="top-right" richColors closeButton />}
    </div>
  );
}
