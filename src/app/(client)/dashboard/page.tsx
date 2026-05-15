import { Suspense } from 'react'
import DashboardContent from './DashboardContent'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
