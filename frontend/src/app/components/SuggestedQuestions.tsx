import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Verdict } from "../data/mockData";
import { MessageSquare, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface SuggestedQuestionsProps {
  questions: string[];
  verdict: Verdict;
}

export function SuggestedQuestions({ questions, verdict }: SuggestedQuestionsProps) {
  const handleQuestionClick = (question: string) => {
    toast.info("Question selected", {
      description: `"${question}" - In production, this would trigger a targeted re-analysis.`,
    });
  };

  const getVerdictColor = (v: Verdict) => {
    switch (v) {
      case "IMPROVING":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "DECLINING":
        return "border-red-500/30 bg-red-500/5";
      case "CONTESTED":
        return "border-amber-500/30 bg-amber-500/5";
      case "STAGNANT":
        return "border-slate-500/30 bg-slate-500/5";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card className={`${getVerdictColor(verdict)} border`}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-white text-lg">Suggested Follow-up Questions</CardTitle>
          </div>
          <p className="text-sm text-slate-400 mt-2">
            Context-aware questions based on the verdict and agent disagreements
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {questions.map((question, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => handleQuestionClick(question)}
                className="w-full justify-between text-left h-auto py-4 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
              >
                <span className="text-slate-300 font-normal">{question}</span>
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-emerald-400 flex-shrink-0 ml-2" />
              </Button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400">
              <strong className="text-slate-300">Why this matters:</strong> When a user looks at a CONTESTED
              neighborhood or a STAGNANT company, they shouldn't have to know what to ask next. These auto-populated
              questions tie directly to the specific verdict and agent disagreements—connecting the analysis to
              actionable decisions.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
