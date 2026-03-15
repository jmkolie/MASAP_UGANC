'use client'
import { useState } from 'react'
import { Save, Shield, Bell, Database, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ParametresPage() {
  const [saving, setSaving] = useState(false)
  const [general, setGeneral] = useState({
    university_name: 'Université Gamal Abdel Nasser de Conakry',
    university_short: 'UGANC',
    program_name: 'Master en Santé Publique',
    contact_email: 'masap@uganc.edu.gn',
    academic_year: '2024-2025',
  })
  const [notifs, setNotifs] = useState({
    email_on_grade: true,
    email_on_announcement: true,
    email_on_document: false,
  })

  const handleSave = async (section: string) => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 800))
    setSaving(false)
    toast.success(`Paramètres ${section} sauvegardés`)
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configuration générale du portail</p>
      </div>

      {/* General */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-4 h-4 text-primary-600" />
          <h3 className="text-sm font-semibold text-gray-700">Général</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nom de l'université</label>
            <input className="form-input" value={general.university_name} onChange={e => setGeneral({...general, university_name: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Sigle</label>
            <input className="form-input" value={general.university_short} onChange={e => setGeneral({...general, university_short: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Nom du programme</label>
            <input className="form-input" value={general.program_name} onChange={e => setGeneral({...general, program_name: e.target.value})} />
          </div>
          <div>
            <label className="form-label">Email de contact</label>
            <input type="email" className="form-input" value={general.contact_email} onChange={e => setGeneral({...general, contact_email: e.target.value})} />
          </div>
        </div>
        <button onClick={() => handleSave('généraux')} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-700">Notifications email</h3>
        </div>
        <div className="space-y-3">
          {[
            { key: 'email_on_grade', label: 'Notifier les étudiants lors de la publication des notes' },
            { key: 'email_on_announcement', label: 'Notifier lors d\'une nouvelle annonce' },
            { key: 'email_on_document', label: 'Notifier lors du dépôt d\'un document de cours' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={notifs[key as keyof typeof notifs]}
                onChange={e => setNotifs({...notifs, [key]: e.target.checked})}
                className="w-4 h-4 rounded text-primary-600"
              />
              {label}
            </label>
          ))}
        </div>
        <button onClick={() => handleSave('de notification')} disabled={saving} className="btn-primary flex items-center gap-2">
          <Save className="w-4 h-4" />{saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-green-600" />
          <h3 className="text-sm font-semibold text-gray-700">Sécurité</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span>Durée de session</span>
            <span className="font-medium text-gray-800">8 heures</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span>Tentatives de connexion max</span>
            <span className="font-medium text-gray-800">5</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Algorithme JWT</span>
            <span className="font-mono text-xs font-medium text-gray-800">HS256</span>
          </div>
        </div>
      </div>

      {/* Database info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-700">Base de données</h3>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span>Type</span>
            <span className="font-medium text-gray-800">PostgreSQL 15</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span>ORM</span>
            <span className="font-medium text-gray-800">SQLAlchemy 2.0</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Migrations</span>
            <span className="font-medium text-gray-800">Alembic</span>
          </div>
        </div>
      </div>
    </div>
  )
}
