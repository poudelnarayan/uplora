"use client";

import styles from "./TeamRenameForm.module.css";

interface TeamRenameFormProps {
  teamId: string;
  renameValue: string;
  onRenameValueChange: (value: string) => void;
  onSaveRename: (teamId: string) => void;
  onCancelRename: () => void;
}

export default function TeamRenameForm({
  teamId,
  renameValue,
  onRenameValueChange,
  onSaveRename,
  onCancelRename
}: TeamRenameFormProps) {
  return (
    <div className={styles.container}>
      <input 
        value={renameValue} 
        onChange={(e) => onRenameValueChange(e.target.value)} 
        className={styles.input}
        maxLength={80} 
      />
      <button 
        onClick={() => onSaveRename(teamId)} 
        className={styles.saveButton}
      >
        Save
      </button>
      <button 
        onClick={onCancelRename} 
        className={styles.cancelButton}
      >
        Cancel
      </button>
    </div>
  );
}