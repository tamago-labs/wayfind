export default function Home() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zenblue to-zenpurple flex items-center justify-center mx-auto">
          <span className="text-2xl font-brand rotate-[-10deg]">W</span>
        </div>
        <h1 className="font-display text-2xl font-semibold text-white/90">Welcome to Wayfind</h1>
        <p className="text-sm text-white/40 max-w-md">
          Your gateway to tokenized stocks across Web3. Explore markets, manage your portfolio, or run a risk assessment.
        </p>
      </div>
    </div>
  );
}
