"use client";

import { useEffect, useRef, useState } from "react";
import { FormProvider, useForm, type FieldPath } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Asterisk,
  Check,
  CheckCheck,
  CircleHelp,
  Clock3,
  Copy,
  Lightbulb,
  LoaderCircle,
  LockKeyhole,
  PartyPopper,
  Sparkles,
  X,
} from "lucide-react";
import {
  requirementSchema,
  type RequirementInput,
} from "@event-manager/shared";
import {
  categories,
  defaultValues,
  getPayload,
  validateStep,
  type FormValues,
} from "@/lib/form";
import {
  postRequirement,
  SubmissionError,
  type SavedRequirement,
} from "@/lib/api";
import { EventBasics } from "./event-basics";
import { ServiceDetails } from "./service-details";
import { BudgetDetails } from "./budget-details";
import { Review } from "./review";
import { Confetti } from "./confetti";

const steps = [
  {
    label: "Event basics",
    description: "The what, when & where",
    title: "First, tell us about your event.",
    subtitle:
      "Big celebration or an intimate gathering — start with the essentials.",
  },
  {
    label: "Your requirements",
    description: "Find your kind of people",
    title: "Every great event needs great people.",
    subtitle:
      "Tell us what you’re looking for. We’ll keep it relevant to your event.",
  },
  {
    label: "Budget & details",
    description: "Make it your own",
    title: "Let’s get the details right.",
    subtitle: "Set a budget and share the things that matter to you.",
  },
  {
    label: "Review & post",
    description: "One last look, then you’re set",
    title: "Looking good. Ready to post?",
    subtitle:
      "Take a moment to check your requirement before sending it through.",
  },
];
const tips = [
  "A clear event name and location make your requirement easier to understand.",
  "Be specific about the help you need. A little context goes a long way.",
  "Share a comfortable budget range and any must-haves for your event.",
  "Give the dates, headcount, and budget one last check. You can still edit them here.",
];

export function RequirementWizard() {
  const form = useForm<FormValues>({ defaultValues });
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [animKey, setAnimKey] = useState(0);
  const [stepCompletedNotice, setStepCompletedNotice] = useState<{
    stepIndex: number;
    title: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [dateRange, setDateRange] = useState(false);
  const [review, setReview] = useState<RequirementInput | null>(null);
  const [saved, setSaved] = useState<SavedRequirement | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const request = useRef({ payload: "", key: "" });
  const title = useRef<HTMLHeadingElement>(null);
  const help = useRef<HTMLDialogElement>(null);
  const noticeTimer = useRef<NodeJS.Timeout | null>(null);
  const startDate = form.watch("event.startDate");
  const category = form.watch("category");

  const progressPercent = saved ? 100 : Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    if (!dateRange) form.setValue("event.endDate", startDate);
  }, [startDate, dateRange, form]);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
  }, [step, saved]);

  function goTo(next: number) {
    if (next === step) return;
    setDirection(next > step ? "forward" : "backward");
    setMessage("");
    form.clearErrors();
    setStep(next);
    setAnimKey((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function advance() {
    if (busy.current) return;
    setMessage("");
    form.clearErrors();
    const values = form.getValues();
    const result = validateStep(step, values);
    if (!result.success) {
      for (const issue of result.error.issues)
        form.setError(issue.path.join(".") as FieldPath<FormValues>, {
          message: issue.message,
        });
      setMessage(
        "A few details need your attention. Please check the fields below.",
      );
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }

    // Trigger step completed celebratory feedback
    const completedTitle = steps[step].label;
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setStepCompletedNotice({ stepIndex: step, title: completedTitle });
    noticeTimer.current = setTimeout(() => {
      setStepCompletedNotice(null);
    }, 2800);

    if (step < 3) {
      if (step === 2) setReview(requirementSchema.parse(getPayload(values)));
      setDirection("forward");
      setStep(step + 1);
      setAnimKey((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const payload = requirementSchema.parse(getPayload(values));
    const serialized = JSON.stringify(payload);
    if (request.current.payload !== serialized)
      request.current = { payload: serialized, key: crypto.randomUUID() };
    busy.current = true;
    setPending(true);
    try {
      const created = await postRequirement(payload, request.current.key);
      setSaved(created);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit. Please try again.",
      );
      if (error instanceof SubmissionError && error.fields.length) {
        for (const field of error.fields)
          form.setError(field.field as FieldPath<FormValues>, {
            message: field.message,
          });
        const first = error.fields[0].field;
        setDirection("backward");
        setStep(
          first.startsWith("event") || first === "category"
            ? 0
            : first.startsWith("details")
              ? 1
              : 2,
        );
        setAnimKey((prev) => prev + 1);
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function startAgain() {
    form.reset(defaultValues);
    setSaved(null);
    setReview(null);
    setDateRange(false);
    setDirection("forward");
    setAnimKey(0);
    setStepCompletedNotice(null);
    request.current = { payload: "", key: "" };
    goTo(0);
  }

  function copyRequirementId(id: string) {
    void navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a href="/" className="brand" aria-label="GoPratle home">
            <span className="brand-mark">
              <Asterisk size={28} strokeWidth={2.8} />
            </span>
            <span className="brand-text">gopratle</span><span className="brand-period">.</span>
          </a>
          <div className="header-right">
            <button
              type="button"
              className="help-button"
              onClick={() => help.current?.showModal()}
            >
              <CircleHelp size={17} />
              <span>How it works</span>
            </button>
          </div>
        </div>
      </header>
      <main className="workspace">
        <aside className="sidebar">
          <span className="eyebrow">LET’S BRING IT TO LIFE</span>
          <h2>
            Your event.
            <br />
            Your people.
          </h2>
          <p className="sidebar-intro">
            A few details today.
            <br />
            Something memorable tomorrow.
          </p>
          <nav aria-label="Requirement progress">
            <ol className="step-list">
              {steps.map((item, index) => {
                const complete = saved || index < step;
                return (
                  <li
                    className={`${index === step && !saved ? "active" : ""} ${complete ? "complete" : ""}`}
                    key={item.label}
                    aria-current={index === step && !saved ? "step" : undefined}
                  >
                    <button
                      type="button"
                      disabled={pending || !!saved || index >= step}
                      onClick={() => goTo(index)}
                    >
                      <span className="step-number">
                        {complete ? (
                          <Check size={16} strokeWidth={2.5} className="step-check-icon" />
                        ) : (
                          `0${index + 1}`
                        )}
                      </span>
                      <span>
                        <strong>{item.label}</strong>
                        <small>{item.description}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <div className="sidebar-note">
            <span className="tip-icon">
              <Lightbulb size={18} />
            </span>
            <strong>A little tip</strong>
            <p>{tips[step]}</p>
            <div className="note-decoration" aria-hidden="true">
              <span />
              <span />
              <span />
              <Asterisk size={35} />
            </div>
          </div>
          <div className="sidebar-time">
            <Clock3 size={14} /> About 3 minutes. All about your event.
          </div>
        </aside>
        <div className="main-column">
          {saved ? (
            <>
              <Confetti />
              <section className="success-card" aria-labelledby="success-title">
                <div className="success-icon-wrap">
                  <div className="success-icon">
                    <PartyPopper size={37} strokeWidth={1.5} />
                  </div>
                </div>
                <span className="eyebrow">YOU’RE ALL SET</span>
                <h1 id="success-title" ref={title} tabIndex={-1}>
                  One step closer to
                  <br />a great event.
                </h1>
                <p>
                  Your {categories[saved.category].short.toLowerCase()}{" "}
                  requirement for <strong>{review?.event.name}</strong> has been
                  posted successfully.
                </p>
                <div className="success-receipt">
                  <span className="receipt-category">
                    <CheckCheck size={17} /> Saved under{" "}
                    {categories[saved.category].label}
                  </span>
                  <small>Requirement ID</small>
                  <div className="receipt-code-row">
                    <code>{saved.id}</code>
                    <button
                      type="button"
                      className="copy-btn"
                      onClick={() => copyRequirementId(saved.id)}
                      title="Copy Requirement ID"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-green" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  className="button primary"
                  type="button"
                  onClick={startAgain}
                >
                  Post another requirement
                  <ArrowRight size={17} />
                </button>
                <p className="success-footnote">
                  Need a different service for the same event? Create a separate
                  requirement for that category.
                </p>
              </section>
            </>
          ) : (
            <>
              <div className="page-heading animate-fade-in" key={`heading-${step}`}>
                <div className="heading-meta">
                  <span className="eyebrow">A GREAT EVENT STARTS HERE</span>
                  <span className="step-count">STEP {step + 1} OF 4</span>
                </div>
                <h1 ref={title} tabIndex={-1}>
                  {steps[step].title}
                </h1>
                <p>{steps[step].subtitle}</p>
              </div>
              <FormProvider {...form}>
                <form
                  className="form-card"
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void advance();
                  }}
                  aria-busy={pending}
                >
                  <div
                    className="wizard-progress-track"
                    role="progressbar"
                    aria-valuenow={progressPercent}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`Step ${step + 1} of 4: ${progressPercent}% complete`}
                  >
                    <div
                      className="wizard-progress-fill"
                      style={{ width: `${progressPercent}%` }}
                    >
                      <span className="wizard-progress-glow" />
                    </div>
                  </div>
                  <div className="form-card-top">
                    <div className="card-top-left">
                      <span className="card-label">
                        {step === 0
                          ? "THE ESSENTIALS"
                          : `${categories[category].label.toUpperCase()} REQUIREMENT`}
                      </span>
                      {stepCompletedNotice && (
                        <span className="step-complete-pill animate-pop-in" role="status">
                          <Check size={12} strokeWidth={2.8} />
                          <span>{stepCompletedNotice.title} saved</span>
                        </span>
                      )}
                    </div>
                    <span className="card-step-badge">
                      <Sparkles size={13} className="sparkle-icon" />
                      Step {step + 1} of 4 • {progressPercent}%
                    </span>
                  </div>
                  <div
                    className={`form-body step-animated step-${direction}`}
                    key={`step-${step}-${animKey}`}
                  >
                    {message && (
                      <div className="error-banner animate-shake" role="alert">
                        {message}
                      </div>
                    )}
                    {step === 0 && (
                      <EventBasics
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                      />
                    )}
                    {step === 1 && <ServiceDetails />}
                    {step === 2 && <BudgetDetails />}
                    {step === 3 && review && (
                      <Review data={review} onEdit={goTo} />
                    )}
                  </div>
                  <div className="form-footer">
                    {step > 0 ? (
                      <button
                        className="button secondary"
                        type="button"
                        disabled={pending}
                        onClick={() => goTo(step - 1)}
                      >
                        <ArrowLeft size={16} />
                        Back
                      </button>
                    ) : (
                      <span className="footer-note">
                        <LockKeyhole size={14} />
                        No payment required
                      </span>
                    )}
                    <button
                      className="button primary"
                      type="submit"
                      disabled={pending}
                    >
                      {pending ? (
                        <>
                          <LoaderCircle className="spinner" size={17} />
                          Posting…
                        </>
                      ) : (
                        <>
                          {step === 3
                            ? "Post requirement"
                            : step === 2
                              ? "Review requirement"
                              : "Continue"}
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </FormProvider>
              <p className="below-form">
                Made for the moments that bring people together.
              </p>
            </>
          )}
        </div>
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} GoPratle</span>
        <span>A little planning. A lot of possibility.</span>
      </footer>
      <dialog
        ref={help}
        className="help-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) help.current?.close();
        }}
      >
        <div>
          <button
            className="dialog-close"
            type="button"
            aria-label="Close help"
            onClick={() => help.current?.close()}
          >
            <X size={20} />
          </button>
          <span className="eyebrow">FOUR SIMPLE STEPS</span>
          <h2>From an idea to a clear brief.</h2>
          <ol>
            {steps.map((item) => (
              <li key={item.label}>
                <strong>{item.label}</strong>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
          <p>
            Each post is for one category. Your details are saved when you
            select “Post requirement”. You can go back and edit any step before
            posting.
          </p>
          <button
            className="button primary"
            type="button"
            onClick={() => help.current?.close()}
          >
            Got it
            <Check size={16} />
          </button>
        </div>
      </dialog>
    </>
  );
}
