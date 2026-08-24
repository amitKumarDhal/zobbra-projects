import React from 'react';
import { Star } from 'lucide-react';

interface RatingOverviewProps {
  stats: {
    total: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
  };
}

export default function RatingOverview({ stats }: RatingOverviewProps) {
  const { total, averageRating, ratingDistribution } = stats;

  return (
    <div className="bg-white border border-[#E5E7EB] rounded-2xl p-5 mt-6">
      <h3 className="text-sm font-bold text-[#111111] mb-4">Rating Overview</h3>
      
      <div className="flex gap-6 items-center">
        {/* Bars */}
        <div className="flex-1 space-y-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = ratingDistribution[star] || 0;
            const percentage = total > 0 ? (count / total) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3">
                <span className="text-[10px] font-semibold text-[#6B7280] w-8">{star} Star</span>
                <div className="flex-1 h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full" 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#6B7280] w-12 text-right">{count} ({percentage.toFixed(1)}%)</span>
              </div>
            );
          })}
        </div>
        
        {/* Big number */}
        <div className="text-center w-24">
          <div className="text-4xl font-black text-[#111111]">{averageRating.toFixed(1)}</div>
          <div className="flex justify-center my-1 gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-3 h-3 ${s <= Math.round(averageRating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
          <div className="text-[10px] text-[#6B7280]">({total} Reviews)</div>
        </div>
      </div>
    </div>
  );
}
