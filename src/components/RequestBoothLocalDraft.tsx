import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  getVersionedStorageItem,
  setVersionedStorageItem,
} from "@/utils/storageManager";
import { removeStorageItem } from "@/utils/storage";

type RequestBoothLocalDraftProps<T> = {
  storageKey: string;
  draft: T;
  onRestore: (draft: T) => void;
  maxAgeMs?: number;
  autoSave?: boolean;
  debounceMs?: number;
  disabled?: boolean;
  showControls?: boolean;
};

export function RequestBoothLocalDraft<T>({
  storageKey,
  draft,
  onRestore,
  maxAgeMs = 1000 * 60 * 60 * 24 * 7,
  autoSave = true,
  debounceMs = 500,
  disabled = false,
  showControls = true,
}: RequestBoothLocalDraftProps<T>) {
  const { toast } = useToast();
  const restoredRef = useRef(false);
  const saveTimerRef = useRef<number | null>(null);

  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);

  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const savedDraft = getVersionedStorageItem<T | null>(storageKey, null);
    if (savedDraft) {
      onRestore(savedDraft);
      toast({
        title: "Draft restored",
        description: "We found a saved booth request draft on this device.",
        variant: "default",
      });
    }
  }, [storageKey, onRestore, toast]);

  useEffect(() => {
    if (!autoSave) return;
    if (disabled) return;

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      setVersionedStorageItem(storageKey, draft, maxAgeMs);
      setLastSavedAt(Date.now());
    }, debounceMs);

    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [storageKey, draft, maxAgeMs, autoSave, debounceMs, disabled]);

  const handleSaveNow = () => {
    if (disabled) return;
    setVersionedStorageItem(storageKey, draft, maxAgeMs);
    setLastSavedAt(Date.now());
    toast({
      title: "Draft saved locally",
      description: "Your progress has been saved on this device.",
      variant: "default",
    });
  };

  const handleClear = () => {
    if (disabled) return;
    removeStorageItem(storageKey);
    setLastSavedAt(null);
    toast({
      title: "Draft cleared",
      description: "Local draft data for this form has been removed.",
      variant: "default",
    });
  };

  if (!showControls) return null;

  return (
    <div className="flex items-center justify-between gap-x-2 my-2 mx-2">
      <div className="text-xs text-slate-600">
        {lastSavedAt ? (
          <>Saved locally just now.</>
        ) : (
          <>Local draft is enabled. Autosave will keep progress.</>
        )}
      </div>
      <div className="flex items-center gap-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSaveNow}
          disabled={disabled}
        >
          Save draft
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={handleClear}
          disabled={disabled}
        >
          Clear draft
        </Button>
      </div>
    </div>
  );
}

