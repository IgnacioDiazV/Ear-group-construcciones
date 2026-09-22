"use client";

import { useSearchParams } from "next/navigation";

type Props = {
  comprobantes?: React.ReactNode;
  liquidaciones?: React.ReactNode;
  cobros?: React.ReactNode;
};

export function ContabilidadContent({ comprobantes, liquidaciones, cobros }: Props) {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "comprobantes";

  return (
    <>
      {activeTab === "comprobantes" && comprobantes}
      {activeTab === "liquidaciones" && liquidaciones}
      {activeTab === "cobros" && cobros}
    </>
  );
}
