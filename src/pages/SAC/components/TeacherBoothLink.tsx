
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, Share2 } from 'lucide-react';

const TeacherBoothLink: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Get the current origin for the link
  const origin = window.location.origin;
  const teacherLink = `${origin}/teacher`;
  
  const copyLink = () => {
    navigator.clipboard.writeText(teacherLink)
      .then(() => {
        setCopied(true);
        toast.success('Link copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(error => {
        console.error('Error copying text: ', error);
        toast.error('Failed to copy link');
      });
  };
  
  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Create a FraserPay Booth',
          text: 'Create your booth for the upcoming school event using FraserPay',
          url: teacherLink,
        });
        toast.success('Link shared successfully');
      } catch (error) {
        console.error('Error sharing: ', error);
      }
    } else {
      copyLink();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Share2 className="mr-2 h-4 w-4" />
          Share Teacher Booth Link
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Teacher Booth Creation Link</DialogTitle>
          <DialogDescription>
            Share this link with teachers to allow them to create booths for the event.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">
              Link
            </Label>
            <Input
              id="link"
              value={teacherLink}
              readOnly
              className="font-mono"
            />
          </div>
          <Button type="button" size="sm" onClick={copyLink} className="px-3">
            <span className="sr-only">Copy</span>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <DialogFooter className="flex gap-2 sm:justify-between sm:gap-0 mt-4">
          <DialogTrigger asChild>
            <Button variant="outline">Close</Button>
          </DialogTrigger>
          <Button type="button" onClick={shareLink}>
            <Share2 className="mr-2 h-4 w-4" />
            {navigator.share ? 'Share' : 'Copy'} Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TeacherBoothLink;
