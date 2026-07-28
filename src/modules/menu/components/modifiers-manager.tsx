"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assignModifierGroupsAction,
  createModifierGroupAction,
  createModifierOptionAction,
  deleteModifierGroupAction,
  deleteModifierOptionAction,
  updateModifierGroupAction,
  updateModifierOptionAction,
} from "@/modules/menu/actions/menu-actions";
import type { MenuItemData, ModifierGroupData } from "@/services/menu-management.service";

interface ModifiersManagerProps {
  modifierGroups: ModifierGroupData[];
  menuItems: MenuItemData[];
}

interface GroupFormState {
  name: string;
  description: string;
  minSelections: string;
  maxSelections: string;
  isRequired: boolean;
}

interface OptionFormState {
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
}

const emptyGroupForm: GroupFormState = {
  name: "",
  description: "",
  minSelections: "0",
  maxSelections: "1",
  isRequired: false,
};

const emptyOptionForm: OptionFormState = {
  name: "",
  priceAdjustment: "0",
  isDefault: false,
};

export function ModifiersManager({ modifierGroups, menuItems }: ModifiersManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState<GroupFormState>(emptyGroupForm);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [optionGroupId, setOptionGroupId] = useState<string | null>(null);
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optionForm, setOptionForm] = useState<OptionFormState>(emptyOptionForm);
  const [assignItemId, setAssignItemId] = useState("");
  const [assignGroupIds, setAssignGroupIds] = useState<string[]>([]);

  const resetGroupForm = () => {
    setGroupForm(emptyGroupForm);
    setEditingGroupId(null);
    setShowGroupForm(false);
  };

  const resetOptionForm = () => {
    setOptionForm(emptyOptionForm);
    setEditingOptionId(null);
    setOptionGroupId(null);
  };

  const startEditGroup = (group: ModifierGroupData) => {
    setEditingGroupId(group.id);
    setShowGroupForm(true);
    setGroupForm({
      name: group.name,
      description: group.description ?? "",
      minSelections: String(group.minSelections),
      maxSelections: String(group.maxSelections),
      isRequired: group.isRequired,
    });
  };

  const handleGroupSubmit = () => {
    if (!groupForm.name.trim()) {
      toast.error("Group name is required");
      return;
    }

    const payload = {
      name: groupForm.name,
      description: groupForm.description || undefined,
      minSelections: Number.parseInt(groupForm.minSelections, 10) || 0,
      maxSelections: Number.parseInt(groupForm.maxSelections, 10) || 1,
      isRequired: groupForm.isRequired,
    };

    startTransition(async () => {
      try {
        if (editingGroupId) {
          await updateModifierGroupAction(editingGroupId, payload);
          toast.success("Modifier group updated");
        } else {
          await createModifierGroupAction(payload);
          toast.success("Modifier group created");
        }
        resetGroupForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save modifier group");
      }
    });
  };

  const handleDeleteGroup = (groupId: string) => {
    startTransition(async () => {
      try {
        await deleteModifierGroupAction(groupId);
        toast.success("Modifier group deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete modifier group");
      }
    });
  };

  const startAddOption = (groupId: string) => {
    setOptionGroupId(groupId);
    setEditingOptionId(null);
    setOptionForm(emptyOptionForm);
  };

  const startEditOption = (groupId: string, option: ModifierGroupData["options"][number]) => {
    setOptionGroupId(groupId);
    setEditingOptionId(option.id);
    setOptionForm({
      name: option.name,
      priceAdjustment: option.priceAdjustment.toFixed(2),
      isDefault: option.isDefault,
    });
  };

  const handleOptionSubmit = () => {
    if (!optionGroupId || !optionForm.name.trim()) {
      toast.error("Option name is required");
      return;
    }

    const payload = {
      name: optionForm.name,
      priceAdjustment: Number.parseFloat(optionForm.priceAdjustment) || 0,
      isDefault: optionForm.isDefault,
    };

    startTransition(async () => {
      try {
        if (editingOptionId) {
          await updateModifierOptionAction(editingOptionId, payload);
          toast.success("Option updated");
        } else {
          await createModifierOptionAction(optionGroupId, payload);
          toast.success("Option created");
        }
        resetOptionForm();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to save option");
      }
    });
  };

  const handleDeleteOption = (optionId: string) => {
    startTransition(async () => {
      try {
        await deleteModifierOptionAction(optionId);
        toast.success("Option deleted");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to delete option");
      }
    });
  };

  const handleAssign = () => {
    if (!assignItemId) {
      toast.error("Select a menu item");
      return;
    }

    startTransition(async () => {
      try {
        await assignModifierGroupsAction(assignItemId, assignGroupIds);
        toast.success("Modifier groups assigned");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to assign modifier groups");
      }
    });
  };

  const loadAssignmentForItem = (itemId: string) => {
    setAssignItemId(itemId);
    const item = menuItems.find((entry) => entry.id === itemId);
    setAssignGroupIds(item?.modifierGroupIds ?? []);
  };

  const toggleAssignGroup = (groupId: string) => {
    setAssignGroupIds((current) =>
      current.includes(groupId) ? current.filter((id) => id !== groupId) : [...current, groupId],
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => setShowGroupForm(true)}
          disabled={isPending || showGroupForm}
        >
          <Plus className="h-4 w-4" />
          Add modifier group
        </Button>
      </div>

      {showGroupForm ? (
        <div className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                value={groupForm.name}
                onChange={(event) => setGroupForm({ ...groupForm, name: event.target.value })}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="group-description">Description</Label>
              <Input
                id="group-description"
                value={groupForm.description}
                onChange={(event) =>
                  setGroupForm({ ...groupForm, description: event.target.value })
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-min">Min selections</Label>
              <Input
                id="group-min"
                type="number"
                min="0"
                value={groupForm.minSelections}
                onChange={(event) =>
                  setGroupForm({ ...groupForm, minSelections: event.target.value })
                }
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-max">Max selections</Label>
              <Input
                id="group-max"
                type="number"
                min="1"
                value={groupForm.maxSelections}
                onChange={(event) =>
                  setGroupForm({ ...groupForm, maxSelections: event.target.value })
                }
                disabled={isPending}
              />
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <input
                id="group-required"
                type="checkbox"
                checked={groupForm.isRequired}
                onChange={(event) =>
                  setGroupForm({ ...groupForm, isRequired: event.target.checked })
                }
                disabled={isPending}
              />
              <Label htmlFor="group-required">Required</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleGroupSubmit} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingGroupId ? "Update group" : "Create group"}
            </Button>
            <Button type="button" variant="outline" onClick={resetGroupForm} disabled={isPending}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {modifierGroups.length === 0 ? (
          <p className="text-muted-foreground text-sm">No modifier groups yet.</p>
        ) : (
          modifierGroups.map((group) => (
            <div key={group.id} className="space-y-3 rounded-lg border p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1 text-sm">
                  <p className="font-semibold">{group.name}</p>
                  <p className="text-muted-foreground">
                    {group.description || "No description"} · Min {group.minSelections} / Max{" "}
                    {group.maxSelections}
                    {group.isRequired ? " · Required" : ""}
                  </p>
                  <p className="text-muted-foreground">
                    {group.options.length} options · {group.assignedItemCount} items assigned
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startAddOption(group.id)}
                    disabled={isPending}
                  >
                    <Plus className="h-4 w-4" />
                    Add option
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => startEditGroup(group)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {group.options.length > 0 ? (
                <div className="space-y-2 border-t pt-3">
                  {group.options.map((option) => (
                    <div
                      key={option.id}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <p className="text-sm">
                        {option.name}
                        <span className="text-muted-foreground">
                          {" "}
                          · {option.priceAdjustment >= 0 ? "+" : ""}$
                          {option.priceAdjustment.toFixed(2)}
                          {option.isDefault ? " · Default" : ""}
                        </span>
                      </p>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEditOption(group.id, option)}
                          disabled={isPending}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteOption(option.id)}
                          disabled={isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {optionGroupId === group.id ? (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="option-name">Option name</Label>
                      <Input
                        id="option-name"
                        value={optionForm.name}
                        onChange={(event) =>
                          setOptionForm({ ...optionForm, name: event.target.value })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option-price">Price adjustment</Label>
                      <Input
                        id="option-price"
                        type="number"
                        step="0.01"
                        value={optionForm.priceAdjustment}
                        onChange={(event) =>
                          setOptionForm({ ...optionForm, priceAdjustment: event.target.value })
                        }
                        disabled={isPending}
                      />
                    </div>
                    <div className="flex items-end gap-2 pb-2">
                      <input
                        id="option-default"
                        type="checkbox"
                        checked={optionForm.isDefault}
                        onChange={(event) =>
                          setOptionForm({ ...optionForm, isDefault: event.target.checked })
                        }
                        disabled={isPending}
                      />
                      <Label htmlFor="option-default">Default</Label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOptionSubmit}
                      disabled={isPending}
                    >
                      {editingOptionId ? "Update option" : "Create option"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={resetOptionForm}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>

      {menuItems.length > 0 && modifierGroups.length > 0 ? (
        <div className="space-y-4 rounded-lg border p-4">
          <h2 className="text-base font-semibold">Assign groups to menu item</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assign-item">Menu item</Label>
              <select
                id="assign-item"
                className="border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                value={assignItemId}
                onChange={(event) => loadAssignmentForItem(event.target.value)}
              >
                <option value="">Select item</option>
                {menuItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {assignItemId ? (
            <>
              <div className="flex flex-wrap gap-3">
                {modifierGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={assignGroupIds.includes(group.id)}
                      onChange={() => toggleAssignGroup(group.id)}
                      disabled={isPending}
                    />
                    {group.name}
                  </label>
                ))}
              </div>
              <Button type="button" onClick={handleAssign} disabled={isPending}>
                Save assignment
              </Button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
