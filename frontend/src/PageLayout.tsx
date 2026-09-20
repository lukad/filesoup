import { For, JSX } from "solid-js";
import Header from "./Header";
import Footer from "./Footer";
import { HandUnderline } from "./Illustrations";

export default function PageLayout(props: {
  mode: "seed" | "leech";
  children: JSX.Element;
}) {
  const sending = () => props.mode === "seed";
  const steps = () =>
    sending()
      ? [
          {
            title: "Choose a file.",
            text: "Drag it in or use the file picker.",
          },
          {
            title: "Share the link.",
            text: "Send the link or show the QR code.",
          },
          {
            title: "Keep this tab open.",
            text: "Both browsers must stay open during the transfer.",
          },
        ]
      : [
          {
            title: "Open the link.",
            text: "No account or app needed.",
          },
          {
            title: "Keep this tab open.",
            text: "The sender’s tab must stay open too.",
          },
          {
            title: "Find your file.",
            text: "Check your browser’s downloads when it finishes.",
          },
        ];

  return (
    <div class="page-shell">
      <Header icon={props.mode} />
      <main class="page-main">
        <section
          class="sharing-stage"
          aria-label={sending() ? "Share a file" : "Receive a file"}
        >
          <div class="intro">
            <h1>
              {sending() ? (
                <>
                  File sharing,
                  <br />
                  <em>
                    browser to browser.
                    <HandUnderline />
                  </em>
                </>
              ) : (
                <>
                  Receive
                  <br />
                  <em>
                    a file.
                    <HandUnderline />
                  </em>
                </>
              )}
            </h1>
            <p class="intro-description">
              {sending()
                ? "Drop in a file and send someone the link. The file transfers directly between your browsers, without being stored on a server."
                : "Download the file directly from the sender’s browser. Keep this tab open until it finishes."}
            </p>
            <div class="intro-details">
              <span>No accounts.</span>
              <span>No cloud storage.</span>
            </div>
          </div>
          <div class="interaction-column">{props.children}</div>
        </section>
        <section class="how-it-works" aria-label="How it works">
          <div class="steps">
            <For each={steps()}>
              {(step, index) => (
                <div class="step">
                  <span class="step-number">0{index() + 1}</span>
                  <div>
                    <h2>{step.title}</h2>
                    <p>{step.text}</p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
