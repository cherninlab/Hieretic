import clsx from 'clsx';
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  short?: boolean;
  secondary?: boolean;
  loading?: boolean;
  important?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, children, short, secondary, loading, important, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(styles.button, className, {
          [styles.short]: short,
          [styles.secondary]: secondary,
        })}
        disabled={disabled || loading}
        aria-busy={loading}
        data-important={important}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export const ReturnToMainButton = () => {
  const navigate = useNavigate();

  return (
    <Button onClick={() => navigate('/')} className={styles.returnButton}>
      Return to Main
    </Button>
  );
};
