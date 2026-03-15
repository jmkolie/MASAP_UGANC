'use client'
import { useState, useEffect } from 'react'
import { Plus, BookOpen, ChevronRight, Layers, Users, Tag, X, Edit2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { PageLoader } from '@/components/ui/LoadingSpinner'
import { EmptyState } from '@/components/ui/EmptyState'
import api from '@/lib/api'
import type { Program, Department } from '@/types'

const degreeLabels: Record<string, string> = {
  licence: 'Licence', master: 'Master', doctorat: 'Doctorat', dut: 'DUT', bts: 'BTS',
}

interface Module {
  id: number
  name: string
  code: string
  credits: number
  coefficient: number
  specialty: string | null
  is_active: boolean
}

interface Student {
  id: number
  first_name: string
  last_name: string
  student_profile?: { student_id: string; specialty: string | null }
}

const SPECIALTY_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-teal-100 text-teal-700 border-teal-200',
]

function specialtyColor(specialty: string, list: string[]) {
  const idx = list.indexOf(specialty)
  return SPECIALTY_COLORS[idx % SPECIALTY_COLORS.length] || SPECIALTY_COLORS[0]
}

export default function ProgrammesPage() {
  const [programs, setPrograms] = useState<Program[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Program | null>(null)
  const [modules, setModules] = useState<Module[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [activeTab, setActiveTab] = useState<'modules' | 'students'>('modules')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', department_id: '', degree_type: 'master', duration_years: '2', level: '', description: '' })

  // Module specialty edit
  const [editModuleSpecialty, setEditModuleSpecialty] = useState<number | null>(null)
  const [moduleSpecialtyInput, setModuleSpecialtyInput] = useState('')

  // Student specialty assign
  const [assigningStudent, setAssigningStudent] = useState<number | null>(null)
  const [studentSpecialtyInput, setStudentSpecialtyInput] = useState('')

  useEffect(() => {
    Promise.all([api.get('/academic/programs'), api.get('/academic/departments')])
      .then(([pRes, dRes]) => { setPrograms(pRes.data); setDepartments(dRes.data) })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [])

  const loadProgramDetail = async (prog: Program) => {
    setSelected(prog)
    setLoadingDetail(true)
    setModules([])
    setSpecialties([])
    setStudents([])
    setActiveTab('modules')
    try {
      const [modRes, specRes, studRes] = await Promise.all([
        api.get(`/academic/programs/${prog.id}/modules`),
        api.get(`/academic/programs/${prog.id}/specialties`),
        api.get(`/academic/programs/${prog.id}/students`),
      ])
      setModules(modRes.data || [])
      setSpecialties(specRes.data || [])
      setStudents(studRes.data || [])
    } catch { toast.error('Erreur de chargement du détail') }
    finally { setLoadingDetail(false) }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/academic/programs', {
        ...form,
        department_id: parseInt(form.department_id),
        duration_years: parseInt(form.duration_years),
        level: form.level ? parseInt(form.level) : null,
        is_active: true,
      })
      toast.success('Programme créé !')
      setShowForm(false)
      const res = await api.get('/academic/programs')
      setPrograms(res.data)
    } catch (err: any) { toast.error(err?.response?.data?.detail || 'Erreur') }
  }

  const handleSaveModuleSpecialty = async (moduleId: number) => {
    try {
      await api.put(`/academic/modules/${moduleId}`, { specialty: moduleSpecialtyInput || null })
      toast.success('Spécialité mise à jour')
      setEditModuleSpecialty(null)
      // reload modules & specialties
      const [modRes, specRes] = await Promise.all([
        api.get(`/academic/programs/${selected!.id}/modules`),
        api.get(`/academic/programs/${selected!.id}/specialties`),
      ])
      setModules(modRes.data || [])
      setSpecialties(specRes.data || [])
    } catch { toast.error('Erreur') }
  }

  const handleAssignSpecialty = async (studentId: number) => {
    try {
      await api.patch(`/academic/students/${studentId}/specialty`, { specialty: studentSpecialtyInput || null })
      toast.success('Spécialité assignée')
      setAssigningStudent(null)
      const studRes = await api.get(`/academic/programs/${selected!.id}/students`)
      setStudents(studRes.data || [])
    } catch { toast.error('Erreur') }
  }

  // Group modules by specialty
  const tronc = modules.filter(m => !m.specialty)
  const grouped = specialties.reduce<Record<string, Module[]>>((acc, sp) => {
    acc[sp] = modules.filter(m => m.specialty === sp)
    return acc
  }, {})

  if (loading) return <PageLoader />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programmes</h1>
          <p className="text-gray-500 text-sm mt-0.5">{programs.length} programme(s)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" />Nouveau programme
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-700">Nouveau programme</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="form-label">Nom</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
            <div><label className="form-label">Code</label><input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required /></div>
            <div>
              <label className="form-label">Département</label>
              <select className="form-input" value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} required>
                <option value="">Sélectionner...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Type de diplôme</label>
              <select className="form-input" value={form.degree_type} onChange={e => setForm({...form, degree_type: e.target.value})}>
                {Object.entries(degreeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div><label className="form-label">Durée (années)</label><input type="number" min="1" max="8" className="form-input" value={form.duration_years} onChange={e => setForm({...form, duration_years: e.target.value})} /></div>
            <div>
              <label className="form-label">Niveau</label>
              <select className="form-input" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                <option value="">Non défini</option>
                <option value="1">Master 1</option>
                <option value="2">Master 2 (avec spécialités)</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Créer</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Annuler</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Programme list */}
        <div className="space-y-2">
          {programs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card py-10">
              <EmptyState icon={BookOpen} title="Aucun programme" />
            </div>
          ) : programs.map(p => {
            const dept = departments.find(d => d.id === p.department_id)
            const isSelected = selected?.id === p.id
            return (
              <button
                key={p.id}
                onClick={() => loadProgramDetail(p)}
                className={`w-full text-left p-4 rounded-xl border shadow-card transition-all ${isSelected ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-amber-700" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight">{p.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{p.code}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? 'text-primary-600 rotate-90' : 'text-gray-300'}`} />
                </div>
                <div className="flex items-center gap-2 flex-wrap mt-2 pl-10">
                  <span className="badge bg-blue-100 text-blue-700 border-blue-200">{degreeLabels[p.degree_type]}</span>
                  {(p as any).level === 2 && <span className="badge bg-purple-100 text-purple-700 border-purple-200">M2 — Spécialités</span>}
                  {(p as any).level === 1 && <span className="badge bg-indigo-100 text-indigo-700 border-indigo-200">M1</span>}
                  {dept && <span className="text-xs text-gray-400">{dept.name}</span>}
                </div>
              </button>
            )
          })}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card flex items-center justify-center h-64 text-gray-400">
              <div className="text-center">
                <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Sélectionnez un programme</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{selected.name}</h2>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{selected.code}</p>
                    {selected.description && <p className="text-xs text-gray-500 mt-1">{selected.description}</p>}
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="badge bg-blue-100 text-blue-700 border-blue-200">{degreeLabels[selected.degree_type]}</span>
                    {(selected as any).level === 2 && <span className="badge bg-purple-100 text-purple-700 border-purple-200">Master 2</span>}
                    {(selected as any).level === 1 && <span className="badge bg-indigo-100 text-indigo-700 border-indigo-200">Master 1</span>}
                  </div>
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5" />{modules.length} cours</span>
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{students.length} étudiant(s)</span>
                  {specialties.length > 0 && <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{specialties.length} spécialité(s)</span>}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setActiveTab('modules')}
                  className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'modules' ? 'text-primary-700 border-b-2 border-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Cours
                </button>
                {(selected as any).level === 2 && (
                  <button
                    onClick={() => setActiveTab('students')}
                    className={`px-5 py-3 text-sm font-medium transition-colors ${activeTab === 'students' ? 'text-primary-700 border-b-2 border-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Orientation des étudiants
                  </button>
                )}
              </div>

              {loadingDetail ? (
                <div className="py-16 text-center text-sm text-gray-400">Chargement...</div>
              ) : activeTab === 'modules' ? (
                <div className="p-4 space-y-4">
                  {modules.length === 0 ? (
                    <EmptyState icon={Layers} title="Aucun cours pour ce programme" />
                  ) : (
                    <>
                      {/* Tronc commun */}
                      {tronc.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tronc commun</p>
                          <ModuleTable modules={tronc} specialties={specialties} onEditSpecialty={(id, current) => { setEditModuleSpecialty(id); setModuleSpecialtyInput(current || '') }} editModuleSpecialty={editModuleSpecialty} moduleSpecialtyInput={moduleSpecialtyInput} setModuleSpecialtyInput={setModuleSpecialtyInput} onSave={handleSaveModuleSpecialty} onCancel={() => setEditModuleSpecialty(null)} />
                        </div>
                      )}
                      {/* Par spécialité */}
                      {specialties.map(sp => (
                        <div key={sp}>
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${specialtyColor(sp, specialties)}`}>
                            <Tag className="w-3 h-3" />{sp}
                          </p>
                          <ModuleTable modules={grouped[sp] || []} specialties={specialties} onEditSpecialty={(id, current) => { setEditModuleSpecialty(id); setModuleSpecialtyInput(current || '') }} editModuleSpecialty={editModuleSpecialty} moduleSpecialtyInput={moduleSpecialtyInput} setModuleSpecialtyInput={setModuleSpecialtyInput} onSave={handleSaveModuleSpecialty} onCancel={() => setEditModuleSpecialty(null)} />
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : (
                /* Orientation des étudiants (Master 2) */
                <div className="p-4">
                  {students.length === 0 ? (
                    <EmptyState icon={Users} title="Aucun étudiant dans ce programme" />
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500 mb-3">
                        Assignez une spécialité à chaque étudiant de Master 2.
                        {specialties.length > 0 && <> Spécialités disponibles : {specialties.map(s => <span key={s} className={`ml-1 badge text-xs ${specialtyColor(s, specialties)}`}>{s}</span>)}</>}
                      </p>
                      {students.map(st => {
                        const sp = st.student_profile?.specialty
                        const isAssigning = assigningStudent === st.id
                        return (
                          <div key={st.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold">
                                {st.first_name[0]}{st.last_name[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-800">{st.first_name} {st.last_name}</p>
                                <p className="text-xs text-gray-400 font-mono">{st.student_profile?.student_id}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isAssigning ? (
                                <>
                                  <input
                                    list={`sp-list-${st.id}`}
                                    value={studentSpecialtyInput}
                                    onChange={e => setStudentSpecialtyInput(e.target.value)}
                                    placeholder="Spécialité..."
                                    className="form-input text-xs py-1 px-2 w-40"
                                  />
                                  <datalist id={`sp-list-${st.id}`}>
                                    {specialties.map(s => <option key={s} value={s} />)}
                                  </datalist>
                                  <button onClick={() => handleAssignSpecialty(st.id)} className="p-1.5 rounded text-green-600 hover:bg-green-50">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setAssigningStudent(null)} className="p-1.5 rounded text-gray-400 hover:bg-gray-100">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  {sp ? (
                                    <span className={`badge text-xs ${specialtyColor(sp, specialties)}`}>{sp}</span>
                                  ) : (
                                    <span className="text-xs text-gray-400 italic">Non orienté</span>
                                  )}
                                  <button
                                    onClick={() => { setAssigningStudent(st.id); setStudentSpecialtyInput(sp || '') }}
                                    className="p-1.5 rounded text-blue-500 hover:bg-blue-50"
                                    title="Assigner une spécialité"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ModuleTable({ modules, specialties, onEditSpecialty, editModuleSpecialty, moduleSpecialtyInput, setModuleSpecialtyInput, onSave, onCancel }: {
  modules: Module[]
  specialties: string[]
  onEditSpecialty: (id: number, current: string | null) => void
  editModuleSpecialty: number | null
  moduleSpecialtyInput: string
  setModuleSpecialtyInput: (v: string) => void
  onSave: (id: number) => void
  onCancel: () => void
}) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="table-header">Cours</th>
          <th className="table-header text-center">Crédits</th>
          <th className="table-header text-center">Coef.</th>
          <th className="table-header">Spécialité</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {modules.map(m => (
          <tr key={m.id} className="hover:bg-gray-50">
            <td className="table-cell">
              <p className="font-medium text-gray-800">{m.name}</p>
              <p className="text-xs text-gray-400 font-mono">{m.code}</p>
            </td>
            <td className="table-cell text-center text-gray-500">{m.credits}</td>
            <td className="table-cell text-center text-gray-500">{m.coefficient}</td>
            <td className="table-cell">
              {editModuleSpecialty === m.id ? (
                <div className="flex items-center gap-1">
                  <input
                    list="sp-options"
                    value={moduleSpecialtyInput}
                    onChange={e => setModuleSpecialtyInput(e.target.value)}
                    placeholder="Spécialité (vide = tronc commun)"
                    className="form-input text-xs py-1 px-2 w-44"
                    autoFocus
                  />
                  <datalist id="sp-options">
                    {specialties.map(s => <option key={s} value={s} />)}
                  </datalist>
                  <button onClick={() => onSave(m.id)} className="p-1 rounded text-green-600 hover:bg-green-50"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={onCancel} className="p-1 rounded text-gray-400 hover:bg-gray-100"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  {m.specialty ? (
                    <span className={`badge text-xs ${specialtyColor(m.specialty, specialties)}`}>{m.specialty}</span>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                  <button onClick={() => onEditSpecialty(m.id, m.specialty)} className="p-1 rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
