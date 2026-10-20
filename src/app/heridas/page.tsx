import { obtenerPacientesYHeridas } from "@/lib/heridas/actions";
import { HeridasClientView } from "./HeridasClientView";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ pacienteId?: string; heridaId?: string }>;
}

export default async function HeridasPage({ searchParams }: Props) {
  const { pacienteId, heridaId } = await searchParams;
  const pacientes = await obtenerPacientesYHeridas();

  return (
    <HeridasClientView
      pacientes={pacientes}
      pacienteInicialId={pacienteId}
      heridaInicialId={heridaId}
    />
  );
}
