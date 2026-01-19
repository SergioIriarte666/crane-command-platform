import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title?: string;
  description?: string;
  error?: unknown;
  onRetry?: () => void;
};

function getErrorMessage(error: unknown) {
  if (!error) return null;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function QueryErrorState({
  title = "Ocurrió un error",
  description = "No se pudieron cargar los datos. Intenta nuevamente.",
  error,
  onRetry,
}: Props) {
  const message = getErrorMessage(error);

  return (
    <Card>
      <CardContent className="py-10">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center gap-3">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          {message ? (
            <pre className="mt-2 w-full whitespace-pre-wrap rounded-md bg-muted p-3 text-left text-xs text-foreground/80">
              {message}
            </pre>
          ) : null}

          {onRetry ? (
            <div className="mt-2">
              <Button onClick={onRetry}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
