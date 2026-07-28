"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addCustomerNoteAction,
  adjustLoyaltyPointsAction,
  redeemRewardAction,
} from "@/modules/crm/actions/crm-actions";
import type { CustomerDetailView } from "@/modules/crm/types/crm";

interface CustomerDetailViewProps {
  customer: CustomerDetailView;
  history: {
    totalOrders: number;
    totalSpentFormatted: string;
    averageOrderValueFormatted: string;
    lastOrderAt: string | null;
    favouriteItems: Array<{ name: string; quantity: number }>;
  };
  timeline: Array<{
    id: string;
    eventType: string;
    title: string;
    description: string | null;
    createdAt: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    authorName: string | null;
    createdAt: string;
  }>;
  pointTransactions: Array<{
    id: string;
    type: string;
    pointsChange: number;
    balanceAfter: number;
    reason: string | null;
    createdAt: string;
  }>;
  rewards: Array<{ id: string; name: string; pointsCost: number; type: string }>;
}

export function CustomerDetailPanel({
  customer,
  history,
  timeline,
  notes,
  pointTransactions,
  rewards,
}: CustomerDetailViewProps) {
  const [noteContent, setNoteContent] = useState("");
  const [pointsChange, setPointsChange] = useState("");
  const [isPending, startTransition] = useTransition();

  const addNote = () => {
    if (!noteContent.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        await addCustomerNoteAction({ customerId: customer.id, content: noteContent });
        setNoteContent("");
        toast.success("Note added");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to add note");
      }
    });
  };

  const adjustPoints = () => {
    const change = Number.parseInt(pointsChange, 10);
    if (!Number.isInteger(change)) {
      toast.error("Enter a valid points adjustment");
      return;
    }

    startTransition(async () => {
      try {
        await adjustLoyaltyPointsAction({
          customerId: customer.id,
          pointsChange: change,
          reason: "Manual adjustment",
        });
        setPointsChange("");
        toast.success("Points adjusted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Adjustment failed");
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <h2 className="text-xl font-semibold">{customer.name}</h2>
        <p className="text-muted-foreground text-sm">
          {customer.phone ?? "No phone"} · {customer.email ?? "No email"} ·{" "}
          {customer.groupName ?? "No group"}
        </p>
        <p className="mt-2 text-sm">Loyalty points: {customer.loyaltyPoints}</p>
      </section>

      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Order History</h3>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>Total orders: {history.totalOrders}</p>
          <p>Total spent: {history.totalSpentFormatted}</p>
          <p>Average order: {history.averageOrderValueFormatted}</p>
          <p>
            Last order:{" "}
            {history.lastOrderAt ? new Date(history.lastOrderAt).toLocaleString("en-GB") : "—"}
          </p>
        </div>
        {history.favouriteItems.length > 0 ? (
          <ul className="mt-3 space-y-1 text-sm">
            {history.favouriteItems.map((item) => (
              <li key={item.name}>
                {item.name} · {item.quantity}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Internal Notes</h3>
          <Input
            placeholder="Add internal note"
            value={noteContent}
            onChange={(event) => setNoteContent(event.target.value)}
          />
          <Button type="button" disabled={isPending} onClick={addNote}>
            Add Note
          </Button>
          <ul className="space-y-2 text-sm">
            {notes.map((note) => (
              <li key={note.id}>
                <p>{note.content}</p>
                <p className="text-muted-foreground text-xs">
                  {note.authorName ?? "Staff"} · {new Date(note.createdAt).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
          <h3 className="text-lg font-semibold">Loyalty</h3>
          <Input
            placeholder="Points adjustment (+/-)"
            value={pointsChange}
            onChange={(event) => setPointsChange(event.target.value)}
          />
          <Button type="button" disabled={isPending} onClick={adjustPoints}>
            Adjust Points
          </Button>
          <ul className="space-y-2 text-sm">
            {pointTransactions.map((transaction) => (
              <li key={transaction.id}>
                {transaction.type} {transaction.pointsChange} · balance {transaction.balanceAfter}
              </li>
            ))}
          </ul>
          {rewards.length > 0 ? (
            <div className="space-y-2 pt-2">
              {rewards.map((reward) => (
                <Button
                  key={reward.id}
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      try {
                        await redeemRewardAction({
                          customerId: customer.id,
                          rewardId: reward.id,
                        });
                        toast.success("Reward redeemed");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Redeem failed");
                      }
                    })
                  }
                >
                  Redeem {reward.name} ({reward.pointsCost} pts)
                </Button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="bg-card rounded-xl border p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Timeline</h3>
        <ul className="space-y-2 text-sm">
          {timeline.map((event) => (
            <li key={event.id}>
              <p className="font-medium">{event.title}</p>
              <p className="text-muted-foreground text-xs">
                {event.eventType} · {new Date(event.createdAt).toLocaleString("en-GB")}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
