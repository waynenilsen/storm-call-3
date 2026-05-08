export default function ConversationsEmptyState() {
  return (
    <div className="flex h-full items-center justify-center p-12">
      <div className="max-w-sm text-center">
        <p className="text-base font-medium">Select a conversation</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Pick a thread from the inbox on the left to read or reply.
        </p>
      </div>
    </div>
  );
}
