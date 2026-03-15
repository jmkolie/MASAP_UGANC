'use client'
import { useState, useEffect } from 'react'
import { Clock, MapPin, Video } from 'lucide-react'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { getDayName } from '@/lib/utils'
import api from '@/lib/api'
import type { Schedule } from '@/types'

const DAYS = [0, 1, 2, 3, 4] // Monday to Friday
const TYPE_LABELS: Record<string, string> = {
  course: 'Cours', td: 'TD', tp: 'TP', exam: 'Examen', other: 'Autre'
}
const TYPE_COLORS: Record<string, string> = {
  course: 'bg-blue-100 text-blue-800 border-blue-200',
  td: 'bg-green-100 text-green-800 border-green-200',
  tp: 'bg-amber-100 text-amber-800 border-amber-200',
  exam: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-gray-100 text-gray-700 border-gray-200',
}

export default function EmploiDuTempsPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/schedule/my')
        setSchedules(res.data || [])
      } catch { } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  if (loading) return <PageLoader />

  const scheduleByDay = DAYS.reduce((acc, day) => {
    acc[day] = schedules.filter((s) => s.day_of_week === day)
    return acc
  }, {} as Record<number, Schedule[]>)

  const totalClasses = schedules.length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emploi du temps</h1>
        <p className="text-gray-500 text-sm mt-1">{totalClasses} séance(s) planifiée(s) cette semaine</p>
      </div>

      {totalClasses === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
          <EmptyState
            icon={Clock}
            title="Aucune séance planifiée"
            description="Votre emploi du temps apparaîtra ici une fois configuré."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {DAYS.map((day) => {
            const daySessions = scheduleByDay[day]
            return (
              <div key={day} className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-700">{getDayName(day)}</h2>
                </div>
                {daySessions.length === 0 ? (
                  <div className="px-5 py-3 text-sm text-gray-400 italic">Aucune séance ce jour</div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {daySessions
                      .sort((a, b) => a.start_time.localeCompare(b.start_time))
                      .map((s) => (
                        <div key={s.id} className="px-5 py-3 flex items-start gap-4">
                          <div className="flex-shrink-0 text-center min-w-[80px]">
                            <p className="text-sm font-bold text-primary-700">
                              {s.start_time.slice(0, 5)}
                            </p>
                            <p className="text-xs text-gray-400">{s.end_time.slice(0, 5)}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`badge text-xs ${TYPE_COLORS[s.schedule_type]}`}>
                                {TYPE_LABELS[s.schedule_type] || s.schedule_type}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">
                              Module #{s.module_id}
                            </p>
                            <div className="flex items-center gap-3 mt-1">
                              {s.room && (
                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                  <MapPin className="w-3 h-3" />
                                  {s.room}
                                </span>
                              )}
                              {s.meeting_link && (
                                <a
                                  href={s.meeting_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-xs text-primary-600 hover:underline"
                                >
                                  <Video className="w-3 h-3" />
                                  Rejoindre en ligne
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
