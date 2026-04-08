import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { apiBase, login, error, setError } = useAuth();
  const [baseUrl, setBaseUrl] = useState(apiBase);
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login({ baseUrl, adminKey });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="eyebrow">Property Admin</div>
        <h1>登录管理台</h1>
        <p>使用管理员密钥登录后，才能进入公告、账单和报修管理页。</p>
        <form onSubmit={submit} className="login-form">
          <label>
            <span>API 地址</span>
            <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="/api/v1 或 http://127.0.0.1:8080/api/v1" />
          </label>
          <label>
            <span>管理员密钥</span>
            <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} placeholder="X-Admin-Key" />
          </label>
          {error ? <div className="error-banner">{error}</div> : null}
          <button className="btn btn-primary" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}
