import { CampoSelect } from "./CampoSelect";

/** Select de "Sí" / "No" / sin especificar — para no confundir "false" con "no lo he mirado". */
export function CampoTriEstado({
  etiqueta,
  nombre,
  valorPrevio,
}: {
  etiqueta: string;
  nombre: string;
  valorPrevio?: boolean | null;
}) {
  const defaultValue = valorPrevio === true ? "si" : valorPrevio === false ? "no" : "";
  return (
    <CampoSelect
      etiqueta={etiqueta}
      nombre={nombre}
      defaultValue={defaultValue}
      opciones={[
        { valor: "si", texto: "Sí" },
        { valor: "no", texto: "No" },
      ]}
    />
  );
}
