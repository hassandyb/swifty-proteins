export const authStyles = {
  // Layout & Containers
  container: "flex-1 bg-bg",
  content: "flex-1 px-8 py-16 justify-between",
  bgWatermark: "absolute text-bg opacity-[0.04] font-black text-[180px] -right-6 top-16 tracking-tighter",
  
  // Header
  header: "mb-20",
  title: "text-accent font-black uppercase text-5xl tracking-tighter leading-none",
  subtitle: "text-muted text-xs tracking-[0.2em] mt-2",
  
  // Toggle
  toggleContainer: "flex-row bg-card border border-border rounded-xl p-1",
  toggleBtn: "flex-1 py-3 rounded-lg items-center",
  toggleBtnActive: "bg-accent",
  toggleBtnInactive: "bg-transparent",
  toggleTextActive: "text-bg font-bold text-sm",
  toggleTextInactive: "text-muted text-sm font-semibold",
  
  // Inputs Area (Fixed height prevents layout jump)
  inputsWrapper: "flex-1 justify-center min-h-[320]",
  inputLabel: "text-muted text-sm uppercase tracking-[0.15em] mb-1 mt-2",
  inputField: "bg-card border border-border rounded-xl px-4 py-4 text-accent text-sm placeholder:text-muted",
  
  // Error
  // Error Slot (Fixed height, no layout shift)
  errorSlot: "min-h-[24] my-2", // Always reserves space
  errorContainer: "bg-danger/10 border border-danger/20 rounded-xl px-4 py-2",
  errorText: "text-danger text-xs text-center",
  // Buttons
  submitBtn: "bg-accent rounded-xl py-4 items-center active:opacity-80 flex-[2]",
  submitText: "text-bg font-black text-sm tracking-[0.05em]",
  biometricBtn: "bg-card border border-border rounded-xl items-center justify-center active:opacity-80 w-14",
  
  // Footer
  footer: "text-muted text-xs text-center mt-6 tracking-[0.05em]",
};
