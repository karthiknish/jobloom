// Animation utilities for the extension popup

export function addMicroInteractions(): void {
  // Add ripple effect to buttons
  document.querySelectorAll<HTMLButtonElement>('.action-btn, .auth-btn, .job-action-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const mouseEvent = event as MouseEvent;
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = mouseEvent.clientX - rect.left - size / 2;
      const y = mouseEvent.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.5);
        transform: scale(0);
        animation: ripple 0.6s linear;
        left: ${x}px;
        top: ${y}px;
        width: ${size}px;
        height: ${size}px;
        pointer-events: none;
      `;
      
      button.style.position = 'relative';
      button.style.overflow = 'hidden';
      button.appendChild(ripple);
      
      setTimeout(() => ripple.remove(), 600);
    });
  });
  
  // Add hover effects to stat cards
  document.querySelectorAll<HTMLElement>('.stat-card').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('pulse-once');
    });
  });
  
  // Add focus styles for better accessibility
  document.querySelectorAll<HTMLElement>('button, input, select').forEach((element) => {
    element.classList.add('focus-ring');
  });
}

export function addRippleAnimation(): void {
  if (document.getElementById('ripple-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
    
    .pulse-once {
      animation: pulse 0.5s ease-in-out;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    .focus-ring:focus {
      outline: 2px solid rgba(59, 130, 246, 0.5);
      outline-offset: 2px;
    }
    
    .animate-slide-in-down {
      animation: slideInDown 0.3s ease-out;
    }
    
    .animate-slide-out-up {
      animation: slideOutUp 0.3s ease-in;
    }
    
    @keyframes slideInDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutUp {
      from {
        transform: translateY(0);
        opacity: 1;
      }
      to {
        transform: translateY(-100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

export function addLoadingSpinner(button: HTMLElement): void {
  button.classList.add('loading');
  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10" stroke-dasharray="31.416" stroke-dashoffset="31.416">
        <animate attributeName="stroke-dashoffset" dur="1s" repeatCount="indefinite" from="31.416" to="0"/>
        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
  `;
  button.appendChild(spinner);
}

export function removeLoadingSpinner(button: HTMLElement): void {
  button.classList.remove('loading');
  const spinner = button.querySelector('.spinner');
  if (spinner) {
    spinner.remove();
  }
}
