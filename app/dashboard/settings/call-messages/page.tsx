"use client";

import * as React from "react";
import { MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { Modal } from "@/components/overlay";
import { useDashboardContext } from "@/components/dashboard";
import { Button, Card, Input, Select } from "@/components/ui";
import { useCallStore } from "@/store/callStore";

type EditorState = {
  id?: string;
  label: string;
  priority: "routine" | "priority" | "critical";
};

const defaultEditorState: EditorState = {
  label: "",
  priority: "routine",
};

export default function CallMessagesSettingsPage() {
  const { currentUser } = useDashboardContext();
  const getMessagesForDoctor = useCallStore((state) => state.getMessagesForDoctor);
  const addCustomMessage = useCallStore((state) => state.addCustomMessage);
  const updateCustomMessage = useCallStore((state) => state.updateCustomMessage);
  const deleteCustomMessage = useCallStore((state) => state.deleteCustomMessage);

  const messages = getMessagesForDoctor(currentUser.id);
  const [editorState, setEditorState] = React.useState<EditorState>(defaultEditorState);
  const [open, setOpen] = React.useState(false);

  function openAddModal() {
    setEditorState(defaultEditorState);
    setOpen(true);
  }

  function openEditModal(message: { id: string; label: string; priority: "routine" | "priority" | "critical" }) {
    setEditorState(message);
    setOpen(true);
  }

  async function handleSave() {
    const value = editorState.label.trim();
    if (!value) {
      return;
    }

    if (editorState.id) {
      await updateCustomMessage(currentUser.id, editorState.id, { label: value, priority: editorState.priority });
    } else {
      await addCustomMessage(currentUser.id, { label: value, priority: editorState.priority });
    }

    setOpen(false);
    setEditorState(defaultEditorState);
  }

  if (currentUser.role !== "doctor") {
    return (
      <Card className="p-4 shadow-sm">
        <p className="text-base font-medium text-[#0F172A]">Call Messages</p>
        <p className="mt-1 text-sm text-[#64748B]">This setting is available only in the doctor module.</p>
      </Card>
    );
  }

  return (
    <section className="space-y-6">
      <Card className="p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-[24px] font-medium leading-8 text-[#0F172A]">Call Messages</h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Manage doctor to hospital operational messages shown on the Calls page.
            </p>
          </div>
          <Button
            variant="primary"
            leftIcon={<MessageSquarePlus className="size-4" />}
            onClick={openAddModal}
          >
            Add Message
          </Button>
        </div>
      </Card>

      <div className="grid gap-4">
        {messages.map((message, index) => (
          <Card key={message.id} className="p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-base font-medium text-[#0F172A]">{message.label}</p>
                <p className="mt-1 text-sm text-[#64748B]">Message {index + 1}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" leftIcon={<Pencil className="size-4" />} onClick={() => openEditModal(message)}>
                  Edit
                </Button>
                <Button
                  variant="dangerOutline"
                  size="sm"
                  leftIcon={<Trash2 className="size-4" />}
                  onClick={() => {
                    void deleteCustomMessage(currentUser.id, message.id);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        open={open}
        title={editorState.id ? "Edit call message" : "Add call message"}
        description="Keep each message short and clear for hospital staff."
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                void handleSave();
              }}
            >
              Save
            </Button>
          </>
        }
        bodyClassName="space-y-4"
      >
        <label className="grid gap-2">
          <span className="text-xs font-medium text-[#64748B]">Message</span>
          <Input
            value={editorState.label}
            onChange={(event) => setEditorState((state) => ({ ...state, label: event.target.value }))}
            placeholder="Example: Call Next Patient"
          />
        </label>
        <label className="grid gap-2">
          <span className="text-xs font-medium text-[#64748B]">Priority</span>
          <Select
            value={editorState.priority}
            onChange={(event) =>
              setEditorState((state) => ({ ...state, priority: event.target.value as EditorState["priority"] }))
            }
            options={[
              { label: "Routine", value: "routine" },
              { label: "Priority", value: "priority" },
              { label: "Critical", value: "critical" },
            ]}
          />
        </label>
      </Modal>
    </section>
  );
}
