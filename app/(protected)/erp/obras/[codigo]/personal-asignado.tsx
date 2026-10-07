import { Phone, ShieldAlert, Users } from "lucide-react";
import { formatPhoneNumber } from "@/lib/formatters";

export type EmpleadoAsignado = {
  id: number;
  nombre: string;
  apellido: string;
  apodo: string | null;
  telefono: string;
  contacto_emergencia_nombre: string | null;
  telefono_emergencia: string | null;
};

const phoneDigits = (phone: string) => phone.replace(/\D/g, "");

function getWhatsAppLink(phone: string) {
  const digits = phoneDigits(phone).replace(/^0+/, "");
  const internationalPhone = digits.startsWith("549")
    ? digits
    : digits.startsWith("54")
      ? `549${digits.slice(2)}`
      : `549${digits}`;

  return `https://wa.me/${internationalPhone}`;
}

export function PersonalAsignado({
  empleados,
  error,
}: {
  empleados: EmpleadoAsignado[];
  error?: string;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200/80 bg-white shadow-sm" aria-labelledby="personal-asignado">
      <header className="border-b border-neutral-200/80 bg-neutral-50/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Users aria-hidden="true" className="text-[#3E2723]" size={18} />
          <h2 id="personal-asignado" className="text-base font-semibold text-neutral-800">
            Personal asignado
          </h2>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          Operarios actualmente vinculados a esta obra.
        </p>
      </header>

      {error ? (
        <p className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          No se pudo cargar el personal asignado: {error}
        </p>
      ) : empleados.length === 0 ? (
        <div className="m-4 rounded-xl border-2 border-dashed border-neutral-200 p-6 text-center text-neutral-500">
          <Users aria-hidden="true" className="mx-auto mb-2 text-neutral-300" size={32} strokeWidth={1.5} />
          <p className="text-sm font-medium">No hay operarios asignados a esta obra.</p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {empleados.map((empleado) => (
            <li className="px-4 py-3 hover:bg-neutral-50/50" key={empleado.id}>
              <p className="font-medium text-neutral-800">
                  {empleado.nombre} {empleado.apellido}
                  {empleado.apodo && (
                    <span className="ml-2 rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">
                      &quot;{empleado.apodo}&quot;
                    </span>
                  )}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <a
                  aria-label={`Llamar a ${empleado.nombre} ${empleado.apellido}`}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-700 hover:text-[#3E2723]"
                  href={`tel:+${phoneDigits(empleado.telefono)}`}
                >
                  <Phone aria-hidden="true" size={15} />
                  {formatPhoneNumber(empleado.telefono)}
                </a>
                <a
                  aria-label={`Enviar WhatsApp a ${empleado.nombre} ${empleado.apellido}`}
                  className="inline-flex items-center rounded-md border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
                  href={getWhatsAppLink(empleado.telefono)}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  WhatsApp
                </a>
              </div>
              {empleado.contacto_emergencia_nombre || empleado.telefono_emergencia ? (
                <p className="mt-2 flex items-start gap-1.5 text-xs text-neutral-500">
                  <ShieldAlert aria-hidden="true" className="mt-0.5 shrink-0" size={13} />
                  <span>
                    Emergencia: {empleado.contacto_emergencia_nombre ?? "Sin contacto"}
                    {empleado.telefono_emergencia && ` · ${formatPhoneNumber(empleado.telefono_emergencia)}`}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-400">Sin contacto de emergencia registrado</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
