import type { EventType } from "../../hooks/events";

export interface EventsFilterState {
  types: EventType[];
}

export default function EventsFilters(_props: {
  value: EventsFilterState;
  onChange: (next: EventsFilterState) => void;
}) {
  return null; // filled in Step 5.3
}
