import { motion } from "motion/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { User, Briefcase, Building } from "lucide-react";

export function UserPersonas() {
  const personas = [
    {
      icon: User,
      name: "Maya - ESG Analyst",
      role: "$8B Asset Manager",
      story:
        "Maya's firm is evaluating Anacostia real estate for their ESG portfolio. Normally she'd spend 3 days building a memo from EPA data and Census reports. With STRATA she types the address, watches the multi-angle review finish in 45 seconds, and sees CONTESTED with HIGH dissent flagged on displacement risk. She sends the verdict card to her manager with one note: 'Environmental story is solid but equity story is contested—recommend holding off until Q3 rent data.' Three days became 45 seconds. The decision is better, not just faster.",
      color: "from-emerald-500/20 to-teal-600/20",
      borderColor: "border-emerald-500/30",
    },
    {
      icon: Briefcase,
      name: "James - Director of Sustainability",
      role: "Regional Manufacturer",
      story:
        "James's CEO announced net-zero by 2040. James has zero capex budget. He uses STRATA in the company view with no-expansion turned on. The operations summary returns four actions: consolidate supplier deliveries (saves $280k annually, -28% logistics emissions), shift production to off-peak hours (-12% energy cost), switch two packaging suppliers at equivalent cost (supply-chain emissions), and sign a renewable energy certificate with the existing utility (eliminates on-site electricity emissions). Total capex: zero. James implements all four in the next quarter.",
      color: "from-blue-500/20 to-indigo-600/20",
      borderColor: "border-blue-500/30",
    },
    {
      icon: Building,
      name: "Dr. Priya - Urban Planning Director",
      role: "Mid-Size City",
      story:
        "Priya has $12M to allocate across six neighborhoods for green infrastructure. She runs all six through STRATA in 10 minutes. Two are IMPROVING, two STAGNANT, one DECLINING, one CONTESTED. The DECLINING neighborhood with extreme heat vulnerability gets the largest allocation. The CONTESTED neighborhood gets a community benefit agreement requirement. The IMPROVING neighborhoods get maintenance allocations. Priya defends each decision in city council with debate-tested, data-backed rationale—not a $200k consultant report that took three months.",
      color: "from-purple-500/20 to-pink-600/20",
      borderColor: "border-purple-500/30",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto mt-16">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-white mb-2">Who Uses STRATA</h3>
        <p className="text-slate-400">Real personas, real value propositions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {personas.map((persona, i) => (
          <motion.div
            key={persona.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
          >
            <Card className={`bg-gradient-to-br ${persona.color} border ${persona.borderColor} h-full`}>
              <CardHeader>
                <div className="flex items-start gap-3 mb-2">
                  <div
                    className={`h-12 w-12 rounded-lg bg-gradient-to-br ${persona.color} flex items-center justify-center border ${persona.borderColor}`}
                  >
                    <persona.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{persona.name}</CardTitle>
                    <p className="text-sm text-slate-400">{persona.role}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm leading-relaxed">{persona.story}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
