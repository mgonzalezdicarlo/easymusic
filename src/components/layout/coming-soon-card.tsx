import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ComingSoonCardProps = {
  epic: string;
  items: readonly string[];
};

export function ComingSoonCard({ epic, items }: ComingSoonCardProps) {
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>Planned for {epic}.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
