export type Role = 'super_admin' | 'dept_head' | 'teacher' | 'student' | 'scolarite'
export type EnrollmentStatus = 'active' | 'suspended' | 'graduated' | 'abandoned'
export type DegreeType = 'licence' | 'master' | 'doctorat' | 'dut' | 'bts'
export type ComponentType = 'cc' | 'exam' | 'rattrapage' | 'tp' | 'project' | 'oral'
export type ThesisStatus = 'proposed' | 'approved' | 'in_progress' | 'submitted' | 'defended' | 'completed'
export type AudienceType = 'all' | 'students' | 'teachers' | 'program' | 'module' | 'cohort'
export type ScheduleType = 'course' | 'td' | 'tp' | 'exam' | 'other'

export interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: Role
  is_active: boolean
  is_verified: boolean
  profile_picture?: string
  created_at: string
  last_login?: string
  student_profile?: StudentProfile
  teacher_profile?: TeacherProfile
}

export interface StudentProfile {
  id: number
  student_id: string
  date_of_birth?: string
  nationality?: string
  address?: string
  enrollment_status: EnrollmentStatus
  program_id?: number
  cohort_id?: number
  academic_year_id?: number
  promotion_year?: number
}

export interface TeacherProfile {
  id: number
  teacher_id: string
  specialization?: string
  grade?: string
  office?: string
  hire_date?: string
  department_id?: number
}

export interface Faculty {
  id: number
  name: string
  code: string
  description?: string
  created_at: string
}

export interface Department {
  id: number
  name: string
  code: string
  faculty_id: number
  head_id?: number
  description?: string
  created_at: string
}

export interface Program {
  id: number
  name: string
  code: string
  department_id: number
  degree_type: DegreeType
  duration_years: number
  description?: string
  is_active: boolean
  created_at: string
}

export interface AcademicYear {
  id: number
  name: string
  start_date: string
  end_date: string
  is_current: boolean
  created_at: string
}

export interface Semester {
  id: number
  name: string
  academic_year_id: number
  number: number
  start_date?: string
  end_date?: string
  is_active: boolean
}

export interface Cohort {
  id: number
  name: string
  program_id: number
  academic_year_id: number
  max_students: number
  current_students?: number
  description?: string
  created_at: string
}

export interface Module {
  id: number
  name: string
  code: string
  description?: string
  credits: number
  coefficient: number
  semester_id?: number
  program_id?: number
  is_active: boolean
  created_at: string
}

export interface GradeComponent {
  id: number
  module_id: number
  name: string
  weight: number
  component_type: ComponentType
  created_at: string
}

export interface Grade {
  id: number
  student_id: number
  module_id: number
  component_id: number
  score?: number
  max_score: number
  is_validated: boolean
  academic_year_id: number
  semester_id?: number
  created_at: string
}

export interface ModuleResult {
  id: number
  student_id: number
  module_id: number
  academic_year_id: number
  average?: number
  is_validated: boolean
  is_passed?: boolean
  credits_earned: number
  created_at: string
}

export interface Announcement {
  id: number
  title: string
  content: string
  author_id: number
  audience: AudienceType
  program_id?: number
  module_id?: number
  cohort_id?: number
  is_pinned: boolean
  is_published: boolean
  published_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

export interface CourseDocument {
  id: number
  title: string
  description?: string
  file_path: string
  file_size?: number
  file_type?: string
  module_id: number
  uploaded_by: number
  document_type: string
  is_visible: boolean
  created_at: string
}

export interface Schedule {
  id: number
  module_id: number
  teacher_id: number
  cohort_id: number
  academic_year_id: number
  day_of_week: number
  start_time: string
  end_time: string
  room?: string
  meeting_link?: string
  schedule_type: ScheduleType
  day_name?: string
  created_at: string
}

export interface Message {
  id: number
  sender_id: number
  recipient_id: number
  subject: string
  content: string
  is_read: boolean
  read_at?: string
  created_at: string
}

export interface DashboardStats {
  total_students: number
  total_teachers: number
  total_programs: number
  total_modules: number
  total_cohorts: number
  active_academic_year?: string
  current_academic_year?: string
  validated_modules?: number
  enrollments_count: number
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}
