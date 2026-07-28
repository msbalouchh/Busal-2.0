"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCustomerAction } from "@/modules/crm/actions/crm-actions";
import { CRM_ROUTES } from "@/modules/crm/constants/routes";
import type { CustomerView } from "@/modules/crm/types/crm";

interface CustomersManagerProps {
  customers: CustomerView[];
  groups: Array<{ id: string; name: string }>;
}

export function CustomersManager({ customers, groups }: CustomersManagerProps) {
  const [items, setItems] = useState(customers);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [groupId, setGroupId] = useState("");
  const [isPending, startTransition] = useTransition();

  const createCustomer = () => {
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    startTransition(async () => {
      try {
        const result = await createCustomerAction({
          name,
          phone: phone || null,
          email: email || null,
          groupId: groupId || null,
        });
        setItems((current) => [
          ...current,
          {
            id: result.customerId,
            name,
            phone: phone || null,
            email: email || null,
            groupName: groups.find((group) => group.id === groupId)?.name ?? null,
            tags: [],
            status: "ACTIVE",
            loyaltyPoints: 0,
          },
        ]);
        setName("");
        setPhone("");
        setEmail("");
        toast.success("Customer created");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Create failed");
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Customers</h3>
        <ul className="divide-y rounded-lg border">
          {items.map((customer) => (
            <li key={customer.id} className="flex items-start justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-muted-foreground text-xs">
                  {customer.phone ?? "No phone"} · {customer.groupName ?? "No group"} ·{" "}
                  {customer.loyaltyPoints} pts
                </p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={CRM_ROUTES.customer(customer.id)}>View</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-card space-y-3 rounded-xl border p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Add Customer</h3>
        <Input placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} />
        <Input
          placeholder="Phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <Input
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <select
          className="border-input bg-background h-11 w-full rounded-md border px-3 text-sm"
          value={groupId}
          onChange={(event) => setGroupId(event.target.value)}
        >
          <option value="">Select group</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <Button type="button" disabled={isPending} onClick={createCustomer}>
          Create Customer
        </Button>
      </section>
    </div>
  );
}
