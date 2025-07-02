import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const AdminPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await axios.get(`${API_URL}/me`, { withCredentials: true });
        setUser(res.data);
        if (res.data.role !== 'admin') {
          router.replace('/login');
        }
      } catch (err) {
        router.replace('/login');
      }
    };
    checkAccess();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await axios.post(`${API_URL}/register`, {
        email,
        password,
        role,
      }, {
        withCredentials: true,
      });

      setSuccessMsg('Admin registered successfully!');
      setEmail('');
      setPassword('');
      setRole('user');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">Register New Admin</h4>
            </div>
            <div className="card-body">
              {user && (
                <div className="mb-3">
                  <span className="text-muted">Logged in as:</span>{' '}
                  <strong>{user.email}</strong> ({user.role})
                </div>
              )}

              <form onSubmit={handleRegister}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="Admin Email"
                    value={email}
                    required
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <label htmlFor="email">Email</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    placeholder="Password"
                    value={password}
                    required
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <label htmlFor="password">Password</label>
                </div>

                <div className="form-floating mb-3">
                  <select
                    className="form-select"
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="user">Admin</option>
                  </select>
                  <label htmlFor="role">Role</label>
                </div>

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Registering...
                    </>
                  ) : (
                    'Register Admin'
                  )}
                </button>

                {errorMsg && (
                  <div className="alert alert-danger mt-3 mb-0">{errorMsg}</div>
                )}
                {successMsg && (
                  <div className="alert alert-success mt-3 mb-0">{successMsg}</div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
