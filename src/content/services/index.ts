import { GYOGYSZERFELIRAS } from "./gyogyszerfeliras";
import { NOGYOGYASZAT } from "./nogyogyaszat";
import { SZULESZET } from "./szuleszet";
import type { ServiceContent, ServiceSlug } from "./types";
import { VARANDOSGONDOZAS } from "./varandosgondozas";

export type * from "./types";

export const SERVICE_CONTENT: Record<ServiceSlug, ServiceContent> = {
  nogyogyaszat: NOGYOGYASZAT,
  szuleszet: SZULESZET,
  varandosgondozas: VARANDOSGONDOZAS,
  gyogyszerfeliras: GYOGYSZERFELIRAS,
};
