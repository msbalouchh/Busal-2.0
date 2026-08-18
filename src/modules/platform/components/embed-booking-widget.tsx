"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmbedBookingWidgetProps {
  businessId: string;
  token: string;
}

export function EmbedBookingWidget({ businessId, token }: EmbedBookingWidgetProps) {
  const [partySize, setPartySize] = useState("2");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setStatus(null);

    try {
      const response = await fetch("/api/embed/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          token,
          partySize: Number(partySize),
          date,
          time,
          customerName: name,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? "Booking failed");
      }
      setStatus("Reservation request submitted.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="embed-name">Name</Label>
        <Input id="embed-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="embed-date">Date</Label>
          <Input id="embed-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="embed-time">Time</Label>
          <Input id="embed-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="embed-party">Party size</Label>
        <Input id="embed-party" type="number" min={1} value={partySize} onChange={(e) => setPartySize(e.target.value)} required />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting…" : "Request booking"}
      </Button>
      {status ? <p className="text-muted-foreground text-sm">{status}</p> : null}
    </form>
  );
}
