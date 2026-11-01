import { nextStep, type NextStep, type PublishOutcome } from "./engine";

export interface PublishJob {
  id: string;
  accountId: string;
  postId: string;
  attempts: number;
}

/** Cada red implementa esto. `prepare` se puede repetir; `publish` es el único paso irreversible. */
export interface PublishProvider<Prepared = unknown> {
  prepare(job: PublishJob): Promise<Prepared>;
  publish(job: PublishJob, prepared: Prepared): Promise<PublishOutcome>;
}

export interface JobStore {
  claim(batch: number): Promise<PublishJob[]>;
  finish(job: PublishJob, step: NextStep): Promise<void>;
  markReconnect(accountId: string): Promise<void>;
}

/** Procesa un lote. Un fallo en un trabajo no detiene a los demás. */
export async function runBatch(store: JobStore, provider: PublishProvider, now: () => Date, batch = 5): Promise<number> {
  const jobs = await store.claim(batch);
  for (const job of jobs) {
    const step = await runJob(job, provider, now());
    await store.finish(job, step);
    if (step.status === "failed" && step.reconnect) await store.markReconnect(job.accountId);
  }
  return jobs.length;
}

async function runJob(job: PublishJob, provider: PublishProvider, now: Date): Promise<NextStep> {
  let prepared: unknown;
  try {
    prepared = await provider.prepare(job);
  } catch (error) {
    // Aún no se publicó nada, así que repetir es seguro.
    return nextStep({ kind: "rate_limited" }, job.attempts, now, Math.random(), messageOf(error));
  }
  try {
    return nextStep(await provider.publish(job, prepared), job.attempts, now);
  } catch (error) {
    // La llamada irreversible pudo llegar a la red: no se sabe si salió.
    return nextStep({ kind: "unknown", message: messageOf(error) }, job.attempts, now);
  }
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : "Error desconocido al publicar.");
