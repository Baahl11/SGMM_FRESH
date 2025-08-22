// Test simple para verificar imports UI
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TestPage() {
  return (
    <div>
      <h1>Test de imports UI</h1>
      <Card>
        <Button>Test button</Button>
      </Card>
    </div>
  );
}
