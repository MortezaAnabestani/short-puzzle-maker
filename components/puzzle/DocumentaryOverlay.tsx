import React, { useState, useEffect } from "react";
import { BookOpen, Quote, Sparkles, Eye, Zap } from "lucide-react";
import { StoryArc } from "../../types";

interface DocumentaryOverlayProps {
  progress: number;
  snippets: string[];
  storyArc?: StoryArc;
  isEnabled: boolean;
  isSolving: boolean;
}

const DocumentaryOverlay: React.FC<DocumentaryOverlayProps> = ({
  progress,
  snippets,
  storyArc,
  isEnabled,
  isSolving,
}) => {
  const [currentText, setCurrentText] = useState<string>("");
  const [currentPhase, setCurrentPhase] = useState<"hook" | "buildup" | "climax" | "reveal" | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isEnabled || !isSolving) {
      setIsVisible(false);
      return;
    }

    if (storyArc) {
      // بازه‌های جدید: نمایش طولانی‌تر (13%) و فواصل یکسان (4%)
      if (progress >= 5 && progress < 18) {
        setCurrentText(storyArc.hook);
        setCurrentPhase("hook");
        setIsVisible(true);
      } else if (progress >= 22 && progress < 35) {
        setCurrentText(storyArc.buildup[0] || "");
        setCurrentPhase("buildup");
        setIsVisible(true);
      } else if (progress >= 39 && progress < 52) {
        setCurrentText(storyArc.buildup[1] || "");
        setCurrentPhase("buildup");
        setIsVisible(true);
      } else if (progress >= 56 && progress < 69) {
        setCurrentText(storyArc.buildup[2] || "");
        setCurrentPhase("buildup");
        setIsVisible(true);
      } else if (progress >= 73 && progress < 86) {
        setCurrentText(storyArc.climax);
        setCurrentPhase("climax");
        setIsVisible(true);
      } else if (progress >= 90 && progress < 97) {
        // پایان در 97٪ برای جلوگیری از تداخل با موج
        setCurrentText(storyArc.reveal);
        setCurrentPhase("reveal");
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    } else if (snippets.length > 0) {
      // برای اسنیپت‌های معمولی هم زمانبندی را اصلاح می‌کنیم
      const thresholds = [10, 28, 46, 64, 82];
      const thresholdIndex = thresholds.findIndex((t) => progress >= t && progress < t + 14);

      if (thresholdIndex !== -1) {
        setCurrentText(snippets[thresholdIndex % snippets.length]);
        setCurrentPhase("buildup");
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    }
  }, [progress, isEnabled, isSolving, snippets, storyArc]);

  if (!isEnabled || !isVisible || !currentText) return null;

  const phaseConfig = {
    hook: { icon: <Sparkles className="w-4 h-4" />, color: "yellow", label: "Mystery Hook" },
    buildup: { icon: <BookOpen className="w-4 h-4" />, color: "blue", label: "Discovery" },
    climax: { icon: <Zap className="w-4 h-4" />, color: "purple", label: "Revelation" },
    reveal: { icon: <Eye className="w-4 h-4" />, color: "green", label: "Truth Revealed" },
  };

  const config = phaseConfig[currentPhase || "buildup"];
  const colorClasses = {
    yellow: "bg-yellow-600/20 border-yellow-500/30 text-yellow-400",
    blue: "bg-blue-600/20 border-blue-500/30 text-blue-400",
    purple: "bg-purple-600/20 border-purple-500/30 text-purple-400",
    green: "bg-emerald-600/20 border-emerald-500/30 text-emerald-400",
  };

  return (
    <div className="absolute bottom-[22%] left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-[110] animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-start gap-3 overflow-hidden">
        <div
          className={`w-8 h-8 rounded-xl ${
            colorClasses[config.color]
          } flex items-center justify-center shrink-0 mt-0.5`}
        >
          {config.icon}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span
            className={`text-[8px] font-black uppercase tracking-[0.3em] ${
              config.color === "yellow"
                ? "text-yellow-500/70"
                : config.color === "purple"
                ? "text-purple-500/70"
                : config.color === "green"
                ? "text-emerald-500/70"
                : "text-blue-500/70"
            }`}
          >
            {config.label}
          </span>
          <p className="text-[12px] font-bold text-white leading-tight break-words">{currentText}</p>
        </div>
        <div className="absolute -top-3 -left-3 opacity-5">
          <Quote className="w-12 h-12 text-white" />
        </div>
      </div>

      <div className="mt-2 h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            config.color === "yellow"
              ? "bg-yellow-500/40"
              : config.color === "purple"
              ? "bg-purple-500/40"
              : config.color === "green"
              ? "bg-emerald-500/40"
              : "bg-blue-500/40"
          } animate-pulse w-full`}
        />
      </div>
    </div>
  );
};

export default DocumentaryOverlay;
