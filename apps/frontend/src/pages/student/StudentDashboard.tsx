import DashboardLayout from '../../components/DashboardLayout';

function StudentDashboard() {
  return (
    <DashboardLayout>
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-4 text-2xl font-bold">Student Dashboard</h1>
        <div className="rounded border p-4">
          <h2 className="text-lg font-semibold">My Exam Sessions</h2>
          <p className="mt-2 text-gray-500">No upcoming exams.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentDashboard;
