import Link from 'next/link'
import { GraduationCap, BookOpen, Users, Award, ChevronRight, Mail, MapPin, Phone, TrendingUp } from 'lucide-react'

const UGANC_LOGO = 'https://uganc.edu.gn/wp-content/uploads/2022/11/LOGO-UGANC-SITE-WEB.png'

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">

      {/* Bande supérieure */}
      <div className="bg-[#3d0f1c] text-white text-xs py-1.5 px-4 hidden sm:block">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>Université Gamal Abdel Nasser de Conakry — FSTS</span>
          <a href="https://uganc.edu.gn" target="_blank" rel="noopener noreferrer" className="hover:text-[#de5634] transition-colors">
            uganc.edu.gn
          </a>
        </div>
      </div>

      {/* Navbar */}
      <header className="bg-[#531628] shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={UGANC_LOGO}
              alt="UGANC"
              className="h-12 w-auto object-contain"
            />
            <div className="border-l border-white/20 pl-4">
              <p className="text-white font-bold text-sm leading-tight">MASAP-UGANC</p>
              <p className="text-red-200 text-xs leading-tight">Master en Santé Publique</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-red-200">
            <a href="#programme" className="hover:text-white transition-colors">Le programme</a>
            <a href="#chiffres" className="hover:text-white transition-colors">Chiffres clés</a>
            <a href="#acces" className="hover:text-white transition-colors">Accès</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <Link
            href="/login"
            className="bg-[#de5634] hover:bg-[#c44a2a] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Se connecter
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#531628] via-[#6b1f33] to-[#3d0f1c] text-white py-24 px-4 relative overflow-hidden">
        {/* Motif décoratif */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 right-20 w-64 h-64 rounded-full border-4 border-white" />
          <div className="absolute bottom-10 left-20 w-40 h-40 rounded-full border-2 border-white" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-white" />
        </div>

        <div className="max-w-5xl mx-auto relative">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <p className="text-[#de5634] font-semibold text-sm uppercase tracking-widest mb-3">
                Faculté des Sciences et Techniques de la Santé
              </p>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Master en <span className="text-[#de5634]">Santé Publique</span>
              </h1>
              <p className="text-red-200 text-lg mb-2">
                Formation d'excellence pour les professionnels de santé
              </p>
              <p className="text-red-300 text-sm mb-8">
                Université Gamal Abdel Nasser de Conakry — République de Guinée
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 bg-[#de5634] hover:bg-[#c44a2a] text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150"
                >
                  Accéder à mon espace
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <a
                  href="#programme"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-150 border border-white/20"
                >
                  Découvrir le programme
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <img
                  src={UGANC_LOGO}
                  alt="UGANC"
                  className="w-48 h-auto object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chiffres clés */}
      <section id="chiffres" className="bg-[#de5634] py-10 px-4">
        <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
          <div>
            <p className="text-4xl font-bold">500+</p>
            <p className="text-sm opacity-90 mt-1">Étudiants formés</p>
          </div>
          <div>
            <p className="text-4xl font-bold">30+</p>
            <p className="text-sm opacity-90 mt-1">Enseignants</p>
          </div>
          <div>
            <p className="text-4xl font-bold">12</p>
            <p className="text-sm opacity-90 mt-1">Modules</p>
          </div>
          <div>
            <p className="text-4xl font-bold">2 ans</p>
            <p className="text-sm opacity-90 mt-1">Durée du cursus</p>
          </div>
        </div>
      </section>

      {/* Programme */}
      <section id="programme" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#de5634] font-semibold text-xs uppercase tracking-widest mb-2">Notre formation</p>
            <h2 className="text-3xl font-bold text-[#531628] mb-3">Le programme MASAP</h2>
            <div className="w-12 h-1 bg-[#de5634] mx-auto rounded" />
            <p className="text-gray-500 mt-4 text-sm max-w-xl mx-auto">
              Une formation d'excellence en santé publique, adaptée aux défis sanitaires de l'Afrique de l'Ouest
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: 'Enseignement de qualité',
                desc: "Épidémiologie, biostatistique, gestion des systèmes de santé, santé communautaire et bien plus encore.",
                color: 'bg-red-50 text-[#531628]',
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: 'Corps professoral expérimenté',
                desc: "Enseignants-chercheurs et professionnels de santé reconnus, engagés dans la formation des futurs experts.",
                color: 'bg-orange-50 text-[#de5634]',
              },
              {
                icon: <Award className="w-6 h-6" />,
                title: 'Diplôme reconnu',
                desc: "Master délivré par l'UGANC, reconnu nationalement et dans la sous-région ouest-africaine.",
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: <GraduationCap className="w-6 h-6" />,
                title: 'Insertion professionnelle',
                desc: "Nos diplômés occupent des postes clés dans les ministères, ONG et organisations internationales de santé.",
                color: 'bg-red-50 text-[#531628]',
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Recherche appliquée',
                desc: "Travaux pratiques de terrain et mémoires de recherche encadrés par des experts reconnus.",
                color: 'bg-orange-50 text-[#de5634]',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-6 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-150">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}

            {/* Card portail */}
            <div className="bg-[#531628] rounded-xl p-6 text-white">
              <h3 className="font-semibold mb-2">Portail numérique intégré</h3>
              <p className="text-sm text-red-200 mb-4">
                Consultez vos modules, notes, emploi du temps et documents — en ligne, à tout moment.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#de5634] hover:text-orange-300 transition-colors"
              >
                Accéder au portail <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Accès */}
      <section id="acces" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#de5634] font-semibold text-xs uppercase tracking-widest mb-2">Espace en ligne</p>
            <h2 className="text-3xl font-bold text-[#531628] mb-3">Accès au portail</h2>
            <div className="w-12 h-1 bg-[#de5634] mx-auto rounded" />
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                icon: <GraduationCap className="w-8 h-8 text-[#531628]" />,
                role: 'Étudiant',
                desc: 'Consultez vos notes, modules, emploi du temps et soumettez vos devoirs.',
                bg: 'bg-red-50',
              },
              {
                icon: <BookOpen className="w-8 h-8 text-[#de5634]" />,
                role: 'Enseignant',
                desc: 'Gérez vos modules, publiez des ressources et saisissez les évaluations.',
                bg: 'bg-orange-50',
              },
              {
                icon: <Users className="w-8 h-8 text-gray-600" />,
                role: 'Administration',
                desc: 'Administrez les promotions, inscriptions, utilisateurs et paramètres.',
                bg: 'bg-gray-100',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-card p-6 text-center hover:shadow-card-hover transition-shadow">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${item.bg}`}>
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{item.role}</h3>
                <p className="text-xs text-gray-500 mb-4">{item.desc}</p>
                <Link href="/login" className="text-sm text-[#531628] hover:text-[#de5634] font-semibold transition-colors">
                  Se connecter &rarr;
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#de5634] font-semibold text-xs uppercase tracking-widest mb-2">Nous contacter</p>
            <h2 className="text-3xl font-bold text-[#531628] mb-3">Contact</h2>
            <div className="w-12 h-1 bg-[#de5634] mx-auto rounded" />
          </div>
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: <MapPin className="w-5 h-5 text-[#531628]" />, label: 'Adresse', value: 'Conakry, République de Guinée' },
              { icon: <Mail className="w-5 h-5 text-[#531628]" />, label: 'Email', value: 'masap@uganc.edu.gn' },
              { icon: <Phone className="w-5 h-5 text-[#531628]" />, label: 'Téléphone', value: '+224 000 000 000' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  {item.icon}
                </div>
                <p className="font-semibold text-gray-700 text-sm">{item.label}</p>
                <p className="text-xs text-gray-500">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#531628] text-red-200 py-10 px-4 mt-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <img src={UGANC_LOGO} alt="UGANC" className="h-12 w-auto object-contain opacity-80" />
              <div>
                <p className="text-white font-bold text-sm">MASAP-UGANC</p>
                <p className="text-red-300 text-xs">Faculté des Sciences et Techniques de la Santé</p>
                <p className="text-red-300 text-xs">Université Gamal Abdel Nasser de Conakry</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#programme" className="hover:text-white transition-colors">Programme</a>
              <a href="#acces" className="hover:text-white transition-colors">Accès</a>
              <a href="#contact" className="hover:text-white transition-colors">Contact</a>
              <Link href="/login" className="text-[#de5634] hover:text-orange-300 font-semibold transition-colors">Se connecter</Link>
            </div>
          </div>
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-red-300">
            <span>© 2025 MASAP-UGANC — Tous droits réservés</span>
            <a href="https://uganc.edu.gn" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              uganc.edu.gn
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
