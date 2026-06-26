"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PlanType } from "@/types";

const PLAN_OPTIONS: PlanType[] = ["SOLO", "BASIC", "PRO", "CUSTOM"];

export function ChangePlanDialog({
  open,
  currentPlan,
  isLoading,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  currentPlan?: PlanType;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (planType: PlanType) => void;
}) {
  const [planType, setPlanType] = useState<PlanType | undefined>();
  const selectedPlan = planType ?? currentPlan ?? "BASIC";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar plano</DialogTitle>
          <DialogDescription>
            Essa ação altera o plano do tenant sem passar pelo checkout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Plano</Label>
          <Select value={selectedPlan} onValueChange={(value) => setPlanType(value as PlanType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLAN_OPTIONS.map((plan) => (
                <SelectItem key={plan} value={plan}>
                  {plan}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(selectedPlan)} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ExtendTrialDialog({
  open,
  isLoading,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  isLoading?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (additionalDays: number) => void;
}) {
  const [days, setDays] = useState("7");

  const parsedDays = Number(days);
  const invalid = !Number.isInteger(parsedDays) || parsedDays < 1 || parsedDays > 365;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Estender trial</DialogTitle>
          <DialogDescription>
            Informe quantos dias serão adicionados ao período de teste.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="trial-days">Dias adicionais</Label>
          <Input
            id="trial-days"
            type="number"
            min={1}
            max={365}
            value={days}
            onChange={(event) => setDays(event.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={() => onSubmit(parsedDays)} disabled={isLoading || invalid}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Estender
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
