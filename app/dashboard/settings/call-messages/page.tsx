"use client";

import * as React from "react";
import { FolderCog, MessageSquarePlus, PencilLine, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { PageHero, useDashboardContext } from "@/components/dashboard";
import { useI18n } from "@/components/i18n";
import { ConfirmationDialog } from "@/components/overlay/ConfirmationDialog";
import { Modal } from "@/components/overlay";
import { Button, Card, Input, Table } from "@/components/ui";
import { localizeCallMessageLabel, type OperationalMessageTemplate } from "@/lib/calls";
import { logger } from "@/lib/logger";
import { selectDoctorMessages, useCallStore } from "@/store/callStore";

type EditorState = {
  id?: string;
  label: string;
};

type MessageRow = OperationalMessageTemplate & Record<string, unknown>;

const defaultEditorState: EditorState = {
  label: "",
};

const callMessagePageCopy = {
  en: {
    title: "Custom Call Messages",
    description: "Manage doctor to hospital operational message templates shown on the calls page.",
    statsLabel: "Messages",
    customLabel: "Custom UI",
    yes: "Yes",
    messageField: "Message",
    fieldPlaceholder: "Example: Call Next Patient",
    add: "Add Message",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete",
    cancel: "Cancel",
    save: "Save",
    active: "Active",
    listTitle: "Message Directory",
    empty: "No call messages available.",
    doctorOnly: "This setting is available only in the doctor module.",
    modalAddTitle: "Add call message",
    modalEditTitle: "Edit call message",
    modalDescription: "Keep each message short and clear for hospital staff.",
    deleteTitle: "Delete call message",
    deleteDescription: "Are you sure you want to delete this call message?",
    added: "Call message added successfully.",
    updated: "Call message updated successfully.",
    deleted: "Call message deleted successfully.",
    addError: "Unable to add the call message.",
    updateError: "Unable to update the call message.",
    deleteError: "Unable to delete the call message.",
  },
  ta: {
    title: "தனிப்பயன் அழைப்பு செய்திகள்",
    description: "அழைப்புகள் பக்கத்தில் காட்டப்படும் மருத்துவர் முதல் மருத்துவமனை செயல்பாட்டு செய்தி மாதிரிகளை நிர்வகிக்கவும்.",
    statsLabel: "செய்திகள்",
    customLabel: "தனிப்பயன் UI",
    yes: "ஆம்",
    messageField: "செய்தி",
    fieldPlaceholder: "உதாரணம்: அடுத்த நோயாளியை அழைக்கவும்",
    add: "செய்தியைச் சேர்க்கவும்",
    actions: "செயல்கள்",
    edit: "திருத்து",
    delete: "நீக்கு",
    cancel: "ரத்து",
    save: "சேமி",
    active: "செயலில்",
    listTitle: "செய்தி அடைவு",
    empty: "அழைப்பு செய்திகள் இல்லை.",
    doctorOnly: "இந்த அமைப்பு மருத்துவர் பகுதியில் மட்டுமே கிடைக்கும்.",
    modalAddTitle: "அழைப்பு செய்தியைச் சேர்க்கவும்",
    modalEditTitle: "அழைப்பு செய்தியைத் திருத்தவும்",
    modalDescription: "ஒவ்வொரு செய்தியும் மருத்துவமனை பணியாளர்களுக்கு சுருக்கமாகவும் தெளிவாகவும் இருக்கட்டும்.",
    deleteTitle: "அழைப்பு செய்தியை நீக்கு",
    deleteDescription: "இந்த அழைப்பு செய்தியை நிச்சயமாக நீக்கவா?",
    added: "அழைப்பு செய்தி வெற்றிகரமாக சேர்க்கப்பட்டது.",
    updated: "அழைப்பு செய்தி வெற்றிகரமாக புதுப்பிக்கப்பட்டது.",
    deleted: "அழைப்பு செய்தி வெற்றிகரமாக நீக்கப்பட்டது.",
    addError: "அழைப்பு செய்தியைச் சேர்க்க முடியவில்லை.",
    updateError: "அழைப்பு செய்தியைப் புதுப்பிக்க முடியவில்லை.",
    deleteError: "அழைப்பு செய்தியை நீக்க முடியவில்லை.",
  },
  hi: {
    title: "कस्टम कॉल संदेश",
    description: "कॉल पेज पर दिखने वाले डॉक्टर से अस्पताल संचालन संदेश टेम्पलेट प्रबंधित करें।",
    statsLabel: "संदेश",
    customLabel: "कस्टम UI",
    yes: "हाँ",
    messageField: "संदेश",
    fieldPlaceholder: "उदाहरण: अगले मरीज को बुलाइए",
    add: "संदेश जोड़ें",
    actions: "कार्रवाई",
    edit: "संपादित करें",
    delete: "हटाएँ",
    cancel: "रद्द करें",
    save: "सहेजें",
    active: "सक्रिय",
    listTitle: "संदेश निर्देशिका",
    empty: "कोई कॉल संदेश उपलब्ध नहीं है।",
    doctorOnly: "यह सेटिंग केवल डॉक्टर मॉड्यूल में उपलब्ध है।",
    modalAddTitle: "कॉल संदेश जोड़ें",
    modalEditTitle: "कॉल संदेश संपादित करें",
    modalDescription: "हर संदेश अस्पताल स्टाफ के लिए छोटा और स्पष्ट रखें।",
    deleteTitle: "कॉल संदेश हटाएँ",
    deleteDescription: "क्या आप वाकई इस कॉल संदेश को हटाना चाहते हैं?",
    added: "कॉल संदेश सफलतापूर्वक जोड़ा गया।",
    updated: "कॉल संदेश सफलतापूर्वक अपडेट हुआ।",
    deleted: "कॉल संदेश सफलतापूर्वक हटाया गया।",
    addError: "कॉल संदेश जोड़ने में असमर्थ।",
    updateError: "कॉल संदेश अपडेट करने में असमर्थ।",
    deleteError: "कॉल संदेश हटाने में असमर्थ।",
  },
  ml: {
    title: "കസ്റ്റം കോൾ സന്ദേശങ്ങൾ",
    description: "കോൾസ് പേജിൽ കാണിക്കുന്ന ഡോക്ടർ മുതൽ ആശുപത്രിയിലേക്കുള്ള പ്രവർത്തന സന്ദേശ ടെംപ്ലേറ്റുകൾ നിയന്ത്രിക്കുക.",
    statsLabel: "സന്ദേശങ്ങൾ",
    customLabel: "കസ്റ്റം UI",
    yes: "അതെ",
    messageField: "സന്ദേശം",
    fieldPlaceholder: "ഉദാഹരണം: അടുത്ത രോഗിയെ വിളിക്കൂ",
    add: "സന്ദേശം ചേർക്കുക",
    actions: "പ്രവർത്തനങ്ങൾ",
    edit: "തിരുത്തുക",
    delete: "ഇല്ലാതാക്കുക",
    cancel: "റദ്ദാക്കുക",
    save: "സേവ് ചെയ്യുക",
    active: "സജീവം",
    listTitle: "സന്ദേശ ഡയറക്ടറി",
    empty: "കോൾ സന്ദേശങ്ങളൊന്നുമില്ല.",
    doctorOnly: "ഈ ക്രമീകരണം ഡോക്ടർ മോഡ്യൂളിൽ മാത്രമേ ലഭ്യമാകൂ.",
    modalAddTitle: "കോൾ സന്ദേശം ചേർക്കുക",
    modalEditTitle: "കോൾ സന്ദേശം തിരുത്തുക",
    modalDescription: "ഓരോ സന്ദേശവും ആശുപത്രി ജീവനക്കാർക്ക് ചുരുക്കവും വ്യക്തവുമാകട്ടെ.",
    deleteTitle: "കോൾ സന്ദേശം ഇല്ലാതാക്കുക",
    deleteDescription: "ഈ കോൾ സന്ദേശം ഇല്ലാതാക്കണമെന്ന് ഉറപ്പാണോ?",
    added: "കോൾ സന്ദേശം വിജയകരമായി ചേർത്തു.",
    updated: "കോൾ സന്ദേശം വിജയകരമായി പുതുക്കി.",
    deleted: "കോൾ സന്ദേശം വിജയകരമായി ഇല്ലാതാക്കി.",
    addError: "കോൾ സന്ദേശം ചേർക്കാനായില്ല.",
    updateError: "കോൾ സന്ദേശം പുതുക്കാനായില്ല.",
    deleteError: "കോൾ സന്ദേശം ഇല്ലാതാക്കാനായില്ല.",
  },
} as const;

export default function CallMessagesSettingsPage() {
  const { currentUser } = useDashboardContext();
  const { language } = useI18n();
  const copy = callMessagePageCopy[language] || callMessagePageCopy.en;
  const messages = useCallStore(React.useMemo(() => selectDoctorMessages(currentUser.id), [currentUser.id]));
  const addCustomMessage = useCallStore((state) => state.addCustomMessage);
  const updateCustomMessage = useCallStore((state) => state.updateCustomMessage);
  const deleteCustomMessage = useCallStore((state) => state.deleteCustomMessage);
  const [editorState, setEditorState] = React.useState<EditorState>(defaultEditorState);
  const [open, setOpen] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<OperationalMessageTemplate | null>(null);

  function openAddModal() {
    setEditorState(defaultEditorState);
    setOpen(true);
  }

  function openEditModal(message: { id: string; label: string }) {
    setEditorState({ id: message.id, label: message.label });
    setOpen(true);
  }

  async function handleSave() {
    const value = editorState.label.trim();
    if (!value) {
      return;
    }

    try {
      if (editorState.id) {
        await updateCustomMessage(currentUser.id, editorState.id, { label: value });
        logger.success(copy.updated, {
          source: "settings.call-messages",
          toast: true,
        });
      } else {
        await addCustomMessage(currentUser.id, { label: value });
        logger.success(copy.added, {
          source: "settings.call-messages",
          toast: true,
        });
      }

      setOpen(false);
      setEditorState(defaultEditorState);
    } catch (error) {
      logger.error(editorState.id ? copy.updateError : copy.addError, {
        source: "settings.call-messages",
        data: { message: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteCustomMessage(currentUser.id, deleteTarget.id);
      logger.warn(copy.deleted, {
        source: "settings.call-messages",
        toast: true,
        destructive: true,
      });
      setDeleteTarget(null);
    } catch (error) {
      logger.error(copy.deleteError, {
        source: "settings.call-messages",
        data: { message: error instanceof Error ? error.message : String(error) },
        toast: true,
      });
    }
  }

  if (currentUser.role !== "doctor") {
    return (
      <Card className="p-4 shadow-sm">
        <p className="text-base font-medium text-[#0F172A]">{copy.title}</p>
        <p className="mt-1 text-sm text-[#64748B]">{copy.doctorOnly}</p>
      </Card>
    );
  }

  const messageRows: MessageRow[] = messages.map((message) => ({ ...message }));

  return (
    <section className="space-y-6">
      <PageHero
        backHref="/dashboard/settings"
        backLabel={copy.cancel}
        title={copy.title}
        description={copy.description}
        icon={<MessageSquarePlus className="size-5" />}
        imageSrc="https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=900&q=80"
        imageAlt={copy.title}
        stats={[
          { label: copy.statsLabel, value: String(messages.length) },
          { label: copy.customLabel, value: copy.yes },
        ]}
      />

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[#0F172A]">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#ECFEFF] text-[#0EA5A4]">
              <MessageSquarePlus className="size-4" />
            </span>
            {copy.messageField}
          </div>
          <Button className="rounded-md" leftIcon={<Plus className="size-4" />} onClick={openAddModal}>
            {copy.add}
          </Button>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#0F172A]">
          <span className="flex size-8 items-center justify-center rounded-lg bg-[#ECFEFF] text-[#0EA5A4]">
            <FolderCog className="size-4" />
          </span>
          {copy.listTitle}
        </div>
        <Table<MessageRow>
          data={messageRows}
          rowKey="id"
          pageSize={6}
          emptyMessage={copy.empty}
          columns={[
            {
              key: "label",
              header: copy.messageField,
              sortable: true,
              sortValue: (row) => row.label,
              render: (row) => (
                <div className="flex items-center gap-3 text-[#0F172A]">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-[#ECFEFF] text-[#0EA5A4] shadow-sm">
                    <MessageSquarePlus className="size-4" />
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{localizeCallMessageLabel(row.label, language)}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#F0FDFA] px-2 py-1 text-xs font-medium text-[#0F766E]">
                      <Sparkles className="size-3.5" />
                      {copy.active}
                    </span>
                  </div>
                </div>
              ),
            },
            {
              key: "actions",
              header: copy.actions,
              className: "w-[220px]",
              render: (row) => (
                <div className="flex items-center justify-start gap-2 whitespace-nowrap">
                  <button
                    type="button"
                    className="focus-ring inline-flex h-9 items-center gap-1 rounded-md bg-[#0EA5A4] px-3 text-sm font-medium text-white transition hover:bg-[#0d9488]"
                    onClick={() => openEditModal(row)}
                  >
                    <PencilLine className="size-4" />
                    {copy.edit}
                  </button>
                  <button
                    type="button"
                    className="focus-ring inline-flex h-9 items-center gap-1 rounded-md border border-[#EF4444] bg-transparent px-3 text-sm font-medium text-[#EF4444] transition hover:bg-red-50"
                    onClick={() => setDeleteTarget(row)}
                  >
                    <Trash2 className="size-4" />
                    {copy.delete}
                  </button>
                </div>
              ),
            },
          ]}
        />
      </Card>

      <Modal
        open={open}
        title={editorState.id ? copy.modalEditTitle : copy.modalAddTitle}
        description={copy.modalDescription}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" leftIcon={<X className="size-4" />} onClick={() => setOpen(false)}>
              {copy.cancel}
            </Button>
            <Button
              variant="primary"
              leftIcon={<Save className="size-4" />}
              onClick={() => {
                void handleSave();
              }}
            >
              {copy.save}
            </Button>
          </>
        }
        bodyClassName="space-y-4"
      >
        <label className="grid gap-2">
          <span className="text-xs font-medium text-[#64748B]">{copy.messageField}</span>
          <Input
            value={editorState.label}
            onChange={(event) => setEditorState((state) => ({ ...state, label: event.target.value }))}
            placeholder={copy.fieldPlaceholder}
          />
        </label>
      </Modal>

      <ConfirmationDialog
        open={Boolean(deleteTarget)}
        title={copy.deleteTitle}
        description={copy.deleteDescription}
        confirmLabel={copy.delete}
        cancelLabel={copy.cancel}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
