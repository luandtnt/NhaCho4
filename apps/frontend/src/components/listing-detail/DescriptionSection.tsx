import { Sparkles } from 'lucide-react';

interface DescriptionSectionProps {
  description: string;
  highlights?: string[];
}

export default function DescriptionSection({ description, highlights }: DescriptionSectionProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📝 Mô tả chi tiết</h3>
      
      <div className="prose max-w-none">
        <p className="text-gray-700 whitespace-pre-line leading-relaxed">
          {description}
        </p>
      </div>

      {highlights && highlights.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h4 className="text-lg font-semibold text-gray-900">Điểm nổi bật</h4>
          </div>
          
          <ul className="space-y-2">
            {highlights.map((highlight, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="text-amber-500 mt-1">✨</span>
                <span className="text-gray-700">{highlight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
