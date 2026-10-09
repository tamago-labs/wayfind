'use client';

export default function ApiKeysPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="font-display text-3xl font-bold text-white tracking-tight mb-3">API Keys</h1>
      <p className="text-white/50 text-sm leading-relaxed mb-8">
        Manage your API keys for Grok Bot integration. Create and configure keys to enable your AI agents to trade and manage tokenized stocks.
      </p>

      <div className="bg-white/[0.03] border border-border3 rounded-xl p-6 mb-6">
        <h2 className="font-display font-semibold text-white text-lg mb-2">Your API Keys</h2>
        <p className="text-white/40 text-sm">No API keys yet. Create your first key to get started.</p>
      </div>

      <button
        onClick={() => alert('Coming soon! API keys will be ready in 2-3 days.')}
        className="flex items-center gap-2 bg-gradient-to-r from-zenblue to-zenpurple text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
      >
        Create API Key
      </button>
    </div>
  );
}