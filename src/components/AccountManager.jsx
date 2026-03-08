import { useState } from 'react';
import { supabase } from '../lib/supabase';
import './AccountManager.css';

export default function AccountManager({ accounts, session, onAccountsChange }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const { data, error: insertError } = await supabase
        .from('telegram_accounts')
        .insert([
          {
            user_id: session.user.id,
            phone_number: phoneNumber,
            account_name: accountName,
            is_active: true,
          },
        ])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-reporter/add-account`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ phoneNumber, accountName }),
      });

      if (!response.ok) throw new Error('Failed to connect to server');

      setMessage('Account added successfully!');
      setPhoneNumber('');
      setAccountName('');
      setShowAddForm(false);
      onAccountsChange();
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to remove this account?')) return;

    try {
      const { error } = await supabase
        .from('telegram_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setMessage('Account removed successfully');
      onAccountsChange();
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="account-manager">
      <div className="section-header">
        <h2>Telegram Accounts</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Account'}
        </button>
      </div>

      {message && <div className="message success">{message}</div>}
      {error && <div className="message error">{error}</div>}

      {showAddForm && (
        <form onSubmit={handleAddAccount} className="add-account-form">
          <div className="form-group">
            <label htmlFor="accountName">Account Name</label>
            <input
              id="accountName"
              type="text"
              placeholder="My Telegram Account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              id="phoneNumber"
              type="tel"
              placeholder="+1234567890"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={loading}
            />
            <small>Include country code (e.g., +1 for US)</small>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Adding...' : 'Add Account'}
          </button>
        </form>
      )}

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <div className="empty-state">
            <p>No accounts added yet</p>
            <p className="hint">Add a Telegram account to start reporting channels</p>
          </div>
        ) : (
          accounts.map((account) => (
            <div key={account.id} className="account-card">
              <div className="account-info">
                <h3>{account.account_name}</h3>
                <p className="phone-number">{account.phone_number}</p>
                <span className="account-status">
                  {account.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <button
                onClick={() => handleDeleteAccount(account.id)}
                className="btn btn-danger"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
