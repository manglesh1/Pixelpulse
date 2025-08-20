// pages/404.js
export default function Custom404() {
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        color: '#333',
        textAlign: 'center',
      }}
    >
      <h1 style={{ fontSize: '5rem', marginBottom: '1rem' }}>404</h1>
      <h2 style={{ marginBottom: '2rem' }}>Page Not Found</h2>
      <p style={{ maxWidth: '400px' }}>
        Sorry, the page you’re looking for doesn’t exist or you don’t have access.
      </p>
      <a
        href="/"
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          background: '#007bff',
          color: '#fff',
          borderRadius: '0.25rem',
          textDecoration: 'none',
        }}
      >
        Go Home
      </a>
    </div>
  );
}
