import Link from 'next/link'
import { GraduationCap, BookOpen, Users, Award, ChevronRight, Mail, MapPin, Phone } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navbar */}
      <header className="bg-primary-900 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="FSTS-UGANC" className="w-10 h-10 object-contain" />
            <div>
              <p className="text-white font-bold text-sm leading-tight">MASAP-UGANC</p>
              <p className="text-blue-300 text-xs leading-tight">FSTS — Université Gamal Abdel Nasser</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-blue-200">
            <a href="#programme" className="hover:text-white transition-colors">Le programme</a>
            <a href="#acces" className="hover:text-white transition-colors">Accès</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <Link
            href="/login"
            className="bg-university-gold hover:bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-primary-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <img src="/logo.png" alt="FSTS-UGANC" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Master en Santé Publique
          </h1>
          <p className="text-xl text-blue-200 mb-2">
            Faculté des Sciences et Techniques de la Santé
          </p>
          <p className="text-blue-300 mb-8">
            Université Gamal Abdel Nasser de Conakry
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-university-gold hover:bg-amber-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
            >
              Accéder à mon espace
              <ChevronRight className="w-4 h-4" />
            </Link>
            <a
              href="#programme"
              className="inline-flex items-center gap-2 bg-primary-700 hover:bg-primary-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
            >
              Découvrir le programme
            </a>
          </div>
        </div>
      </section>

      {/* Statistiques */}
      <section className="bg-university-gold py-8 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          <div>
            <p className="text-3xl font-bold">500+</p>
            <p className="text-sm opacity-90 mt-1">Étudiants formés</p>
          </div>
          <div>
            <p className="text-3xl font-bold">30+</p>
            <p className="text-sm opacity-90 mt-1">Enseignants</p>
          </div>
          <div>
            <p className="text-3xl font-bold">12</p>
            <p className="text-sm opacity-90 mt-1">Modules</p>
          </div>
          <div>
            <p className="text-3xl font-bold">2ans</p>
            <p className="text-sm opacity-90 mt-1">Durée du cursus</p>
          </div>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-primary-900 text-center mb-2">Le programme MASAP</h2>
          <p className="text-gray-500 text-center mb-10 text-sm">
            Une formation d'excellence en santé publique adaptée aux enjeux africains
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-700" />
              </div>
              <h3 className="font-semibold text-gray-800">Enseignement de qualité</h3>
              <p className="text-sm text-gray-500">
                Des modules couvrant l'épidémiologie, la biostatistique, la gestion des systèmes de santé et plus encore.
              </p>
            </div>
            <div className="card flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-university-gold" />
              </div>
              <h3 className="font-semibold text-gray-800">Corps professoral expérimenté</h3>
              <p className="text-sm text-gray-500">
                Des enseignants-chercheurs et professionnels de santé reconnus, engagés dans la formation des futurs experts.
              </p>
            </div>
            <div className="card flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Diplôme reconnu</h3>
              <p className="text-sm text-gray-500">
                Un master délivré par l'UGANC, reconnu au niveau national et dans la sous-région ouest-africaine.
              </p>
            </div>
            <div className="card flex flex-col gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Insertion professionnelle</h3>
              <p className="text-sm text-gray-500">
                Nos diplômés occupent des postes clés dans les ministères, ONG, et organisations internationales de santé.
              </p>
            </div>
            <div className="card flex flex-col gap-3 sm:col-span-2 lg:col-span-2">
              <h3 className="font-semibold text-gray-800">Portail numérique intégré</h3>
              <p className="text-sm text-gray-500">
                MASAP-UGANC dispose d'un portail en ligne permettant aux étudiants de consulter leurs modules, notes, emploi du temps et documents. Les enseignants gèrent leurs cours et évaluations directement depuis la plateforme.
              </p>
              <Link
                href="/login"
                className="self-start inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-900"
              >
                Accéder au portail <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Accès rapide */}
      <section id="acces" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-primary-900 text-center mb-2">Accès au portail</h2>
          <p className="text-gray-500 text-center mb-10 text-sm">
            Chaque acteur dispose d'un espace dédié sur la plateforme
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 text-center hover:shadow-card-hover transition-shadow">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-7 h-7 text-primary-700" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Étudiant</h3>
              <p className="text-xs text-gray-500 mb-4">
                Consultez vos notes, modules, emploi du temps et soumettez vos devoirs.
              </p>
              <Link href="/login" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Se connecter &rarr;
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 text-center hover:shadow-card-hover transition-shadow">
              <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-7 h-7 text-university-gold" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Enseignant</h3>
              <p className="text-xs text-gray-500 mb-4">
                Gérez vos modules, publiez des ressources et saisissez les évaluations.
              </p>
              <Link href="/login" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Se connecter &rarr;
              </Link>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6 text-center hover:shadow-card-hover transition-shadow">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-gray-600" />
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">Administration</h3>
              <p className="text-xs text-gray-500 mb-4">
                Administrez les promotions, inscriptions, utilisateurs et paramètres.
              </p>
              <Link href="/login" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Se connecter &rarr;
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-primary-900 text-center mb-2">Contact</h2>
          <p className="text-gray-500 text-center mb-10 text-sm">
            Pour toute question relative au programme ou au portail
          </p>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary-700" />
              </div>
              <p className="font-medium text-gray-700 text-sm">Adresse</p>
              <p className="text-xs text-gray-500">Conakry, République de Guinée</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary-700" />
              </div>
              <p className="font-medium text-gray-700 text-sm">Email</p>
              <p className="text-xs text-gray-500">masap@uganc.edu.gn</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <Phone className="w-5 h-5 text-primary-700" />
              </div>
              <p className="font-medium text-gray-700 text-sm">Téléphone</p>
              <p className="text-xs text-gray-500">+224 000 000 000</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-blue-200 py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="FSTS-UGANC" className="w-7 h-7 object-contain opacity-80" />
            <span>MASAP-UGANC — Faculté des Sciences et Techniques de la Santé</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Se connecter</Link>
            <Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link>
            <span className="text-blue-400">© 2025 MASAP-UGANC</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
