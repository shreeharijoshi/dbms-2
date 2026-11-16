import { icon } from "./icons.js";

export function launchScreen() {
  return `<main class="launch-screen" role="status" aria-live="polite">
    <div class="launch-glow launch-glow-one" aria-hidden="true"></div>
    <div class="launch-glow launch-glow-two" aria-hidden="true"></div>
    <div class="launch-content">
      <div class="launch-mark">${icon("dumbbell")}</div>
      <p class="launch-kicker">GYM MANAGEMENT SYSTEM</p>
      <h1>Iron<span>Core</span></h1>
      <p class="launch-message">Preparing your workspace</p>
      <div class="launch-progress" aria-hidden="true"><span></span></div>
    </div>
  </main>`;
}
