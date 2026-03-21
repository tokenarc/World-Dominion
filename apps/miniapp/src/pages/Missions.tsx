export default function Missions() {
  const styles = {
    container: {
      padding: '20px',
      color: '#e8e8e8',
      fontFamily: 'Arial Black, sans-serif',
      textAlign: 'center' as const,
      marginTop: '50px',
    },
    title: {
      fontSize: '24px',
      color: '#FFD700',
      marginBottom: '20px',
      letterSpacing: '2px',
    },
    subtitle: {
      fontSize: '14px',
      color: '#8892a4',
      letterSpacing: '1px',
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>CLASSIFIED MISSIONS</div>
      <div style={styles.subtitle}>NO ACTIVE MISSIONS IN YOUR SECTOR</div>
    </div>
  );
}
