import styles from './Button.module.css';

interface ButtonProps {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Button({ onClick, className, children, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} className={`${styles.button} ${className}`} disabled={disabled}>
      {children}
    </button>
  );
}
