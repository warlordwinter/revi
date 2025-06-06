"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

interface GoogleReviewPromptProps {
  placeId: string;
  suggestedReview?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export function GoogleReviewPrompt({
  placeId,
  suggestedReview = "I had a great experience with this business! The service was excellent and I would highly recommend them to others.",
  trigger,
  className,
}: GoogleReviewPromptProps) {
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleCopyAndOpen = async () => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(suggestedReview);

      // Show toast
      toast({
        title: "Copied to clipboard!",
        description: "Your review text has been copied.",
      });

      // Open Google Reviews in new tab
      window.open(
        `https://search.google.com/local/writereview?placeid=${placeId}`,
        "_blank"
      );

      // Close the dialog
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className={className}>
            Leave a Google Review
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Google Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            We've prepared a suggested review for you. Click the button below
            to:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Copy our suggested review to your clipboard</li>
            <li>Open Google Reviews in a new tab</li>
          </ol>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm">{suggestedReview}</p>
          </div>
          <Button onClick={handleCopyAndOpen} className="w-full">
            Copy & Open Google Reviews
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
