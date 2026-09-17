// Root — session state and screen routing.
// In production this is React Router + Zustand (session, selected location) + TanStack Query.

const { useState } = React;
const { restaurants } = window.HearthMock;
const { AuthLayout, LoginForm, VerifyForm } = window.HearthAuth;
const { AppShell } = window.HearthShell;
const Dashboard = window.HearthDashboard;
const Foundations = window.HearthFoundations;

function App() {
  const [session, setSession] = useState({ token: null, sessionId: null, email: null });
  const [route, setRoute] = useState('login');          // login | verify | foundations | app
  const [screen, setScreen] = useState('dashboard');    // nav key within the shell
  const [locationId, setLocationId] = useState(restaurants[0].id);

  if (route === 'foundations') {
    return <Foundations onBack={() => setRoute('login')} />;
  }

  if (!session.token) {
    return (
      <AuthLayout>
        {route === 'verify'
          ? <VerifyForm
              session={session}
              onToken={token => { setSession(s => ({ ...s, token })); setRoute('app'); setScreen('dashboard'); }}
              onRestart={() => { setSession({ token: null, sessionId: null, email: null }); setRoute('login'); }}
            />
          : <LoginForm
              onSession={({ sessionId, email }) => { setSession({ token: null, sessionId, email }); setRoute('verify'); }}
              onFoundations={() => setRoute('foundations')}
            />}
      </AuthLayout>
    );
  }

  return (
    <AppShell
      screen={screen}
      onNavigate={setScreen}
      locationId={locationId}
      onPickLocation={setLocationId}
      onSignOut={() => { setSession({ token: null, sessionId: null, email: null }); setRoute('login'); }}
    >
      <Dashboard locationId={locationId} />
    </AppShell>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
