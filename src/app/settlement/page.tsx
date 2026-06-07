"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { MobileShell } from "@/components/layout/MobileShell";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuthUser, useOperations } from "@/lib/useInventory";
import type { PaymentEntry, PaymentMethod } from "@/lib/types";

function currency(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

function total(entries: PaymentEntry[]) {
  return entries.reduce((sum, entry) => sum + entry.amount, 0);
}

async function fileToDataUrl(file?: File | null) {
  if (!file) return undefined;
  const source = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new window.Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = reject;
      nextImage.src = source;
    });
    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("이미지를 처리할 수 없습니다.");
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", 0.74);
  } finally {
    URL.revokeObjectURL(source);
  }
}

async function makePreview(file?: File | null) {
  if (!file) return undefined;
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function PaymentForm({ label, method, onSubmit }: { label: string; method: PaymentMethod; onSubmit: (method: PaymentMethod, input: { amount: number; memo?: string; receiptImage?: string }) => Promise<void> }) {
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | undefined>();
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleReceipt(file?: File | null) {
    setReceipt(file || null);
    setError("");
    setPreview(await makePreview(file));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!parsedAmount) return;
    setSaving(true);
    setError("");
    try {
      const receiptImage = await fileToDataUrl(receipt);
      await onSubmit(method, { amount: parsedAmount, memo: memo.trim() || undefined, receiptImage });
      setAmount("");
      setMemo("");
      setReceipt(null);
      setPreview(undefined);
      setFileInputKey((value) => value + 1);
    } catch {
      setError("영수증 사진 저장에 실패했습니다. 사진을 다시 선택해 주세요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="space-y-3">
      <div>
        <p className="text-sm font-bold text-accent">{label}</p>
        <h2 className="mt-1 text-xl font-black">결제 기록 추가</h2>
      </div>
      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input inputMode="numeric" placeholder="금액" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} required />
        <Input placeholder="메모 또는 영수증 번호" value={memo} onChange={(event) => setMemo(event.target.value)} />
        <label className="block rounded-lg border border-dashed border-border bg-elevated p-4 text-sm font-semibold text-secondary">
          <span>{receipt ? `첨부됨 · ${receipt.name}` : "영수증 사진 첨부"}</span>
          {preview ? <Image className="mt-3 h-28 w-full rounded-lg object-cover" src={preview} alt="선택한 영수증" width={320} height={112} unoptimized /> : null}
          <input key={fileInputKey} className="sr-only" type="file" accept="image/*" capture="environment" onChange={(event) => handleReceipt(event.target.files?.[0] || null)} />
        </label>
        {error ? <p className="text-sm font-semibold text-danger">{error}</p> : null}
        <Button className="w-full" size="lg" disabled={saving}>{saving ? "저장 중" : `${label} 저장`}</Button>
      </form>
    </Card>
  );
}

export default function SettlementPage() {
  const { user } = useAuthUser();
  const { settlement, updateFruitCount, addPaymentEntry, removePaymentEntry } = useOperations(user);
  const cashTotal = useMemo(() => total(settlement.cashEntries), [settlement.cashEntries]);
  const transferTotal = useMemo(() => total(settlement.transferEntries), [settlement.transferEntries]);
  const combinedTotal = cashTotal + transferTotal;

  return (
    <MobileShell>
      <header className="mb-5">
        <p className="text-sm text-secondary">현금, 계좌이체, 모듬과일 수량</p>
        <h1 className="mt-1 text-3xl font-black">일일 정산</h1>
      </header>

      <section className="grid grid-cols-2 gap-2">
        <Card className="bg-accent text-white">
          <p className="text-sm font-bold text-white/80">현금+계좌</p>
          <div className="mt-2 text-3xl font-black">{currency(combinedTotal)}</div>
        </Card>
        <Card>
          <p className="text-sm font-bold text-secondary">모듬과일</p>
          <div className="mt-2 flex items-center gap-2">
            <Button variant="secondary" onClick={() => updateFruitCount(settlement.fruitCount - 1)}>-</Button>
            <Input className="text-center text-xl font-black" inputMode="numeric" value={settlement.fruitCount} onChange={(event) => updateFruitCount(Number(event.target.value || 0))} />
            <Button variant="secondary" onClick={() => updateFruitCount(settlement.fruitCount + 1)}>+</Button>
          </div>
        </Card>
      </section>

      <section className="mt-3 grid grid-cols-2 gap-2">
        <Card>
          <p className="text-sm text-secondary">현금 합계</p>
          <div className="mt-1 text-2xl font-black">{currency(cashTotal)}</div>
          <p className="mt-1 text-xs text-secondary">{settlement.cashEntries.length}건</p>
        </Card>
        <Card>
          <p className="text-sm text-secondary">계좌이체 합계</p>
          <div className="mt-1 text-2xl font-black">{currency(transferTotal)}</div>
          <p className="mt-1 text-xs text-secondary">{settlement.transferEntries.length}건</p>
        </Card>
      </section>

      <section className="mt-5 space-y-3">
        <PaymentForm label="현금" method="cash" onSubmit={addPaymentEntry} />
        <PaymentForm label="계좌이체" method="transfer" onSubmit={addPaymentEntry} />
      </section>

      <section className="mt-6 space-y-4">
        {[
          ["현금 내역", "cash", settlement.cashEntries] as const,
          ["계좌이체 내역", "transfer", settlement.transferEntries] as const,
        ].map(([label, method, entries]) => (
          <div key={method}>
            <h2 className="mb-2 text-lg font-bold">{label}</h2>
            <div className="space-y-2">
              {entries.length ? entries.map((entry) => (
                <Card key={entry.id} className="p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-black">{currency(entry.amount)}</div>
                      <div className="text-xs text-secondary">{new Date(entry.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} · {entry.createdByName}</div>
                      {entry.memo ? <p className="mt-1 text-sm text-secondary">{entry.memo}</p> : null}
                    </div>
                    {entry.receiptImage ? <Image className="h-14 w-14 rounded-lg object-cover" src={entry.receiptImage} alt="영수증" width={56} height={56} unoptimized /> : null}
                  </div>
                  <Button className="mt-3 w-full" variant="ghost" onClick={() => removePaymentEntry(method, entry.id)}>기록 삭제</Button>
                </Card>
              )) : <p className="text-sm text-secondary">등록된 내역이 없습니다.</p>}
            </div>
          </div>
        ))}
      </section>
    </MobileShell>
  );
}
