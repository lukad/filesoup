import { For, JSX } from "solid-js";
import Header from "./Header";
import Footer from "./Footer";

const copy = {
  seed: {
    label: "Share a file",
    title: "Send a file straight from your browser",
    lede: "Choose a file and send the link. The other person downloads it directly from this tab over WebTorrent, so the file never passes through our server.",
    facts: [
      ["Account", "None needed"],
      ["File kept on", "Your device"],
      ["Link expires", "10 min after last use"],
    ],
    steps: [
      {
        title: "Choose a file",
        text: "Drop it on the box or use the button. Any file type works.",
      },
      {
        title: "Send the link",
        text: "Paste it into a chat or email, or show the QR code to a phone.",
      },
      {
        title: "Keep this tab open",
        text: "The file comes from your browser, so closing the tab stops the transfer.",
      },
    ],
  },
  leech: {
    label: "Receive a file",
    title: "Someone sent you a file",
    lede: "It downloads directly from the sender’s browser over WebTorrent. Keep this tab open until it finishes.",
    facts: [
      ["Sent from", "The sender’s browser"],
      ["Needs", "Both tabs open"],
      ["Saved to", "Your downloads"],
    ],
    steps: [
      {
        title: "Open the link",
        text: "No account or app needed.",
      },
      {
        title: "Wait for the connection",
        text: "Your browser connects straight to the sender’s.",
      },
      {
        title: "Find the file",
        text: "When it finishes, it’s in your browser’s downloads.",
      },
    ],
  },
};

export default function PageLayout(props: {
  mode: "seed" | "leech";
  children: JSX.Element;
}) {
  const text = () => copy[props.mode];

  return (
    <div class="page-shell">
      <Header />
      <main class="page-main">
        <section class="sharing-stage" aria-label={text().label}>
          <div class="intro">
            <h1>{text().title}</h1>
            <p class="lede">{text().lede}</p>
          </div>
          <div class="interaction-column">{props.children}</div>
          <dl class="facts">
            <For each={text().facts}>
              {([term, value]) => (
                <div>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              )}
            </For>
          </dl>
        </section>
        <section class="how-it-works" aria-labelledby="how-it-works-heading">
          <h2 id="how-it-works-heading" class="sr-only">
            How it works
          </h2>
          <ol class="steps">
            <For each={text().steps}>
              {(step, index) => (
                <li class="step">
                  <span class="step-index" aria-hidden="true">
                    {index() + 1}
                  </span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              )}
            </For>
          </ol>
        </section>
      </main>
      <Footer />
    </div>
  );
}
