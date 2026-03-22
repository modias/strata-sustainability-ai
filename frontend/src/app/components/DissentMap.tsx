import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { DevilsAdvocateChallenge } from "../data/mockData";
import { Swords, ExternalLink } from "lucide-react";

interface DissentMapProps {
  devilsAdvocate: DevilsAdvocateChallenge;
}

export function DissentMap({ devilsAdvocate }: DissentMapProps) {
  return (
    <motion.div
      className="w-full min-w-0"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center border border-purple-500/30">
                <Swords className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white text-lg">{"Devil's Advocate Agent"}</CardTitle>
                <p className="text-sm text-purple-300 mt-1">Targeting: {devilsAdvocate.targetAgent}</p>
              </div>
            </div>
            <Badge variant="outline" className="border-purple-500/30 text-purple-400">
              Round 2
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Challenge */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
            <h4 className="text-sm font-semibold text-purple-300 mb-2">Challenge</h4>
            <p className="text-slate-300 leading-relaxed">{devilsAdvocate.challenge}</p>
          </div>

          {/* Counter Evidence */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">Counter Data Point</h4>
              <p className="text-slate-300 text-sm">{devilsAdvocate.specificDataPoint}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-purple-500/20">
              <h4 className="text-sm font-semibold text-purple-300 mb-2 flex items-center gap-2">
                Source
                <ExternalLink className="h-3 w-3" />
              </h4>
              <p className="text-slate-300 text-sm">{devilsAdvocate.counterDataSource}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="border-t border-purple-500/20 pt-4">
            <p className="text-xs text-slate-400 italic">
              This review runs after all primary agents finish, targeting the strongest claim with a specific,
              sourced counter-argument. It surfaces hidden assumptions and contested data points that would
              otherwise stay invisible.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
