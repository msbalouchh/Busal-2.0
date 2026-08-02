interface AuthDividerProps {
  label?: string;
}

export function AuthDivider({ label = "Or continue with email" }: AuthDividerProps) {
  return (
    <div className="auth-divider" role="separator" aria-label={label}>
      <div className="auth-divider__line" />
      <span className="auth-divider__label">{label}</span>
    </div>
  );
}
