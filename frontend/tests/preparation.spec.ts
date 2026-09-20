import { expect, test, type Page } from "@playwright/test";
import { open, unlink } from "node:fs/promises";

type SeedAttempt = {
  progress: (bytes: number, total: number) => void;
  emit: (event: string, error?: Error) => void;
  finish: () => void;
  destroyed: boolean;
  paintedBeforeSeed: boolean;
  opacityBeforeSeed: string;
};
declare global {
  interface Window {
    seedTest: {
      attempts: SeedAttempt[];
      throwNext: boolean;
      painted: boolean;
    };
    preparationSamples: { time: number; percent: number }[];
    receivedFeedbackPainted: boolean;
  }
}

const file = {
  name: "example.bin",
  mimeType: "application/octet-stream",
  buffer: Buffer.alloc(100),
};

async function mockTransport(page: Page) {
  await page.addInitScript(() => {
    window.seedTest = { attempts: [], throwNext: false, painted: false };
    document.addEventListener(
      "change",
      () => {
        requestAnimationFrame(() => {
          window.seedTest.painted =
            !!document.querySelector(".preparation-card");
        });
      },
      true,
    );
  });
  await page.route("**/node_modules/.vite/deps/webtorrent.js*", (route) =>
    route.fulfill({
      contentType: "application/javascript",
      body: `export default class WebTorrent {
      on() { return this; }
      destroy() {}
      seed(files, options, ready) {
        if (window.seedTest.throwNext) {
          window.seedTest.throwNext = false;
          throw new Error('File unavailable');
        }
        const listeners = {};
        const attempt = {
          progress: options.onProgress,
          emit: (event, error) => listeners[event]?.(error),
          finish: () => ready(torrent),
          destroyed: false,
          paintedBeforeSeed: window.seedTest.painted,
          opacityBeforeSeed: getComputedStyle(document.querySelector('.preparation-card')).opacity,
        };
        const torrent = {
          magnetURI: 'magnet:?xt=urn:btih:preparation-test',
          on(event, callback) { listeners[event] = callback; return this; },
          once(event, callback) { listeners[event] = callback; return this; },
          destroy() { attempt.destroyed = true; },
        };
        window.seedTest.attempts.push(attempt);
        return torrent;
      }
    }`,
    }),
  );
}

async function selectFile(page: Page, input = file) {
  await page.locator('input[type="file"]').setInputFiles(input);
  await expect
    .poll(() => page.evaluate(() => window.seedTest.attempts.length))
    .toBeGreaterThan(0);
}

test.beforeEach(async ({ page }) => {
  await page.route("https://umami.fnord.tech/**", (route) => route.abort());
});

test("paints before seeding, reports real bytes, and distinguishes finalization from link creation", async ({
  page,
}) => {
  await mockTransport(page);
  let publish: () => Promise<void>;
  await page.route("**/files", (route) => {
    publish = () => route.fulfill({ json: { id: "fresh-link" } });
  });
  await page.goto("/");
  await selectFile(page);
  const progress = page.getByRole("progressbar");
  await expect(
    page.getByRole("heading", { name: "File selected." }),
  ).toBeVisible();
  await expect(page.locator(".preparation-starting .spinner")).toBeVisible();
  await expect(progress).toHaveCount(0);
  expect(
    await page.evaluate(() => window.seedTest.attempts[0].paintedBeforeSeed),
  ).toBe(true);
  expect(
    await page.evaluate(() => window.seedTest.attempts[0].opacityBeforeSeed),
  ).toBe("1");

  await page.evaluate(() => window.seedTest.attempts[0].progress(37, 100));
  await expect(progress).toHaveAttribute("aria-valuenow", "37");
  await expect(page.getByText("37 B of 100 B", { exact: true })).toBeVisible();
  await page.evaluate(() => window.seedTest.attempts[0].progress(100, 100));
  await expect(progress).toHaveAttribute("aria-label", "File prepared");
  await expect(
    page.getByText("Finishing preparation…", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Copy link", exact: true }),
  ).toHaveCount(0);

  await page.evaluate(() => window.seedTest.attempts[0].finish());
  await expect(
    page.getByText("Creating your share link…", { exact: true }),
  ).toBeVisible();
  await expect.poll(() => !!publish).toBe(true);
  await publish!();
  await expect(
    page.getByRole("button", { name: "Copy link", exact: true }),
  ).toBeVisible();
});

test("a drop immediately shows opaque feedback even when no progress callbacks arrive", async ({
  page,
}, testInfo) => {
  await mockTransport(page);
  await page.goto("/");
  const atDrop = await page.evaluate(() => {
    const transfer = new DataTransfer();
    transfer.items.add(new File(["hello"], "dropped-file.txt"));
    document
      .querySelector(".drop-mat")!
      .dispatchEvent(
        new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
      );
    const card = document.querySelector(".preparation-card")!;
    return {
      heading: card.querySelector("h2")?.textContent,
      opacity: getComputedStyle(card).opacity,
      animation: getComputedStyle(card).animationName,
      seedCalls: window.seedTest.attempts.length,
    };
  });
  expect(atDrop).toEqual({
    heading: "File selected.",
    opacity: "1",
    animation: "none",
    seedCalls: 0,
  });
  await expect
    .poll(() => page.evaluate(() => window.seedTest.attempts.length))
    .toBe(1);
  // Deliberately withhold every transport callback during this interval.
  // The receipt and spinner must remain visible throughout the initial wait.
  await page.waitForTimeout(1_000);
  await expect(
    page.getByRole("heading", { name: "File selected." }),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText("Getting ready…");
  await expect(page.locator(".preparation-starting .spinner")).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  await page.screenshot({
    path: testInfo.outputPath("immediate-feedback.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".preparation-starting .spinner")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("immediate-feedback-mobile.png"),
    fullPage: true,
  });
});

test("empty files finish preparation without NaN progress", async ({
  page,
}) => {
  await mockTransport(page);
  await page.route("**/files", (route) =>
    route.fulfill({ json: { id: "empty-file" } }),
  );
  await page.goto("/");
  await selectFile(page, { ...file, buffer: Buffer.alloc(0) });
  await expect(
    page.getByRole("heading", { name: "File selected." }),
  ).toBeVisible();
  await page.evaluate(() => window.seedTest.attempts[0].emit("metadata"));
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "100",
  );
  await page.evaluate(() => window.seedTest.attempts[0].finish());
  await expect(
    page.getByRole("button", { name: "Copy link", exact: true }),
  ).toBeVisible();
});

test("read failures allow retry and ignore late callbacks from the failed attempt", async ({
  page,
}) => {
  await mockTransport(page);
  await page.goto("/");
  await selectFile(page);
  await page.evaluate(() =>
    window.seedTest.attempts[0].emit("error", new Error("Read failed")),
  );
  await expect(page.getByRole("alert")).toContainText(
    "Couldn't prepare this file",
  );
  expect(await page.evaluate(() => window.seedTest.attempts[0].destroyed)).toBe(
    true,
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await selectFile(page);
  await expect
    .poll(() => page.evaluate(() => window.seedTest.attempts.length))
    .toBe(2);
  await page.evaluate(() => {
    window.seedTest.attempts[0].progress(100, 100);
    window.seedTest.attempts[0].finish();
  });
  await expect(
    page.getByRole("heading", { name: "File selected." }),
  ).toBeVisible();
  await page.evaluate(() => window.seedTest.attempts[1].progress(50, 100));
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "50",
  );
});

test("synchronous preparation errors and failed link requests don't leave a spinner", async ({
  page,
}) => {
  await mockTransport(page);
  await page.route("**/files", (route) => route.fulfill({ status: 500 }));
  await page.goto("/");
  await page.evaluate(() => {
    window.seedTest.throwNext = true;
  });
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole("alert")).toContainText(
    "Couldn't prepare this file",
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await selectFile(page);
  await page.evaluate(() => window.seedTest.attempts[0].finish());
  await expect(page.getByRole("alert")).toContainText(
    "Failed to create shareable link",
  );
  await expect(page.getByRole("progressbar")).toHaveCount(0);
  expect(await page.evaluate(() => window.seedTest.attempts[0].destroyed)).toBe(
    true,
  );
});

test("deferred work can be cancelled and still starts in a background tab", async ({
  page,
}) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    // Vite serves the actual helper. Emulate requestAnimationFrame being paused.
    const modulePath = "/src/utils/afterPaint.ts";
    const { afterPaint } = await import(/* @vite-ignore */ modulePath);
    const originalFrame = window.requestAnimationFrame;
    const originalCancel = window.cancelAnimationFrame;
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    window.requestAnimationFrame = () => 123;
    window.cancelAnimationFrame = () => {};
    let cancelledCalls = 0;
    let backgroundCalls = 0;
    try {
      afterPaint(() => cancelledCalls++)();
      await new Promise<void>((resolve) =>
        afterPaint(() => {
          backgroundCalls++;
          resolve();
        }),
      );
      return { cancelledCalls, backgroundCalls };
    } finally {
      delete (document as Partial<Document>).hidden;
      window.requestAnimationFrame = originalFrame;
      window.cancelAnimationFrame = originalCancel;
    }
  });
  expect(result).toEqual({ cancelledCalls: 0, backgroundCalls: 1 });
});

test("dropping a real 600 MB file shows receipt before progress and produces a share link", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const filePath = testInfo.outputPath("large-file.bin");
  const largeFile = await open(filePath, "w");
  await largeFile.truncate(600_000_000);
  await largeFile.close();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("**/files", (route) =>
    route.fulfill({ json: { id: "large-file" } }),
  );
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });
  try {
    await page.goto("/");
    await page.evaluate(() => {
      window.preparationSamples = [];
      window.receivedFeedbackPainted = false;
      const start = performance.now();
      const sample = () => {
        if (document.querySelector(".preparation-starting"))
          window.receivedFeedbackPainted = true;
        const bar = document.querySelector('[role="progressbar"]');
        if (bar)
          window.preparationSamples.push({
            time: performance.now() - start,
            percent: Number(bar.getAttribute("aria-valuenow")),
          });
        requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    // Obtain a browser File backed by the real disk file, then deliver it via
    // the same DataTransfer/drop path used when dragging in from the desktop.
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.type = "file";
      input.id = "large-file-fixture";
      input.hidden = true;
      document.body.appendChild(input);
    });
    await page.locator("#large-file-fixture").setInputFiles(filePath);
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>(
        "#large-file-fixture",
      )!;
      const transfer = new DataTransfer();
      transfer.items.add(input.files![0]);
      document
        .querySelector(".drop-mat")!
        .dispatchEvent(
          new DragEvent("drop", { bubbles: true, dataTransfer: transfer }),
        );
      input.remove();
    });
    await expect(
      page.getByRole("button", { name: "Copy link", exact: true }),
    ).toBeVisible({ timeout: 60_000 });
    const samples = await page.evaluate(() => window.preparationSamples);
    expect(samples.length).toBeGreaterThan(1);
    expect(await page.evaluate(() => window.receivedFeedbackPainted)).toBe(
      true,
    );
    expect(
      samples.some((sample) => sample.percent > 0 && sample.percent < 100),
    ).toBe(true);
    expect(
      samples.every(
        (sample) =>
          Number.isFinite(sample.percent) &&
          sample.percent >= 0 &&
          sample.percent <= 100,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
    await testInfo.attach("preparation-progress", {
      body: JSON.stringify(samples, null, 2),
      contentType: "application/json",
    });
  } finally {
    await cdp.detach();
    await unlink(filePath);
  }
});
