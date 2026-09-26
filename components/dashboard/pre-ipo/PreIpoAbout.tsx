import ReactMarkdown from 'react-markdown';

interface PreIpoAboutProps {
  name: string;
  description: string;
}

export default function PreIpoAbout({ name, description }: PreIpoAboutProps) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <h3 className="text-[15px] font-semibold text-white/90 mb-3">About {name}</h3>
      <div className="text-[13px] text-white/50 leading-relaxed max-h-64 overflow-y-auto pr-2 prose prose-invert prose-sm">
        <ReactMarkdown>{description}</ReactMarkdown>
      </div>
    </div>
  );
}
