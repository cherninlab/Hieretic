import clsx from 'clsx';
import { HTMLAttributes, forwardRef } from 'react';
import styles from './Section.module.css';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  title?: string;
  noBorder?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(
  ({ children, className, title, noBorder, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={clsx(styles.section, noBorder && styles.withoutBorder, className)}
        {...props}
      >
        {title && <h2 className={styles.sectionTitle}>{title}</h2>}
        {children}
        <span className={styles.cornerBottom} aria-hidden="true" />
      </section>
    );
  },
);

Section.displayName = 'Section';
