import { useNavigate } from 'react-router-dom'
import { Sparkles, ChevronRight, CheckCircle2, TrendingUp } from 'lucide-react'

export default function Welcome() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -mr-32 -mt-32" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full -ml-24 -mb-24" />

      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative z-10">
        <div className="mb-0">
          <Sparkles className="text-gold mb-6 mx-auto animate-pulse" size={48} />
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            S & See <br />
            <span className="text-gold-dark font-normal italic">Signature Salon</span>
          </h1>
          <p className="text-gray-500 max-w-xs mx-auto leading-relaxed mb-12">
            Experience the future of beauty with our proprietary AI-driven consultation system.
          </p>
        </div>

        <div className="w-full max-w-xs space-y-4">
          <button
            className="btn btn-primary shadow-xl hover:shadow-gold/20 flex items-center justify-center gap-3 py-5 text-lg"
            onClick={() => navigate('/register')}
          >
            Start Consultation
            <ChevronRight size={20} />
          </button>

          <button
            className="btn btn-outline border-gray-200 text-gray-500 hover:border-gold hover:text-gold-dark"
            onClick={() => navigate('/dashboard')}
          >
            Manager Login
          </button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 w-full max-w-sm">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
              <CheckCircle2 size={18} className="text-gold" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Precision</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
              <Sparkles size={18} className="text-gold" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Personalized</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
              <TrendingUp size={18} className="text-gold" />
            </div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Results</span>
          </div>
        </div>
      </div>

      <div className="p-8 text-center border-t border-gray-100">
        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.1em]">
          Powered by signature intelligence v2.0
        </p>
      </div>
    </div>
  )
}
