import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary mx-auto">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl" data-testid="text-app-name">MonoPlus</CardTitle>
            <CardDescription className="mt-2">
              Sigorta Acentesi Yönetim Platformu
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            Müşteri portföyünüzü yönetin, poliçelerinizi takip edin ve AI destekli analizlerle satışlarınızı artırın.
          </p>
          <Button className="w-full" size="lg" asChild data-testid="button-login">
            <a href="/api/login">Giriş Yap</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
