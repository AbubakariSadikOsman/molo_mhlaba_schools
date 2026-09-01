import { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthProvider';
import { SignIn } from './auth/SignIn';
import { UiProvider, UiOverlay, useUi } from './lib/UiContext';
import { AppDataProvider } from './lib/AppDataContext';
import { ConfigNotice, PendingApproval } from './components/StatusScreens';
import { supabaseConfigured } from './supabaseClient';
import { Header } from './components/Header';
import { CampusPicker } from './components/CampusPicker';
import { TabBar, type ViewName } from './components/TabBar';
import { LogForm } from './components/LogForm';
import { Home } from './views/Home';
import { Log } from './views/Log';
import { Students } from './views/Students';
import { StudentDetail } from './views/StudentDetail';
import { Trends } from './views/Trends';
import { More } from './views/More';
import { AdminStudents } from './views/AdminStudents';
import { AdminStaff } from './views/AdminStaff';
import { AdminImport } from './views/AdminImport';

type AdminView = 'adminStudents' | 'adminStaff' | 'adminImport';
type ExtendedView = ViewName | AdminView;

function isAdminView(v: ExtendedView): v is AdminView {
  return v === 'adminStudents' || v === 'adminStaff' || v === 'adminImport';
}

function Shell() {
  const [view, setView] = useState<ExtendedView>('home');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [campusPickerOpen, setCampusPickerOpen] = useState(false);
  const { openModal } = useUi();

  function openStudent(id: string) {
    setStudentId(id);
    setView('studentDetail');
  }

  function openLogForm() {
    openModal(<LogForm />);
  }

  return (
    <div className="app-frame">
      <Header onSwitchCampus={() => setCampusPickerOpen(true)} />
      <CampusPicker open={campusPickerOpen} onClose={() => setCampusPickerOpen(false)} />

      <div className="view">
        {view === 'home' && <Home onOpenLogForm={openLogForm} onOpenStudent={openStudent} />}
        {view === 'log' && <Log onOpenStudent={openStudent} />}
        {view === 'students' && <Students onOpenStudent={openStudent} />}
        {view === 'studentDetail' && studentId && (
          <StudentDetail studentId={studentId} onBack={() => setView('students')} />
        )}
        {view === 'trends' && <Trends onOpenStudent={openStudent} />}
        {view === 'more' && (
          <More onManageStudents={() => setView('adminStudents')} onManageStaff={() => setView('adminStaff')} />
        )}
        {view === 'adminStudents' && (
          <AdminStudents onBack={() => setView('more')} onImportData={() => setView('adminImport')} />
        )}
        {view === 'adminStaff' && <AdminStaff onBack={() => setView('more')} />}
        {view === 'adminImport' && <AdminImport onBack={() => setView('adminStudents')} />}
      </div>

      {!isAdminView(view) && (
        <button className="fab" title="Log incident" onClick={openLogForm}>
          +
        </button>
      )}

      <TabBar view={isAdminView(view) ? 'more' : view} onChange={setView} />
      <UiOverlay />
    </div>
  );
}

function Gate() {
  const { session, profile, loading } = useAuth();

  if (!supabaseConfigured) return <ConfigNotice />;
  if (loading) return <div className="center-loading">Loading…</div>;
  if (!session) return <SignIn />;
  if (!profile) return <div className="center-loading">Setting up your account…</div>;
  if (profile.role === 'pending') return <PendingApproval />;

  return (
    <AppDataProvider>
      <Shell />
    </AppDataProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UiProvider>
        <Gate />
      </UiProvider>
    </AuthProvider>
  );
}
