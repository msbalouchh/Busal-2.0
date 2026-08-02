interface SkipToContentProps {
  targetId?: string;
}

export function SkipToContent({ targetId = "main-content" }: SkipToContentProps) {
  return (
    <a href={`#${targetId}`} className="skip-to-content">
      Skip to main content
    </a>
  );
}
