import { CalendarDays, ClipboardList, MapPin, Pencil } from "lucide-react";
import type { RequirementInput } from "@event-manager/shared";
import { categories, formatBudget, formatDate } from "@/lib/form";

export function Review({
  data,
  onEdit,
}: {
  data: RequirementInput;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="review">
      <div className="review-event">
        <span className="eyebrow">{data.event.type}</span>
        <h2>{data.event.name}</h2>
        <div>
          <span>
            <CalendarDays size={15} />
            {formatDate(data.event.startDate)}
            {data.event.endDate !== data.event.startDate &&
              ` – ${formatDate(data.event.endDate)}`}
          </span>
          <span>
            <MapPin size={15} />
            {data.event.location}
            {data.event.venue && ` · ${data.event.venue}`}
          </span>
        </div>
        <button type="button" className="edit-button" onClick={() => onEdit(0)}>
          <Pencil size={14} />
          Edit event
        </button>
      </div>
      <section className="review-section">
        <div className="review-heading">
          <h3>
            <ClipboardList size={17} />
            {categories[data.category].label} requirement
          </h3>
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(1)}
          >
            <Pencil size={14} />
            Edit services
          </button>
        </div>
        <dl className="review-list">
          {data.category === "planner" && (
            <>
              <div>
                <dt>Services</dt>
                <dd className="tag-list">
                  {data.details.services.map((service) => (
                    <span className="tag" key={service}>
                      {service}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{data.details.guestCount.toLocaleString()}</dd>
              </div>
            </>
          )}
          {data.category === "performer" && (
            <>
              <div>
                <dt>Performer</dt>
                <dd>{data.details.performerType}</dd>
              </div>
              <div>
                <dt>People</dt>
                <dd>{data.details.performerCount}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{data.details.durationMinutes} minutes</dd>
              </div>
              <div>
                <dt>Equipment</dt>
                <dd>{data.details.equipment}</dd>
              </div>
            </>
          )}
          {data.category === "crew" && (
            <>
              <div>
                <dt>Crew</dt>
                <dd className="tag-list">
                  {data.details.roles.map((item) => (
                    <span className="tag" key={item.role}>
                      {item.role} × {item.count}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt>Shift</dt>
                <dd>{data.details.shiftHours} hours per person</dd>
              </div>
            </>
          )}
        </dl>
      </section>
      <section className="review-section">
        <div className="review-heading">
          <h3>Budget & additional details</h3>
          <button
            type="button"
            className="edit-button"
            onClick={() => onEdit(2)}
          >
            <Pencil size={14} />
            Edit details
          </button>
        </div>
        <div className="budget-preview">
          {formatBudget(data.budget)}
          <span>Total estimated budget</span>
        </div>
        <p className="review-notes">{data.notes || "No additional notes."}</p>
      </section>
      <p className="review-disclaimer">
        Everything looking good? Post your requirement to save these details
        under {categories[data.category].label.toLowerCase()}.
      </p>
    </div>
  );
}
