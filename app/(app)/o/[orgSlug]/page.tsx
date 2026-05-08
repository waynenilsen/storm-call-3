import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrgOverviewPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-medium">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace for{" "}
          <span className="font-mono text-foreground">{orgSlug}</span>. Use the
          sidebar for contacts and organization settings.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Getting started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add contacts under{" "}
          <strong className="text-foreground">Contacts</strong>. Rename or
          delete the org under{" "}
          <strong className="text-foreground">Organization</strong> (owners
          only).
        </CardContent>
      </Card>
    </div>
  );
}
