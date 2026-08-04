import { Link } from 'react-router-dom';

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0l3-3m-3 3l-3-3M4 6h16M4 12h16v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6z" />
      </svg>
    ),
    title: 'QR Code Attendance',
    description:
      'Students check in and out with a simple QR code scan at the exam hall — no paper registers, no manual entry.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Real-time Tracking',
    description:
      'Live attendance stats during every session. Invigilators see who is present, late, or absent the moment it happens.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Incident Reporting',
    description:
      'Log malpractices, unauthorized entries, or technical issues during an exam and keep a complete audit trail.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Role-based Dashboards',
    description:
      'Dedicated views for admins, invigilators, and students — everyone only sees what they need.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Excel & PDF Reports',
    description:
      'Export attendance sheets to Excel or generate official PDF reports for any exam session in one click.',
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Secure Authentication',
    description:
      'JWT-based authentication with hashed passwords and role-based access control across the whole platform.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create your account',
    description: 'Sign up as a student, invigilator, or lecturer in under a minute.',
  },
  {
    number: '02',
    title: 'Scan or track in real time',
    description:
      'Students scan their QR code at the hall. Invigilators watch live attendance as it happens.',
  },
  {
    number: '03',
    title: 'Review & export reports',
    description:
      'Admins review dashboards, logs, and incidents — then export everything to Excel or PDF.',
  },
];

const roles = [
  {
    name: 'Student',
    description: 'Register for an account, view your exam sessions, and scan your QR code at the hall.',
    link: '/signup?role=STUDENT',
    cta: 'Sign up as a Student',
  },
  {
    name: 'Invigilator',
    description: 'Oversee sessions, scan students in, record incidents, and monitor live attendance.',
    link: '/signup?role=INVIGILATOR',
    cta: 'Sign up as an Invigilator',
  },
  {
    name: 'Lecturer / Admin',
    description: 'Manage exam sessions, rooms, students, and generate official attendance reports.',
    link: '/signup?role=LECTURER',
    cta: 'Sign up as a Lecturer',
  },
];

function HomePage() {
  return (
    <div className="-mt-8">
      <section className="rounded-3xl bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-950 px-8 py-20 text-center text-white shadow-xl sm:px-12">
        <p className="mx-auto mb-4 inline-block rounded-full bg-white/15 px-4 py-1 text-sm font-medium backdrop-blur">
          Secure. Real-time. Effortless.
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight sm:text-5xl">
          Exam Tracking System
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-200">
          A complete platform to run examination sessions — QR-based student attendance,
          real-time monitoring for invigilators, and instant reports for admins.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/login"
            className="w-full rounded-lg bg-white px-8 py-3 text-base font-semibold text-blue-900 shadow-md transition hover:bg-blue-50 sm:w-auto"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="w-full rounded-lg border-2 border-white/70 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            Create Account
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/20 pt-8 text-sm sm:grid-cols-3">
          <div>
            <p className="text-2xl font-bold">3+</p>
            <p className="text-blue-300">Role-based dashboards</p>
          </div>
          <div>
            <p className="text-2xl font-bold">QR</p>
            <p className="text-blue-300">Frictionless check-in / check-out</p>
          </div>
          <div>
            <p className="text-2xl font-bold">2</p>
            <p className="text-blue-300">Report formats (Excel & PDF)</p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-3xl font-bold text-gray-900">Everything you need, built in</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          From the moment students walk into the hall until the final report is exported.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-gray-100 px-6 py-12 sm:px-12">
        <h2 className="text-center text-3xl font-bold text-gray-900">How it works</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-800 text-lg font-bold text-white shadow-md">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-3xl font-bold text-gray-900">Who is it for?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-600">
          Everyone involved in an examination session gets their own workspace.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.name}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900">{role.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">{role.description}</p>
              <Link
                to={role.link}
                className="mt-5 rounded-lg bg-blue-800 px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                {role.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl bg-gray-900 px-6 py-12 text-center text-white sm:px-12">
        <h2 className="text-3xl font-bold">Ready to run your first session?</h2>
        <p className="mx-auto mt-3 max-w-xl text-gray-300">
          Create an account in seconds and experience attendance tracking the modern way.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/signup"
            className="w-full rounded-lg bg-blue-800 px-8 py-3 font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
          >
            Get Started — Sign Up
          </Link>
          <Link
            to="/login"
            className="w-full rounded-lg border border-gray-600 px-8 py-3 font-semibold text-gray-200 transition hover:bg-gray-800 sm:w-auto"
          >
            I already have an account
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;