import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import styles from '../styles/Login.module.css'; // Assumes scoped CSS
import 'bootstrap-icons/font/bootstrap-icons.css'; // Required for Bootstrap icons

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await axios.post(`${API_URL}/login`, { email, password }, { withCredentials: true });
      router.push('/');
    } catch (error) {
      setErrorMsg('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Login</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />

          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
            />
            <i
              className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} ${styles.iconInsideInput}`}
              onClick={() => setShowPassword(prev => !prev)}
            />
          </div>


          {errorMsg && <p className={styles.error}>{errorMsg}</p>}
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
