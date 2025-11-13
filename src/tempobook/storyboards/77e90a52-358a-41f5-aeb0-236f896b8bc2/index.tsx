import UploadModal from "@/components/UploadModal";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function UploadModalStoryboard() {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white min-h-screen p-8">
      <Button onClick={() => setOpen(true)}>Open Upload Modal</Button>
      <UploadModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
