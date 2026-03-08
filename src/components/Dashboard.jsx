import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import AccountManager from './AccountManager';
import ReportForm from './ReportForm';
import ReportHistory from './ReportHistory';
import './Dashboard.css';

export default function Dashboard({ session }) {
  const [activeTab, setActiveTab] = useState('report');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('telegram_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>TelReper</h1>
          <div className="header-actions">
            <span className="user-email">{session.user.email}</span>
            <button onClick={handleSignOut} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={`nav-btn ${activeTab === 'report' ? 'active' : ''}`}
          onClick={() => setActiveTab('report')}
        >
          Report Channel
        </button>
        <button
          className={`nav-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          Accounts ({accounts.length})
        </button>
        <button
          className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'report' && (
          <ReportForm accounts={accounts} session={session} />
        )}
        {activeTab === 'accounts' && (
          <AccountManager
            accounts={accounts}
            session={session}
            onAccountsChange={fetchAccounts}
          />
        )}
        {activeTab === 'history' && <ReportHistory session={session} />}
      </main>
    </div>
  );
}
