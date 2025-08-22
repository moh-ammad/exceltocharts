import { LinkIcon, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const AttachmentList = ({ attachments, setAttachments }) => {
  const [newAttachment, setNewAttachment] = useState({ name: "", url: "" });
  const [error, setError] = useState("");

  const addAttachment = () => {
    if (!newAttachment.name.trim() || !newAttachment.url.trim()) {
      setError("Attachment name and URL cannot be empty.");
      return;
    }
    setAttachments([...attachments, newAttachment]);
    setNewAttachment({ name: "", url: "" });
    setError("");
  };

  const updateAttachment = (index, field, value) => {
    const updated = [...attachments];
    updated[index][field] = value;
    setAttachments(updated);
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Enter attachment name"
          className="bg-gray-800 text-white px-3 py-2 rounded-md w-full"
          value={newAttachment.name}
          onChange={(e) =>
            setNewAttachment({ ...newAttachment, name: e.target.value })
          }
        />
        <input
          type="url"
          placeholder="Enter attachment URL"
          className="bg-gray-800 text-white px-3 py-2 rounded-md w-full"
          value={newAttachment.url}
          onChange={(e) =>
            setNewAttachment({ ...newAttachment, url: e.target.value })
          }
        />
        <button
          type="button"
          onClick={addAttachment}
          disabled={!newAttachment.name || !newAttachment.url}
          className={`self-center sm:self-auto px-2 py-1 rounded ${
            newAttachment.name && newAttachment.url
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-gray-600 text-gray-300 cursor-not-allowed"
          }`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}

      {attachments.map((att, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row gap-2 items-center"
        >
          <LinkIcon className="text-white" />
          <input
            type="text"
            value={att.name}
            onChange={(e) => updateAttachment(index, "name", e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-md w-full"
            placeholder="Attachment name"
          />
          <input
            type="url"
            value={att.url}
            onChange={(e) => updateAttachment(index, "url", e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-md w-full"
            placeholder="Attachment URL"
          />
          <button type="button" onClick={() => removeAttachment(index)}>
            <Trash2 className="text-red-500" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default AttachmentList;
