'use client'
import { useState, useEffect } from 'react'
import { Save, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Module, GradeComponent } from '@/types'

interface Student {
  id: number
  first_name: string
  last_name: string
  student_profile?: { id: number; student_id: string }
}

interface GradeEntry {
  student_id: number
  score: string
}

export default function SaisieNotesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [components, setComponents] = useState<GradeComponent[]>([])
  const [selectedComponent, setSelectedComponent] = useState<GradeComponent | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [grades, setGrades] = useState<Record<number, string>>({})
  const [academicYearId, setAcademicYearId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const [modRes, yearRes] = await Promise.all([
          api.get('/academic/my-modules'),
          api.get('/academic/academic-years/current'),
        ])
        setModules(modRes.data || [])
        setAcademicYearId(yearRes.data?.id || null)
      } catch {
        toast.error('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchInitial()
  }, [])

  const handleSelectModule = async (module: Module) => {
    setSelectedModule(module)
    setSelectedComponent(null)
    setStudents([])
    setGrades({})
    try {
      const [compRes, studRes] = await Promise.all([
        api.get(`/grades/components/${module.id}`),
        api.get(`/users/students/list?per_page=100`),
      ])
      setComponents(compRes.data || [])
      setStudents(studRes.data.items || [])
    } catch {
      toast.error('Erreur lors du chargement du module')
    }
  }

  const handleSaveGrades = async () => {
    if (!selectedModule || !selectedComponent || !academicYearId) return
    setSaving(true)
    try {
      const gradeEntries = students
        .filter((s) => s.student_profile)
        .map((s) => ({
          student_id: s.student_profile!.id,
          score: grades[s.student_profile!.id] !== undefined
            ? parseFloat(grades[s.student_profile!.id]) || null
            : null,
        }))
        .filter((e) => e.score !== null)

      await api.post('/grades/bulk', {
        module_id: selectedModule.id,
        component_id: selectedComponent.id,
        academic_year_id: academicYearId,
        grades: gradeEntries,
      })
      toast.success('Notes enregistrées avec succès !')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saisie des notes</h1>
        <p className="text-gray-500 text-sm mt-1">Saisissez les notes de vos étudiants par module et composante</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Module selection */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-card">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">1. Sélectionner un module</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {modules.length === 0 ? (
              <EmptyState title="Aucun module" description="Aucun module assigné." />
            ) : (
              modules.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectModule(m)}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                    selectedModule?.id === m.id ? 'bg-primary-50 border-l-2 border-primary-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">{m.name}</p>
                    <p className="text-xs text-gray-400">{m.code}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Component selection + grade entry */}
        <div className="lg:col-span-2 space-y-4">
          {selectedModule ? (
            <>
              {/* Component picker */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">2. Sélectionner une composante</p>
                <div className="flex flex-wrap gap-2">
                  {components.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedComponent(c)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                        selectedComponent?.id === c.id
                          ? 'bg-primary-700 text-white border-primary-700'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      {c.name} ({c.weight}%)
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade table */}
              {selectedComponent && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-card">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Notes — {selectedComponent.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {students.filter(s => s.student_profile).length} étudiant(s) — Note sur 20
                      </p>
                    </div>
                    <button
                      onClick={handleSaveGrades}
                      disabled={saving}
                      className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Sauvegarde...' : 'Enregistrer'}
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-96">
                    <table className="w-full">
                      <thead className="border-b border-gray-100">
                        <tr>
                          <th className="table-header">Matricule</th>
                          <th className="table-header">Étudiant</th>
                          <th className="table-header text-right">Note /20</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {students
                          .filter((s) => s.student_profile)
                          .map((s) => {
                            const pid = s.student_profile!.id
                            const gradeVal = grades[pid] ?? ''
                            return (
                              <tr key={s.id} className="hover:bg-gray-50">
                                <td className="table-cell text-gray-400 font-mono text-xs">
                                  {s.student_profile?.student_id}
                                </td>
                                <td className="table-cell font-medium text-gray-800">
                                  {s.first_name} {s.last_name}
                                </td>
                                <td className="table-cell">
                                  <div className="flex justify-end">
                                    <input
                                      type="number"
                                      min="0"
                                      max="20"
                                      step="0.25"
                                      value={gradeVal}
                                      onChange={(e) =>
                                        setGrades((prev) => ({ ...prev, [pid]: e.target.value }))
                                      }
                                      placeholder="—"
                                      className="w-20 text-right px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                  </div>
                                </td>
                              </tr>
                            )
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card py-16">
              <EmptyState
                title="Sélectionnez un module"
                description="Cliquez sur un module dans la liste de gauche pour commencer la saisie des notes."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
