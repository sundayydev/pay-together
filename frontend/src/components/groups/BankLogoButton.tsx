import * as React from "react";

interface BankLogoButtonProps {
  bank: { code: string; shortName: string; name: string; logoUrl?: string };
  isSelected: boolean;
  onClick: () => void;
}

export const BankLogoButton = ({ bank, isSelected, onClick }: BankLogoButtonProps) => {
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
