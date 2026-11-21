import { Navigate, Route, Routes } from 'react-router-dom';
import { useApp } from './context/AppContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import { ForgotPassword, ResetPassword, AcceptInvitation } from './pages/AuthPages';
import Overview from './pages/Overview';
import Workspace from './pages/Workspace';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Outreach from './pages/Outreach';
import Discover from './pages/Discover';
import ImportPreview from './pages/ImportPreview';
import ImportResults from './pages/ImportResults';
import ExtensionSettings from './pages/ExtensionSettings';
import ExtensionHistory from './pages/ExtensionHistory';
import Followups from './pages/Followups';
import Campaigns from './pages/Campaigns';
import Templates from './pages/Templates';
import Analytics from './pages/Analytics';
import Team from './pages/Team';
import { Notifications, Activity, Integrations, SettingsPage } from './pages/System';
export default function App() {
    const { user, ready, role } = useApp();
    if (!ready)
        return <div className="min-h-screen grid place-items-center text-sm text-muted">Loading...</div>;
    if (!user)
        return <Routes><Route path="/login" element={<Login />}/><Route path="/forgot-password" element={<ForgotPassword />}/><Route path="/reset-password" element={<ResetPassword />}/><Route path="/accept-invitation" element={<AcceptInvitation />}/><Route path="*" element={<Navigate to="/login" replace/>}/></Routes>;
    const owner = (el) => (role === 'owner' ? el : <Navigate to="/" replace/>);
    return (<Routes>
      <Route element={<Layout />}>
        <Route index element={<Overview />}/><Route path="workspace/:dept" element={<Workspace />}/>
        <Route path="leads" element={<Leads />}/><Route path="leads/:id" element={<LeadDetail />}/><Route path="outreach" element={<Outreach />}/>
        <Route path="discover" element={<Discover />}/><Route path="discover/preview" element={<ImportPreview />}/><Route path="discover/results" element={<ImportResults />}/>
        <Route path="extension" element={<ExtensionSettings />}/><Route path="extension/history" element={<ExtensionHistory />}/>
        <Route path="followups" element={<Followups />}/><Route path="campaigns" element={<Campaigns />}/><Route path="templates" element={<Templates />}/><Route path="analytics" element={<Analytics />}/>
        <Route path="notifications" element={<Notifications />}/><Route path="activity" element={<Activity />}/><Route path="settings" element={<SettingsPage />}/>
        <Route path="team" element={owner(<Team />)}/><Route path="integrations" element={owner(<Integrations />)}/>
        <Route path="login" element={<Navigate to="/" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/>
      </Route>
    </Routes>);
}
