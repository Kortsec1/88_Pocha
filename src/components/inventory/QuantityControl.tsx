"use client";

import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

const steps = [-10, -5, -1, 1, 5, 10];

export function QuantityControl({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {steps.map((step) => (
        <Button
          key={step}
          type="button"
          size="lg"
          variant={step < 0 ? "secondary" : "primary"}
          onClick={() => onChange(Math.max(0, value + step))}
          className="text-lg"
        >
          {step < 0 ? <Minus size={18} /> : <Plus size={18} />}
          {Math.abs(step)}
        </Button>
      ))}
    </div>
  );
}
