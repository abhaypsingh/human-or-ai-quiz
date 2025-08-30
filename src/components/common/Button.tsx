import React from 'react';
import clsx from 'clsx';
import { ButtonProps } from '../../types';
import styles from './Button.module.css';

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={clsx(
        styles.button,
        styles[variant],
        styles[size],
        loading && styles.loading,
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className={styles.spinner} />}
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
};