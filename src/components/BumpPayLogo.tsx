/** BumpPay mark, monochrome (uses currentColor), transparent background. */
export function BumpPayLogo({ size = 28, withName = true }: { size?: number; withName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label="BumpPay" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M24 4h52a20 20 0 0 1 20 20v52a20 20 0 0 1-20 20H24A20 20 0 0 1 4 76V24A20 20 0 0 1 24 4Zm-4 32v44h20l14-24H40l12-12h-6l-10 10V36Zm34 0v10c8 10 22 10 26 0V36Zm4 18-22 26h44V54c-6 6-14 6-22 0Z"
        />
      </svg>
      {withName && <span className="font-display text-sm font-extrabold tracking-tight">BumpPay</span>}
    </span>
  );
}
