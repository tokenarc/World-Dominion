'use client';

export default function Skeleton({ height = '20px', width = '100%', style = {} }: { height?: string; width?: string; style?: any }) {
  return (
    <div
      style={{
        height,
        width,
        background: 'linear-gradient(90deg, #0d1117, #161b22, #0d1117)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '4px',
        ...style,
      }}
    />
  );
}

export function CardSkeleton() {
  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid rgba(139, 0, 0, 0.2)',
      borderRadius: '10px',
      padding: '12px',
    }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
        <Skeleton height="32px" width="32px" style={{ borderRadius: '8px' }} />
        <div style={{ flex: 1 }}>
          <Skeleton height="12px" width="60%" style={{ marginBottom: '6px' }} />
          <Skeleton height="10px" width="40%" />
        </div>
      </div>
      <Skeleton height="4px" width="100%" />
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div style={{
      height: '200px',
      background: '#050d1a',
      border: '1px solid rgba(204, 0, 0, 0.3)',
      borderRadius: '12px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, transparent, rgba(204,0,0,0.1), transparent)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 2s infinite',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10px',
        right: '10px',
      }}>
        <Skeleton height="10px" width="60px" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px',
          background: '#0d1117',
          borderRadius: '8px',
        }}>
          <Skeleton height="24px" width="24px" style={{ borderRadius: '4px' }} />
          <div style={{ flex: 1 }}>
            <Skeleton height="12px" width="70%" style={{ marginBottom: '4px' }} />
            <Skeleton height="8px" width="50%" />
          </div>
        </div>
      ))}
    </div>
  );
}