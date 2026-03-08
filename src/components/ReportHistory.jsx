import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './ReportHistory.css';

export default function ReportHistory({ session }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('report_history')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getReasonLabel = (reason) => {
    const labels = {
      spam: 'Spam',
      fake_account: 'Fake Account',
      violence: 'Violence',
      child_abuse: 'Child Abuse',
      pornography: 'Pornography',
      geoirrelevant: 'Geo Irrelevant',
    };
    return labels[reason] || reason;
  };

  if (loading) {
    return (
      <div className="report-history">
        <p>Loading history...</p>
      </div>
    );
  }

  return (
    <div className="report-history">
      <h2>Report History</h2>

      {history.length === 0 ? (
        <div className="empty-state">
          <p>No reports yet</p>
          <p className="hint">Your report history will appear here</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((report) => (
            <div key={report.id} className="history-card">
              <div className="history-header">
                <h3>@{report.target_channel}</h3>
                <span className={`status-badge ${report.status}`}>
                  {report.status}
                </span>
              </div>
              <div className="history-details">
                <div className="detail-row">
                  <span className="label">Reason:</span>
                  <span className="value">{getReasonLabel(report.report_reason)}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Reports:</span>
                  <span className="value">{report.report_count}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Accounts Used:</span>
                  <span className="value">{report.accounts_used}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Date:</span>
                  <span className="value">{formatDate(report.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
