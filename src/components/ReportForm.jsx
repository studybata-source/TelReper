import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './ReportForm.css';

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'fake_account', label: 'Fake Account / Impersonation' },
  { value: 'violence', label: 'Violent Content' },
  { value: 'child_abuse', label: 'Child Abuse Content' },
  { value: 'pornography', label: 'Pornographic Content' },
  { value: 'geoirrelevant', label: 'Geographically Irrelevant' },
];

export default function ReportForm({ accounts, session }) {
  const [targetChannel, setTargetChannel] = useState('');
  const [reportReason, setReportReason] = useState('spam');
  const [reportCount, setReportCount] = useState(10);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAccountToggle = (accountId) => {
    setSelectedAccounts((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId]
    );
  };

  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([]);
    } else {
      setSelectedAccounts(accounts.map((acc) => acc.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (selectedAccounts.length === 0) {
      setError('Please select at least one account');
      setLoading(false);
      return;
    }

    try {
      const { data: historyData, error: historyError } = await supabase
        .from('report_history')
        .insert([
          {
            user_id: session.user.id,
            target_channel: targetChannel,
            report_reason: reportReason,
            report_count: reportCount * selectedAccounts.length,
            accounts_used: selectedAccounts.length,
            status: 'completed',
          },
        ])
        .select()
        .maybeSingle();

      if (historyError) throw historyError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-reporter/report-channel`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          targetChannel,
          reportReason,
          reportCount,
          accountIds: selectedAccounts,
        }),
      });

      if (!response.ok) throw new Error('Failed to send reports');

      const result = await response.json();
      setMessage(
        `Successfully submitted ${result.details.totalReports} reports using ${result.details.accountsUsed} accounts!`
      );
      setTargetChannel('');
      setSelectedAccounts([]);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="report-form">
        <div className="empty-state">
          <h2>No Accounts Available</h2>
          <p>Please add at least one Telegram account in the Accounts tab to start reporting channels.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-form">
      <h2>Report a Channel</h2>
      <p className="warning-text">
        Only report channels that violate Telegram's Terms of Service. Misuse of this tool is prohibited.
      </p>

      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="targetChannel">Target Channel</label>
          <input
            id="targetChannel"
            type="text"
            placeholder="channelname (without @)"
            value={targetChannel}
            onChange={(e) => setTargetChannel(e.target.value.replace('@', ''))}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="reportReason">Report Reason</label>
          <select
            id="reportReason"
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            disabled={loading}
          >
            {REPORT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="reportCount">Reports per Account</label>
          <input
            id="reportCount"
            type="number"
            min="1"
            max="1000"
            value={reportCount}
            onChange={(e) => setReportCount(Number(e.target.value))}
            disabled={loading}
          />
          <small>
            Total reports: {reportCount * selectedAccounts.length}
          </small>
        </div>

        <div className="form-group">
          <div className="accounts-header">
            <label>Select Accounts</label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="btn btn-link"
              disabled={loading}
            >
              {selectedAccounts.length === accounts.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="accounts-selection">
            {accounts.map((account) => (
              <label key={account.id} className="account-checkbox">
                <input
                  type="checkbox"
                  checked={selectedAccounts.includes(account.id)}
                  onChange={() => handleAccountToggle(account.id)}
                  disabled={loading}
                />
                <span>{account.account_name}</span>
                <small>{account.phone_number}</small>
              </label>
            ))}
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-large" disabled={loading}>
          {loading ? 'Submitting Reports...' : 'Submit Reports'}
        </button>
      </form>
    </div>
  );
}
