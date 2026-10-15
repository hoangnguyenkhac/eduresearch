import React from 'react';

/**
 * Base Skeleton Element
 */
export const Skeleton = ({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-md)',
  style = {},
  className = ''
}) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

/**
 * Stat Card Skeleton (4 grid cards on Dashboard, Responses, Users)
 */
export const SkeletonStatCard = () => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem' }}>
      <Skeleton width="56px" height="56px" borderRadius="var(--radius-lg)" />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height="1.75rem" style={{ marginBottom: '0.5rem' }} />
        <Skeleton width="40%" height="0.875rem" />
      </div>
    </div>
  );
};

/**
 * Table Rows Skeleton (replaces table body while keeping the table structure)
 */
export const SkeletonTableRows = ({ rows = 5, columns = 6 }) => {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
          {Array.from({ length: columns }).map((_, cIdx) => (
            <td key={cIdx} style={{ padding: '1rem' }}>
              <Skeleton
                width={cIdx === 0 ? '75%' : (cIdx === columns - 1 ? '50px' : '60%')}
                height="1rem"
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
};

/**
 * Chart Skeleton Placeholder
 */
export const SkeletonChart = ({ height = '320px' }) => {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <Skeleton width="180px" height="1.25rem" />
        <Skeleton width="90px" height="1.25rem" />
      </div>
      <div style={{
        height,
        display: 'flex',
        alignItems: 'flex-end',
        gap: '1rem',
        padding: '1rem 0',
        justifyContent: 'space-around'
      }}>
        {[45, 75, 60, 90, 65, 80, 50, 85].map((h, i) => (
          <Skeleton
            key={i}
            width="10%"
            height={`${h}%`}
            borderRadius="var(--radius-sm) var(--radius-sm) 0 0"
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Document / Survey Card Skeleton
 */
export const SkeletonCard = ({ height = '180px' }) => {
  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Skeleton width="65%" height="1.25rem" />
        <Skeleton width="60px" height="1.25rem" borderRadius="var(--radius-full)" />
      </div>
      <Skeleton width="90%" height="0.875rem" />
      <Skeleton width="45%" height="0.875rem" />
      <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', paddingTop: '1rem' }}>
        <Skeleton width="80px" height="0.875rem" />
        <Skeleton width="60px" height="1.5rem" borderRadius="var(--radius-md)" />
      </div>
    </div>
  );
};

export default Skeleton;
