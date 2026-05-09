"use client";
import React, { useState, useRef } from "react";
import { UserProject } from "../types";

interface Props {
  onAdd: (project: UserProject) => void;
  onClose: () => void;
}

export function AddProjectModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState("");
  const [link, setLink] = useState("");
  const [desc, setDesc] = useState("");
  const [imageBase64, setImageBase64] = useState<string | undefined>(undefined);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; desc?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImageBase64(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImageFile(file);
  }

  function validate() {
    const errs: { name?: string; desc?: string } = {};
    if (!name.trim()) errs.name = "Project name is required.";
    if (!desc.trim()) errs.desc = "Description is required.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    const project: UserProject = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      link: link.trim(),
      description: desc.trim(),
      imageBase64,
    };
    onAdd(project);
    onClose();
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.65rem 0.85rem",
    borderRadius: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    color: "#f0f0ff",
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: "100%", maxWidth: 500,
        background: "rgba(14,14,24,0.98)",
        border: "1px solid rgba(124,111,247,0.3)",
        borderRadius: "18px",
        boxShadow: "0 0 60px rgba(124,111,247,0.15)",
        padding: "2rem",
        display: "flex", flexDirection: "column", gap: "1.25rem",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1.1rem", background: "linear-gradient(135deg, #c4b5fd, #67e8f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Add Project
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Showcase your work to personalize your interview
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-muted)", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
        </div>

        {/* Image Upload */}
        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.5rem" }}>
            Project Image <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(optional)</span>
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragging ? "rgba(124,111,247,0.7)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: "12px",
              background: dragging ? "rgba(124,111,247,0.08)" : "rgba(255,255,255,0.02)",
              cursor: "pointer",
              transition: "all 0.2s",
              overflow: "hidden",
              minHeight: 110,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Project preview"
                style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block" }}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "1.5rem" }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.35rem" }}>🖼️</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  Click or drag & drop an image
                </div>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
          />
          {imagePreview && (
            <button
              onClick={() => { setImageBase64(undefined); setImagePreview(null); }}
              style={{ marginTop: "0.4rem", background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: "0.75rem", padding: 0 }}
            >
              ✕ Remove image
            </button>
          )}
        </div>

        {/* Name */}
        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
            Project Name <span style={{ color: "#f87171" }}>*</span>
          </label>
          <input
            id="project-name-input"
            type="text"
            placeholder="e.g. Portfolio Website"
            value={name}
            onChange={(e) => { setName(e.target.value); if (errors.name) setErrors(p => ({ ...p, name: undefined })); }}
            style={{ ...inputStyle, borderColor: errors.name ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)" }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,111,247,0.6)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = errors.name ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)")}
          />
          {errors.name && <p style={{ color: "#f87171", fontSize: "0.72rem", marginTop: "0.3rem" }}>{errors.name}</p>}
        </div>

        {/* Link */}
        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
            Link <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(deployed or GitHub)</span>
          </label>
          <input
            id="project-link-input"
            type="url"
            placeholder="https://github.com/you/project"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,111,247,0.6)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)", display: "block", marginBottom: "0.4rem" }}>
            Description <span style={{ color: "#f87171" }}>*</span>
          </label>
          <textarea
            id="project-desc-input"
            placeholder="Brief description of what this project does..."
            value={desc}
            onChange={(e) => { setDesc(e.target.value); if (errors.desc) setErrors(p => ({ ...p, desc: undefined })); }}
            rows={3}
            style={{
              ...inputStyle,
              resize: "vertical",
              borderColor: errors.desc ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(124,111,247,0.6)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = errors.desc ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.1)")}
          />
          {errors.desc && <p style={{ color: "#f87171", fontSize: "0.72rem", marginTop: "0.3rem" }}>{errors.desc}</p>}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            style={{ padding: "0.6rem 1.25rem", borderRadius: "100px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, transition: "all 0.2s" }}
          >
            Cancel
          </button>
          <button
            id="add-project-submit-btn"
            onClick={handleSubmit}
            style={{ padding: "0.6rem 1.5rem", borderRadius: "100px", background: "linear-gradient(135deg, #7c6ff7, #22d3ee)", border: "none", color: "#fff", cursor: "pointer", fontSize: "0.82rem", fontWeight: 700, transition: "all 0.2s", boxShadow: "0 0 20px rgba(124,111,247,0.3)" }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 30px rgba(124,111,247,0.5)")}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "0 0 20px rgba(124,111,247,0.3)")}
          >
            ✦ Add Project
          </button>
        </div>
      </div>
    </div>
  );
}
