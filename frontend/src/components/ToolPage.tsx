import type { ReactNode } from 'react';

interface Props {
  title: string;
  description: string;
  icon: string;
  children: ReactNode;
  model?: string;
  tech?: string[];
}

export default function ToolPage({ title, description, icon, children, model, tech }: Props) {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">{icon}</div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">{description}</p>
          {model && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary-500/20">
              <span className="text-xs text-gray-500">模型:</span>
              <span className="text-sm text-primary-400 font-medium">{model}</span>
            </div>
          )}
          {tech && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {tech.map((t) => (
                <span key={t} className="text-xs px-3 py-1 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="glass-card glow-ring !p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
