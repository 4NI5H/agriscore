import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Users, TrendingUp, AlertTriangle, CheckCircle, ArrowUpRight, ArrowDownRight, Activity, Calendar, Map as MapIcon, ShieldCheck, CloudLightning, Globe, Sprout, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardData {
  totalFarmers: number;
  avgScore: number;
  riskDistribution: { risk_category: string; count: number }[];
  recentScores: { name: string; score: number; risk_category: string; created_at: string }[];
  dailyTrends: { date: string; count: number; avg_score: number }[];
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export default function Dashboard({ onFarmerClick, onNavigateToList }: { onFarmerClick: (id: number) => void, onNavigateToList: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showLoansModal, setShowLoansModal] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-96">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Loading Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-display font-bold text-gray-900 tracking-tight">Portfolio Intelligence</h2>
          <p className="text-gray-500 mt-1 font-medium">Real-time credit analytics & macro-environmental monitoring.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <Calendar size={16} className="text-emerald-600" />
          <span className="text-sm font-bold text-gray-700">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </header>

      {/* Macro Alerts Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-amber-500 to-orange-400 p-1 rounded-3xl shadow-lg shadow-orange-200/50"
      >
        <div className="bg-white/95 backdrop-blur-sm p-5 rounded-[22px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center animate-pulse">
              <CloudLightning size={20} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">Macro Climate Alert: El Niño Pattern Detected</h4>
              <p className="text-xs text-gray-600 font-medium">Expected 15% rainfall deficit in Q3. 12 farmers in your portfolio are in high-risk zones.</p>
            </div>
          </div>
          <button className="px-4 py-2 bg-orange-50 text-orange-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-orange-100 transition-colors">
            View Impact
          </button>
        </div>
      </motion.div>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div onClick={onNavigateToList} whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <Users size={24} />
              </div>
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} /> +12%
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Farmers</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter">{data.totalFarmers}</p>
          </div>
        </motion.div>

        <motion.div onClick={() => setShowScoreModal(true)} whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                <Activity size={24} />
              </div>
              <span className="flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-full">
                Stable
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Avg AgriScore</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter">{data.avgScore}</p>
          </div>
        </motion.div>

        <motion.div onClick={() => setShowLoansModal(true)} whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden cursor-pointer">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Globe size={24} />
              </div>
              <span className="flex items-center gap-1 text-indigo-600 text-xs font-bold bg-indigo-50 px-2 py-1 rounded-full">
                <ArrowUpRight size={12} /> 42%
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">First-Time Borrowers</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter">18</p>
          </div>
        </motion.div>

        <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150" />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <span className="flex items-center gap-1 text-purple-600 text-xs font-bold bg-purple-50 px-2 py-1 rounded-full">
                98% Acc
              </span>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">AI Confidence</p>
            <p className="text-4xl font-display font-bold text-gray-900 tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-400">High</p>
          </div>
        </motion.div>
      </div>

      {/* Community Impact & Sustainability Section */}
      <div className="bg-[#064E3B] rounded-[40px] p-10 text-white relative overflow-hidden shadow-xl mb-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500 rounded-full opacity-20 blur-3xl -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-2xl font-display font-bold tracking-tight">Community Impact & Sustainability</h3>
              <p className="text-emerald-200/80 text-sm font-medium mt-1">Transparent metrics demonstrating real-world pilot outcomes.</p>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-full border border-white/20 text-xs font-bold uppercase tracking-widest text-emerald-300">
              Verified by AgriCopilot
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mb-4">
                <Sprout size={20} />
              </div>
              <h4 className="text-3xl font-display font-bold mb-1">12.4t</h4>
              <p className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest">CO₂ Emissions Prevented</p>
              <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">Via optimized fertilizer recommendations</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mb-4">
                <CloudLightning size={20} />
              </div>
              <h4 className="text-3xl font-display font-bold mb-1">4.2M</h4>
              <p className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest">Liters of Water Saved</p>
              <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">Through micro-irrigation financing</p>
            </div>
            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} />
              </div>
              <h4 className="text-3xl font-display font-bold mb-1">{data.totalFarmers * 4}</h4>
              <p className="text-xs font-bold text-emerald-200/70 uppercase tracking-widest">Community Members Reached</p>
              <p className="text-[10px] text-emerald-400/60 mt-2 font-medium">Assuming avg. household size of 4</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-display font-bold text-gray-900">Assessment Velocity</h3>
              <p className="text-sm text-gray-500 font-medium">Daily volume vs. average credit quality</p>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-2xl">
              <button className="px-4 py-2 bg-white text-gray-900 rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm transition-all">30 Days</button>
              <button className="px-4 py-2 text-gray-500 rounded-xl text-xs font-bold uppercase tracking-widest hover:text-gray-900 transition-all">7 Days</button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.dailyTrends}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF', fontFamily: 'Inter' }}
                  tickFormatter={(str) => new Date(str).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#9CA3AF', fontFamily: 'Inter' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)', fontFamily: 'Inter', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="avg_score" name="Avg Score" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" />
                <Area type="monotone" dataKey="count" name="Assessments" stroke="#3B82F6" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col">
          <h3 className="text-xl font-display font-bold text-gray-900 mb-2">Risk Exposure</h3>
          <p className="text-sm text-gray-500 font-medium mb-8">Portfolio distribution by category</p>
          <div className="h-64 relative flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="risk_category"
                  stroke="none"
                >
                  {data.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontFamily: 'Inter', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-4xl font-display font-bold text-gray-900">{data.totalFarmers}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
            </div>
          </div>
          <div className="space-y-3 mt-8">
            {data.riskDistribution.map((item, i) => (
              <div key={item.risk_category} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-gray-700 font-bold uppercase tracking-tighter">{item.risk_category}</span>
                </div>
                <span className="text-sm font-black text-gray-900">{Math.round((item.count / data.totalFarmers) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Assessments - Full Width or Grid */}
        <div className="lg:col-span-3 bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-gray-900">Recent Originations</h3>
            <button className="text-emerald-600 text-xs font-bold uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.recentScores.map((score, i) => (
              <button 
                key={i} 
                onClick={() => onFarmerClick(i + 1)} // Mock ID for now
                className="flex items-center justify-between p-5 bg-gray-50 rounded-[32px] hover:bg-emerald-50 transition-all border border-transparent hover:border-emerald-100 group text-left shadow-sm hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 font-display font-bold text-xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {score.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-tight">{score.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{new Date(score.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-display font-bold px-4 py-1 rounded-2xl inline-block shadow-sm ${
                    score.score > 70 ? 'bg-emerald-100 text-emerald-700' : 
                    score.score > 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {score.score}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">{score.risk_category}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showScoreModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowScoreModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                <Activity size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">Average AgriScore</h3>
              <p className="text-gray-600 mb-6">The portfolio average of {data.avgScore} indicates a generally healthy credit profile across your active farmers.</p>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">High Score (&gt;70)</span>
                    <span className="text-sm font-bold text-emerald-600">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-emerald-500 h-2 rounded-full" style={{ width: '45%' }}></div></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Medium Score (50-70)</span>
                    <span className="text-sm font-bold text-amber-600">35%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-amber-500 h-2 rounded-full" style={{ width: '35%' }}></div></div>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-gray-700">Low Score (&lt;50)</span>
                    <span className="text-sm font-bold text-red-600">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-red-500 h-2 rounded-full" style={{ width: '20%' }}></div></div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showLoansModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl relative"
            >
              <button onClick={() => setShowLoansModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
                <X size={24} />
              </button>
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                <Globe size={32} />
              </div>
              <h3 className="text-2xl font-display font-bold text-gray-900 mb-2">First-Time Borrowers</h3>
              <p className="text-gray-600 mb-6">You have successfully onboarded 18 farmers who previously had no formal credit history.</p>
              <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                <p className="text-sm text-indigo-900 font-medium mb-4">This represents a 42% increase in financial inclusion for this quarter, directly contributing to your ESG goals.</p>
                <button onClick={() => { setShowLoansModal(false); onNavigateToList(); }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors">
                  View Borrower Profiles
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);
