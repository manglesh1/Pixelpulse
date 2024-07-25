import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Home Page</title>
        <meta name="description" content="Welcome to the home page" />
      </Head>
      <main>
        <h1>Welcome to the Home Page</h1>
        <p>This is the main content of the home page.</p>
      </main>
    </div>
  );
}
