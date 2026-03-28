import Header from './Header';
import Navigation from './Navigation';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight:       '100vh',
      background:      '#050810',
      backgroundImage: `
        radial-gradient(ellipse at 15% 40%, rgba(139,0,0,0.06) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 15%, rgba(255,215,0,0.03) 0%, transparent 50%)
      `,
    }}>
      <Header />
      <main style={{ paddingBottom: '72px' }}>
        {children}
      </main>
      <Navigation />
    </div>
  );
}
