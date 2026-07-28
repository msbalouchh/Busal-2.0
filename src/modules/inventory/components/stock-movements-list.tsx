interface StockMovementsListProps {
  movements: Array<{
    id: string;
    ingredientName: string;
    movementType: string;
    quantityChange: string;
    balanceAfter: string;
    reason: string | null;
    createdAt: string;
  }>;
}

export function StockMovementsList({ movements }: StockMovementsListProps) {
  if (movements.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
        No stock movements recorded yet.
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {movements.map((movement) => (
        <li key={movement.id} className="p-4 text-sm">
          <p className="font-medium">{movement.ingredientName}</p>
          <p className="text-muted-foreground text-xs">
            {movement.movementType} · change {movement.quantityChange} · balance{" "}
            {movement.balanceAfter}
          </p>
          <p className="text-muted-foreground text-xs">
            {movement.reason ?? "No reason"} ·{" "}
            {new Date(movement.createdAt).toLocaleString("en-GB")}
          </p>
        </li>
      ))}
    </ul>
  );
}
