interface KitchenPageHeaderProps {
  title: string;
  description: string;
}

export function KitchenPageHeader({ title, description }: KitchenPageHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
    </div>
  );
}
