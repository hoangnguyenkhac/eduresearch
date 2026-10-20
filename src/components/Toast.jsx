import React from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
  if (!message) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${type}`}>
        {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
        {onClose && (
          <button 
            onClick={onClose}
            style={{ color: 'white', opacity: 0.8, marginLeft: '0.5rem', display: 'flex' }}
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};

export default Toast;
